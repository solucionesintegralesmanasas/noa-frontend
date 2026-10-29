<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { useTrackingStore } from '../store/tracking.store';
import { useGeolocation } from '@/hooks/useGeolocation';
import { conductoresVigentes, textoUltimoReporte } from '../utils/conductoresVigentes';
import {
    debeAnimarSalto,
    duracionDeTransicion,
    posicionInterpolada,
    puntoDeConductor,
    rumboEntrePuntos,
} from '../utils/movimientoDeConductor';
import { logger } from '@/utils/logger.js';

const props = defineProps({
    showGeofences: { type: Boolean, default: true },
    interactive: { type: Boolean, default: true },
    showLegend: { type: Boolean, default: true },
    fullscreen: { type: Boolean, default: false },
    /** Estela del viaje actual que va dibujando cada conductor. */
    showTrails: { type: Boolean, default: true },
    /** Conductor bajo seguimiento: su estela marca el punto de arranque. */
    focusUuid: { type: String, default: null },
    /** La cámara acompaña al conductor foco en cada reporte. */
    follow: { type: Boolean, default: false },
    /** Texto del botón de recentrado (flota completa o un conductor). */
    centerLabel: { type: String, default: 'Centrar flota' },
});

const emit = defineEmits(['driver-selected']);

const store = useTrackingStore();
const { loadLeaflet } = useGeolocation();

let map = null;
let markers = {};
let geofenceLayers = [];
let polylineLayer = null;
let trailLayers = {};
let trailStartLayers = {};

const DEFAULT_CENTER = [4.710993, -74.072068];
const DEFAULT_ZOOM = 12;

const COLOR_RUTA = '#3b82f6';

const driverIcon = (isMoving, initials = '?', heading = null) => {
    const color = isMoving ? '#22c55e' : '#f59e0b';
    const colorPunta = isMoving ? '#16a34a' : '#b45309';
    const rotacion = heading == null ? '' : `transform:rotate(${heading}deg);`;
    const contrarrotacion = heading == null ? '' : `transform:rotate(${-heading}deg);`;
    const punta = heading == null
        ? ''
        : `<div style="position:absolute;left:50%;top:-5px;transform:translateX(-50%);width:0;height:0;
              border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:9px solid ${colorPunta};"></div>`;

    return `
        <div style="width:38px;height:38px;position:relative;${rotacion}">
            ${punta}
            <div style="
                width:38px;height:38px;${contrarrotacion}
                border-radius:50%;
                background:${color};
                border:3px solid white;
                box-shadow:0 2px 10px rgba(0,0,0,.25);
                display:flex;align-items:center;justify-content:center;
                color:white;font-size:12px;font-weight:700;letter-spacing:.5px;
                box-sizing:border-box;
            ">${initials}</div>
        </div>
    `;
};

