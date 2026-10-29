<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BasePageHeader from '@/components/BasePageHeader.vue';
import DriverMap from '../components/DriverMap.vue';
import DriverFollowPanel from '../components/DriverFollowPanel.vue';
import { useTrackingStore } from '../store/tracking.store';
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel.js';
import { usePermissionsStore } from '@/store/modules/permissions';
import { useToast } from 'vue-toastification';

const route = useRoute();
const router = useRouter();
const store = useTrackingStore();
const permissions = usePermissionsStore();
const toast = useToast();

const puedeVerHistorial = permissions.can('locations.history');
const puedeVerGeocercas = permissions.can('locations.geofences');

const mostrarGeocercas = ref(puedeVerGeocercas);
const mostrarEstelas = ref(true);
const seguir = ref(false);
const loadingDrivers = ref(false);
const isFullscreen = ref(false);

const mapContainer = ref(null);

let channel = null;
let trailController = null;

const uuidFoco = computed(() => {
    const uuid = route.params.uuid;
    return uuid ? String(uuid) : null;
});

const seleccionado = computed(() => {
    const uuid = uuidFoco.value;
    if (!uuid) return null;
    return store.activeDrivers.find((d) => (d.third_party_uuid || d.driver?.uuid) === uuid) || store.selectedDriver || null;
});

const nombreSeleccionado = computed(() => {
    const driver = seleccionado.value;
    if (!driver) return 'Sin conductor elegido';
    const nombre = driver.driver?.first_name || driver.first_name || 'Conductor';
    const apellido = driver.driver?.last_name || driver.last_name || '';
    return `${nombre} ${apellido}`.trim();
});

function refreshDrivers() {
    channel?.refreshNow();
}

function toggleGeocercas() {
    mostrarGeocercas.value = !mostrarGeocercas.value;
    channel?.refreshNow();
}

function toggleFollow() {
    seguir.value = !seguir.value;
}

/**
 * Prepara el seguimiento de un conductor: fija la selección y siembra la
 * estela con el recorrido de hoy (el permiso locations.history es propio;
 * sin él la estela nace de los puntos en vivo, sin llamar a la API).
 */
function prepararSeguimiento(uuid) {
    if (!uuid) return;

    const driver = store.activeDrivers.find((d) => (d.third_party_uuid || d.driver?.uuid) === uuid) || null;
    if (driver) store.selectDriver(driver);

    if (!puedeVerHistorial) return;

    trailController?.abort();
    trailController = new AbortController();
    store.fetchDriverTrail(uuid, trailController.signal);
}

function seleccionar(driver) {
    const uuid = driver?.third_party_uuid || driver?.driver?.uuid;
    if (!uuid) return;

    prepararSeguimiento(uuid);
    if (uuidFoco.value !== uuid) {
        router.replace({ name: 'tracking.follow', params: { uuid } });
    }
}

function openHistory(driver) {
    const uuid = driver?.third_party_uuid || driver?.driver?.uuid;
    if (uuid) router.push({ name: 'tracking.history', params: { uuid } });
}