function setupMap(L) {
    map = L.map('trackingMap', {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(map);

    if (store.selectedDriver?.history) {
        drawHistory(L, store.selectedDriver.history);
    }

    if (props.showGeofences) {
        drawAllGeofences();
    }
}

function clearGeofences() {
    if (!map) return;
    geofenceLayers.forEach((layer) => map.removeLayer(layer));
    geofenceLayers = [];
}

function drawAllGeofences() {
    if (!map || !window.L) return;
    clearGeofences();
    store.geofences
        .filter((gf) => gf.is_active !== false)
        .forEach((gf) => drawGeofence(window.L, gf));
}

watch(
    () => props.showGeofences,
    (show) => {
        if (!map) return;
        if (show) {
            drawAllGeofences();
        } else {
            clearGeofences();
        }
    }
);

watch(
    () => store.activeDrivers,
    () => {
        updateMap();
    }
);

watch(
    () => store.selectedDriver,
    (driver) => {
        if (!map || !driver) return;
        const marker = markers[driverUuid(driver)];
        if (marker) map.panTo(marker.getLatLng(), { animate: true });
    }
);

// Las estelas se redibujan cuando el store cambia una estela (sello escalar,
// sin sondeo ni temporizador propio: ARQ-009).
watch(
    () => store.trailRevision,
    () => {
        sincronizarEstelas();
    }
);

watch(
    () => props.showTrails,
    (show) => {
        if (!map) return;
        if (show) {
            sincronizarEstelas();
        } else {
            limpiarEstelas();
        }
    }
);

watch(
    () => props.focusUuid,
    (uuid) => {
        const marker = uuid ? markers[uuid] : null;
        if (map && marker) map.panTo(marker.getLatLng(), { animate: true });
    }
);

watch(
    () => props.fullscreen,
    () => {
        if (!map) return;
        // Al entrar o salir de pantalla completa el contenedor cambia de tamaño:
        // sin invalidateSize el mapa no ocupa toda la pantalla.
        setTimeout(() => map.invalidateSize(), 50);
    }
);


function getDriverInitials(driver) {
    const first = driver.driver?.first_name || driver.first_name || '';
    const last = driver.driver?.last_name || driver.last_name || '';
    if (first && last) return (first[0] + last[0]).toUpperCase();
    return (first[0] || '?').toUpperCase();
}

function driverUuid(driver) {
    return driver?.third_party_uuid || driver?.driver?.uuid || null;
}

/* ─── Movimiento del marcador ─────────────────────────────────────────────
   El teléfono manda un punto cada ~10 s. Para que el vehículo se vea
   desplazarse y no saltar, cada transición se interpola con requestAnimationFrame
   (un solo bucle para todos los marcadores) y los saltos antinaturales se
   "snapean" en vez de animarse. */

const transiciones = new Map();
let rafId = null;

function pasoDeAnimacion(ts) {
    rafId = null;
    let pendientes = false;

    transiciones.forEach((tr, uuid) => {
        const avance = Math.min(1, (ts - tr.inicio) / tr.duracion);
        const [lat, lng] = posicionInterpolada(tr.desde, tr.hasta, avance);
        tr.marca.setLatLng([lat, lng]);
        if (avance < 1) {
            pendientes = true;
        } else {
            transiciones.delete(uuid);
        }
    });

    if (pendientes) rafId = requestAnimationFrame(pasoDeAnimacion);
}

function iniciarTransicion(uuid, marca, hasta) {
    const actual = marca.getLatLng();
    const desde = { latitude: actual.lat, longitude: actual.lng };
    if (!debeAnimarSalto(desde, hasta)) {
        marca.setLatLng([hasta.latitude, hasta.longitude]);
        return false;
    }
    transiciones.set(uuid, {
        marca,
        desde,
        hasta,
        duracion: duracionDeTransicion(desde, hasta),
        inicio: (typeof performance !== 'undefined' ? performance.now() : Date.now()),
    });
    if (rafId === null) rafId = requestAnimationFrame(pasoDeAnimacion);
    return true;
}

function cancelarAnimaciones() {
    transiciones.clear();
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
}

/** Rumbo del vehículo: el del GPS si llega; si no, el del desplazamiento. */
function rumboDe(driver, desde, hasta) {
    const delGps = Number(driver?.heading ?? driver?.last_location?.heading);
    if (Number.isFinite(delGps) && delGps >= 0) return delGps;
    if (!desde || !hasta) return null;
    if (!debeAnimarSalto(desde, hasta)) return null;
    return Math.round(rumboEntrePuntos(desde, hasta));
}

function drawDriver(L, driver) {
    if (!driver?.latitude && !driver?.last_location?.latitude) {
        return;
    }

    const uuid = driverUuid(driver);
    if (!uuid) return;

    const lat = driver.latitude ?? driver.last_location?.latitude;
    const lng = driver.longitude ?? driver.last_location?.longitude;
    const isMoving = driver.is_moving ?? driver.last_location?.is_moving ?? false;
    const initials = getDriverInitials(driver);

    let seMovio;

    if (markers[uuid]) {
        const marca = markers[uuid];
        const actual = marca.getLatLng();
        const desde = { latitude: actual.lat, longitude: actual.lng };
        const hasta = { latitude: Number(lat), longitude: Number(lng) };
        const heading = rumboDe(driver, desde, hasta);

        seMovio = iniciarTransicion(uuid, marca, hasta);
        marca.setIcon(L.divIcon({ html: driverIcon(isMoving, initials, heading), className: '' }));
        marca.bindPopup(buildPopup(driver));
    } else {
        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                html: driverIcon(isMoving, initials, rumboDe(driver, null, null)),
                className: '',
            }),
        }).addTo(map);

        marker.bindPopup(buildPopup(driver));
        marker.on('click', () => {
            store.selectDriver(driver);
            emit('driver-selected', driver);
        });

        markers[uuid] = marker;
        seMovio = true;
    }

    if (props.showTrails) {
        store.appendTrailPoint(uuid, puntoDeConductor(driver));
    }

    if (seMovio && props.follow && props.focusUuid === uuid) {
        map.panTo([Number(lat), Number(lng)], { animate: true });
    }
}

function buildPopup(driver) {
    const name = driver.driver?.first_name || driver.first_name || 'Conductor';
    const lastName = driver.driver?.last_name || driver.last_name || '';
    const fullName = `${name} ${lastName}`.trim();
    const plate = driver.vehicle?.vehicle_license_plate || driver.vehicle_license_plate || 'Sin vehículo';
    const docNum = driver.driver?.document_number || driver.document_number || '';
    const speed = Math.round(driver.speed ?? driver.last_location?.speed ?? 0);
    const isMoving = driver.is_moving ?? driver.last_location?.is_moving ?? false;
    const projectName = driver.project?.project_name || driver.planilla_dia?.project_name || null;
    const routes = driver.planilla_dia?.routes || [];
    const firstFunc = routes.find((r) => r.funcionario_nombre || r.funcionario_cc);
    const funcNombre = firstFunc?.funcionario_nombre || null;
    const funcCc = firstFunc?.funcionario_cc || null;
    const esHoy = driver.planilla_dia?.es_planilla_hoy !== false;
    const fechaPlanilla = driver.planilla_dia?.service_date
        ? new Date(driver.planilla_dia.service_date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })
        : '';

    const speedColor = isMoving ? '#16a34a' : '#b45309';
    const speedBg = isMoving ? '#f0fdf4' : '#fffbeb';
    const speedBorder = isMoving ? '#bbf7d0' : '#fde68a';

    const routeRows = routes.length
        ? routes.slice(0, 3).map((r) =>
            `<div style="display:flex;align-items:center;gap:4px;padding:2px 0;">
                <span style="color:#94a3b8;font-size:10px;">▸</span>
                <span style="color:#1e293b;">${r.origin || '?'} → ${r.destination || '?'}</span>
            </div>`
        ).join('')
            + (routes.length > 3
                ? `<div style="color:#94a3b8;font-size:10px;padding-top:2px;">+${routes.length - 3} rutas más</div>`
                : '')
        : `<span style="color:#94a3b8;">Sin rutas registradas</span>`;

    const rutasTitulo = routes.length
        ? (esHoy ? 'Rutas de hoy' : `Rutas del ${fechaPlanilla}`)
        : 'Rutas';

    const rowStyle = 'display:flex;align-items:center;gap:6px;padding:3px 0;';
    const labelStyle = 'color:#64748b;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;min-width:64px;';
    const valueStyle = 'color:#1e293b;font-size:11px;';
    const dividerStyle = 'border:none;border-top:1px dashed #e2e8f0;margin:6px 0;';

    return `
        <div style="min-width:240px;max-width:280px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:4px 2px;">

            <!-- Encabezado: nombre + velocidad -->
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
                <div>
                    <div style="font-weight:700;font-size:13px;color:#0f172a;line-height:1.2;">${fullName}</div>
                    <div style="font-size:11px;color:#64748b;margin-top:1px;">🚗 ${plate}${docNum ? ` · CC ${docNum}` : ''}</div>
                    <div style="font-size:12px;color:#64748b;margin-top:1px;">Último reporte: ${textoUltimoReporte(driver)}</div>
                </div>
                <div style="
                    background:${speedBg};color:${speedColor};
                    border:1px solid ${speedBorder};
                    border-radius:20px;padding:3px 9px;
                    font-size:12px;font-weight:700;white-space:nowrap;
                    flex-shrink:0;
                ">${speed} km/h</div>
            </div>

            <hr style="${dividerStyle}">

            <!-- Proyecto -->
            ${projectName ? `
            <div style="${rowStyle}">
                <span style="${labelStyle}">Proyecto</span>
                <span style="
                    background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;
                    border-radius:20px;padding:1px 8px;
                    font-size:10px;font-weight:600;
                    max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                ">${projectName}</span>
            </div>` : ''}

            <!-- Funcionario -->
            ${funcNombre ? `
            <div style="${rowStyle}">
                <span style="${labelStyle}">Funcionario</span>
                <span style="${valueStyle}">${funcNombre}${funcCc ? ` <span style='color:#94a3b8'>· CC ${funcCc}</span>` : ''}${routes.length > 1 ? ` <span style='color:#94a3b8'>(+${routes.length - 1})</span>` : ''}</span>
            </div>` : ''}

            <hr style="${dividerStyle}">

            <!-- Rutas -->
            <div style="margin-bottom:2px;">
                <div style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;">${rutasTitulo}</div>
                <div style="font-size:11px;">${routeRows}</div>
            </div>
        </div>
    `;
}