const toggleFullscreen = async () => {
    const target = mapContainer.value;
    if (!target) return;

    try {
        if (!document.fullscreenElement) {
            await target.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    } catch {
        toast.error('No se pudo alternar pantalla completa');
    }
};

watch(
    () => route.params.uuid,
    (uuid) => {
        if (uuid) prepararSeguimiento(String(uuid));
    }
);

onMounted(() => {
    // Canal único de refresco (ARQ-009/ARQ-010): ciclo encadenado sin
    // solapamiento, pausa con pestaña oculta y cancelación al desmontar.
    channel = useRealtimeChannel(async (signal) => {
        loadingDrivers.value = true;
        try {
            const peticiones = [store.fetchActiveDrivers(signal)];
            if (mostrarGeocercas.value && store.geofences.length === 0) peticiones.push(store.fetchGeofences(signal));
            await Promise.all(peticiones);
        } finally {
            loadingDrivers.value = false;
        }
    }, { intervalMs: 10000 });
    channel.start();

    prepararSeguimiento(uuidFoco.value);

    document.addEventListener('fullscreenchange', onFullscreenChange);
});

function onFullscreenChange() {
    isFullscreen.value = !!document.fullscreenElement;
}

onBeforeUnmount(() => {
    channel?.stop();
    trailController?.abort();
    document.removeEventListener('fullscreenchange', onFullscreenChange);
});
</script>

<template>
    <div>
        <BasePageHeader title="Seguimiento de Conductor"
            description="Movimiento en tiempo real del conductor y su recorrido"
            icon="fad fa-location-arrow text-primary" :show-bg="true" :compact="true"
            :breadcrumbs="[{ label: 'Geolocalización' }, { label: 'Seguimiento de Conductor' }]">
            <template #title-after>
                <span class="badge rounded-pill bg-danger text-white ms-2">
                    <span class="pulse-indicator-live bg-white me-1" aria-hidden="true"></span> LIVE
                </span>
                <span v-if="uuidFoco" class="badge rounded-pill badge-subtle ms-1 d-none d-md-inline-flex text-truncate">
                    <i class="fad fa-user me-1" aria-hidden="true" style="font-size:10px;"></i>
                    <span class="text-truncate" style="max-width: 220px;">{{ nombreSeleccionado }}</span>
                </span>
            </template>

            <template #actions>
                <button class="btn btn-falcon-default btn-sm px-2 px-sm-3" type="button" title="Actualizar"
                    aria-label="Actualizar conductores" @click="refreshDrivers">
                    <i class="fad fa-sync" :class="{ 'fa-spin': loadingDrivers }" aria-hidden="true"></i>
                    <span class="d-none d-sm-inline ms-1">Actualizar</span>
                </button>
                <button v-if="puedeVerGeocercas" class="btn btn-falcon-default btn-sm px-2 px-sm-3" type="button"
                    :title="mostrarGeocercas ? 'Ocultar geocercas' : 'Mostrar geocercas'"
                    :aria-label="mostrarGeocercas ? 'Ocultar geocercas' : 'Mostrar geocercas'"
                    :class="{ 'text-primary': mostrarGeocercas }" @click="toggleGeocercas">
                    <i class="fad" :class="mostrarGeocercas ? 'fa-draw-polygon' : 'fa-eye-slash'" aria-hidden="true"></i>
                    <span class="d-none d-sm-inline ms-1">Geocercas</span>
                </button>
                <button v-if="uuidFoco" class="btn btn-falcon-default btn-sm px-2 px-sm-3" type="button"
                    :title="mostrarEstelas ? 'Ocultar el recorrido' : 'Mostrar el recorrido'"
                    :aria-label="mostrarEstelas ? 'Ocultar el recorrido' : 'Mostrar el recorrido'"
                    :class="{ 'text-primary': mostrarEstelas }" :aria-pressed="mostrarEstelas ? 'true' : 'false'"
                    @click="mostrarEstelas = !mostrarEstelas">
                    <i class="fad" :class="mostrarEstelas ? 'fa-route' : 'fa-eye-slash'" aria-hidden="true"></i>
                    <span class="d-none d-sm-inline ms-1">Recorrido</span>
                </button>
                <button v-if="uuidFoco" class="btn btn-falcon-default btn-sm px-2 px-sm-3" type="button"
                    :title="seguir ? 'Dejar de seguir al conductor' : 'Seguir al conductor'"
                    :aria-label="seguir ? 'Dejar de seguir al conductor' : 'Seguir al conductor'"
                    :class="{ 'text-primary': seguir }" :aria-pressed="seguir ? 'true' : 'false'" @click="toggleFollow">
                    <i class="fad" :class="seguir ? 'fa-pause' : 'fa-location-arrow'" aria-hidden="true"></i>
                    <span class="d-none d-sm-inline ms-1">{{ seguir ? 'Siguiendo' : 'Seguir' }}</span>
                </button>
                <button class="btn btn-falcon-default btn-sm px-2 px-sm-3" type="button"
                    :title="isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'"
                    :aria-label="isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'"
                    @click="toggleFullscreen">
                    <i class="fad" :class="isFullscreen ? 'fa-compress-alt' : 'fa-expand-alt'" aria-hidden="true"></i>
                    <span class="d-none d-sm-inline ms-1">{{ isFullscreen ? 'Salir' : 'Pantalla' }}</span>
                </button>
            </template>
        </BasePageHeader>

        <div class="row gx-3 fade-in-up" style="animation-delay: 0.1s;">
            <!-- En móvil el mapa va primero: es la razón de la pantalla. -->
            <div class="col-12 col-lg-4 mb-3 order-2 order-lg-1">
                <div class="card border-0 shadow-sm">
                    <div class="card-body p-3 d-flex flex-column noa-follow-panel-box">
                        <DriverFollowPanel :drivers="store.activeDrivers" :selected="seleccionado"
                            :loading="loadingDrivers" :follow="seguir" :trail-loading="store.trailLoading"
                            @select="seleccionar" @toggle-follow="toggleFollow" @open-history="openHistory" />
                    </div>
                </div>
            </div>

            <div class="col-12 col-lg-8 mb-3 order-1 order-lg-2">
                <div ref="mapContainer" class="card border-0 shadow-sm overflow-hidden"
                    :style="{ height: isFullscreen ? '100vh' : 'calc(100vh - 150px)', minHeight: '480px' }">
                    <DriverMap :interactive="true" :show-geofences="mostrarGeocercas" :show-legend="!isFullscreen"
                        :fullscreen="isFullscreen" :show-trails="mostrarEstelas" :focus-uuid="uuidFoco"
                        :follow="seguir" center-label="Centrar conductor" @driver-selected="seleccionar" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.noa-follow-panel-box {
    min-height: 320px;
}

@media (min-width: 992px) {
    .noa-follow-panel-box {
        height: calc(100vh - 150px);
        min-height: 480px;
    }
}

.fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.badge-subtle {
    background: rgba(13, 110, 253, .1);
    color: #0d6efd;
    border: 1px solid rgba(13, 110, 253, .2);
}

.pulse-indicator-live {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    display: inline-block;
    animation: pulse-live 1.4s ease-out infinite;
}

@keyframes pulse-live {
    0% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
    }

    70% {
        box-shadow: 0 0 0 5px rgba(255, 255, 255, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
}
</style>