function drawGeofence(L, geofence) {
    let layer = null;

    if (geofence.type === 'circle') {
        layer = L.circle([geofence.center_lat, geofence.center_lng], {
            radius: geofence.radius_meters,
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.15,
            weight: 2,
        }).addTo(map);
        layer.bindPopup(`<strong>${geofence.name}</strong><br>Zona circular · ${geofence.radius_meters} m`);
    } else if (geofence.type === 'polygon') {
        const points = (geofence.polygon_points || []).map((p) => [p.lat ?? p[0], p.lng ?? p[1]]);
        layer = L.polygon(points, {
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.15,
            weight: 2,
        }).addTo(map);
        layer.bindPopup(`<strong>${geofence.name}</strong><br>Zona poligonal`);
    }

    if (layer) {
        geofenceLayers.push(layer);
    }
}

function drawHistory(L, history) {
    if (polylineLayer) {
        map.removeLayer(polylineLayer);
    }
    if (!history || history.length < 2) return;

    const points = history.map((point) => [point.latitude, point.longitude]);
    polylineLayer = L.polyline(points, {
        color: COLOR_RUTA,
        weight: 4,
        opacity: 0.7,
    }).addTo(map);

    const punto = (posicion, color) => L.marker(posicion, {
        icon: L.divIcon({
            className: '',
            iconSize: [14, 14],
            html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 1px 6px rgba(0,0,0,.3);box-sizing:border-box;"></div>`,
        }),
    }).addTo(map);

    punto(points[0], '#16a34a');
    punto(points[points.length - 1], '#dc2626');

    map.fitBounds(L.latLngBounds(points).pad(0.1));
}

/* ─── Estela del viaje actual ─────────────────────────────────────────────
   Polilínea por conductor que crece con cada reporte. Los datos viven en el
   store (se siembran con el historial del día y se acumulan en vivo); aquí
   solo se sincronizan las capas de Leaflet. */

function limpiarEstelas() {
    if (!map) return;
    Object.values(trailLayers).forEach((layer) => map.removeLayer(layer));
    Object.values(trailStartLayers).forEach((layer) => map.removeLayer(layer));
    trailLayers = {};
    trailStartLayers = {};
}

function sincronizarEstelas() {
    if (!map || !window.L || !props.showTrails) return;
    const L = window.L;

    Object.entries(store.trailByDriver).forEach(([uuid, puntos]) => {
        // Solo se dibuja la estela de los conductores con marcador visible y,
        // en el seguimiento, únicamente la del conductor elegido.
        if (!markers[uuid]) return;
        if (props.focusUuid && uuid !== props.focusUuid) return;

        const coords = (puntos || [])
            .map((p) => [p.latitude, p.longitude])
            .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

        if (coords.length < 2) return;

        if (!trailLayers[uuid]) {
            trailLayers[uuid] = L.polyline(coords, {
                color: COLOR_RUTA,
                weight: 4,
                opacity: 0.7,
            }).addTo(map);
        } else {
            trailLayers[uuid].setLatLngs(coords);
        }

        if (props.focusUuid === uuid && coords.length) {
            if (!trailStartLayers[uuid]) {
                trailStartLayers[uuid] = L.marker(coords[0], {
                    icon: L.divIcon({
                        className: '',
                        iconSize: [16, 16],
                        html: '<div style="width:16px;height:16px;border-radius:50%;background:#0d6efd;border:3px solid white;box-shadow:0 1px 6px rgba(0,0,0,.3);box-sizing:border-box;"></div>',
                    }),
                }).addTo(map);
                trailStartLayers[uuid].bindPopup('Inicio del viaje actual');
            } else {
                trailStartLayers[uuid].setLatLng(coords[0]);
            }
        }
    });

    // Reconciliar capas huérfanas: el conductor ya no está visible en el mapa.
    Object.keys(trailLayers).forEach((uuid) => {
        if (markers[uuid] && store.trailByDriver[uuid]) return;
        map.removeLayer(trailLayers[uuid]);
        delete trailLayers[uuid];
    });
    Object.keys(trailStartLayers).forEach((uuid) => {
        if (markers[uuid] && store.trailByDriver[uuid] && props.focusUuid === uuid) return;
        map.removeLayer(trailStartLayers[uuid]);
        delete trailStartLayers[uuid];
    });
}

let hasFittedDrivers = false;

function puntosDe(drivers) {
    return drivers
        .map((d) => [d.latitude ?? d.last_location?.latitude, d.longitude ?? d.last_location?.longitude])
        .filter(([lat, lng]) => lat != null && lng != null);
}

function fitDrivers(drivers = conductoresVigentes(store.activeDrivers)) {
    if (!map || !window.L) return;
    const points = puntosDe(drivers);
    if (!points.length) return;
    if (points.length === 1) {
        map.setView(points[0], 15);
    } else {
        map.fitBounds(window.L.latLngBounds(points).pad(0.15));
    }
    hasFittedDrivers = true;
}

/** Recentra manualmente: el encuadre automático solo ocurre la primera vez. */
function centrarFlota() {
    hasFittedDrivers = false;
    fitDrivers();
}

defineExpose({ centrarFlota });

function updateMap() {
    if (!map) return;
    const L = window.L;
    if (!L) return;

    const vigentes = conductoresVigentes(store.activeDrivers);
    const uuidVigentes = new Set(vigentes.map(driverUuid).filter(Boolean));

    // Reconciliar: un conductor que dejó de reportar (o cuya sesión se cerró)
    // debe desaparecer del mapa, no quedarse congelado con su último color.
    Object.keys(markers).forEach((uuid) => {
        if (uuidVigentes.has(uuid)) return;
        map.removeLayer(markers[uuid]);
        delete markers[uuid];
    });

    vigentes.forEach((driver) => drawDriver(L, driver));

    if (vigentes.length && !hasFittedDrivers) {
        fitDrivers(vigentes);
    }

    // Actualizar selección/historial
    if (store.selectedDriver?.history) {
        drawHistory(L, store.selectedDriver.history);
    }

    sincronizarEstelas();
}

onMounted(async () => {
    try {
        const L = await loadLeaflet();
        setupMap(L);
        updateMap();

        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 300);
    } catch (err) {
        logger.error('Error inicializando mapa:', err);
    }
});

onBeforeUnmount(() => {
    cancelarAnimaciones();
    limpiarEstelas();
    if (map) {
        map.remove();
        map = null;
    }
});
</script>

<template>
    <div class="noa-map-wrap">
        <div id="trackingMap" class="noa-map"></div>

        <div v-if="showLegend" class="noa-map-legend">
            <span class="noa-map-dot noa-map-dot--moving"></span>
            En movimiento
            <span class="noa-map-dot noa-map-dot--stopped ms-3"></span>
            Detenido
            <span v-if="showTrails" class="noa-map-trail-line ms-3"></span>
            <span v-if="showTrails">Recorrido</span>
        </div>

        <button
            type="button"
            class="noa-map-center-btn"
            :title="centerLabel"
            :aria-label="centerLabel"
            @click="centrarFlota"
        >
            <i class="fad fa-crosshairs me-1" aria-hidden="true"></i>
            {{ centerLabel }}
        </button>
    </div>
</template>

<style scoped>
.noa-map-wrap {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 400px;
    border-radius: 0.5rem;
    overflow: hidden;
}

.noa-map {
    width: 100%;
    height: 100%;
    min-height: 400px;
}

.noa-map-legend {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
    padding: 6px 12px;
    font-size: 0.8rem;
    color: #1e293b;
}

.noa-map-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
}

.noa-map-dot--moving {
    background: #22c55e;
}

.noa-map-dot--stopped {
    background: #f59e0b;
}

.noa-map-trail-line {
    width: 18px;
    height: 4px;
    border-radius: 2px;
    background: #3b82f6;
    display: inline-block;
}

.noa-map-center-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 1000;
    background: #ffffff;
    color: #1e293b;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
    padding: 8px 12px;
    font-size: 0.8rem;
    font-weight: 500;
}

.noa-map-center-btn:hover {
    background: #f8fafc;
}

.noa-map-center-btn:focus-visible {
    outline: 2px solid #2c7be5;
    outline-offset: 2px;
}

/* En pantallas estrechas la leyenda baja para no competir con el botón. */
@media (max-width: 576px) {
    .noa-map-legend {
        top: auto;
        bottom: 12px;
        left: 12px;
        right: 12px;
        flex-wrap: wrap;
    }
}
</style>
