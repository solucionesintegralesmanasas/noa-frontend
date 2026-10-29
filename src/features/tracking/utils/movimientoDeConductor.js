/**
 * Movimiento del conductor en el mapa.
 *
 * Funciones puras para animar el marcador entre reportes GPS (el teléfono
 * manda un punto cada ~10 s) y para armar la estela del viaje actual. La
 * animación es solo visual: nunca inventa datos, interpola entre dos puntos
 * reales y "snapea" cuando el salto es antinatural (un mal fix del GPS no
 * debe teletransportar el vehículo por el mapa).
 */

/** Distancia máxima (m) entre dos puntos para animar el desplazamiento. */
export const UMBRAL_SALTO_M = 500;

/** Puntos mínimos y máximos de una transición entre dos reportes. */
export const DURACION_MIN_MS = 600;
export const DURACION_MAX_MS = 9000;

/** Tope de puntos por estela: recorta los más viejos, nunca el último. */
export const TOPE_PUNTOS_ESTELA = 2000;

/** Sin reportes por más tiempo que esto, el viaje actual ya fue otro. */
export const UMBRAL_VIAJE_MS = 15 * 60 * 1000;

const RADIO_TIERRA_M = 6371000;

function aRadianes(grados) {
    return (grados * Math.PI) / 180;
}

/** Marca de tiempo en ms del punto, o null si no la trae. */
export function marcaDeTiempo(punto) {
    const valor = punto?.recorded_at ?? punto?.created_at ?? null;
    if (valor == null) return null;

    const tiempo = new Date(valor).getTime();
    return Number.isFinite(tiempo) ? tiempo : null;
}

/**
 * Normaliza un punto GPS a { latitude, longitude, speed, heading, is_moving,
 * recorded_at }. Devuelve null si las coordenadas no son usables.
 */
export function normalizarPunto(punto) {
    const lat = Number(punto?.latitude ?? punto?.lat);
    const lng = Number(punto?.longitude ?? punto?.lng ?? punto?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

    const heading = punto?.heading == null ? NaN : Number(punto.heading);

    return {
        latitude: lat,
        longitude: lng,
        speed: Number(punto?.speed) || 0,
        heading: Number.isFinite(heading) ? heading : null,
        is_moving: Boolean(punto?.is_moving),
        recorded_at: punto?.recorded_at ?? punto?.created_at ?? null,
    };
}

/**
 * Punto del conductor con la forma que devuelve `active-drivers`: los datos
 * llegan planos o bajo `last_location`, según el caso.
 */
export function puntoDeConductor(driver) {
    const origen = driver?.last_location ?? driver ?? {};
    return normalizarPunto({
        latitude: driver?.latitude ?? origen.latitude,
        longitude: driver?.longitude ?? origen.longitude,
        speed: driver?.speed ?? origen.speed,
        heading: driver?.heading ?? origen.heading,
        is_moving: driver?.is_moving ?? origen.is_moving,
        recorded_at: driver?.recorded_at ?? driver?.created_at ?? origen.recorded_at ?? origen.created_at,
    });
}

/** Distancia en metros entre dos puntos (haversine). */
export function distanciaEntrePuntos(desde, hasta) {
    const lat1 = aRadianes(Number(desde?.latitude));
    const lat2 = aRadianes(Number(hasta?.latitude));
    const dLat = lat2 - lat1;
    const dLng = aRadianes(Number(hasta?.longitude) - Number(desde?.longitude));

    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Rumbo en grados (0–360, norte = 0) desde un punto hacia otro. */
export function rumboEntrePuntos(desde, hasta) {
    const lat1 = aRadianes(Number(desde?.latitude));
    const lat2 = aRadianes(Number(hasta?.latitude));
    const dLng = aRadianes(Number(hasta?.longitude) - Number(desde?.longitude));

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const grados = (Math.atan2(y, x) * 180) / Math.PI;

    return grados < 0 ? grados + 360 : grados;
}

/**
 * Posición intermedia entre dos puntos para un avance t ∈ [0, 1].
 * Interpolación lineal suficiente a la escala de una cuadra urbana.
 */
export function posicionInterpolada(desde, hasta, t) {
    const avance = Math.min(1, Math.max(0, Number(t) || 0));
    return [
        Number(desde.latitude) + (Number(hasta.latitude) - Number(desde.latitude)) * avance,
        Number(desde.longitude) + (Number(hasta.longitude) - Number(desde.longitude)) * avance,
    ];
}

/**
 * Un salto se anima solo si es un desplazamiento plausible: ni el mismo punto
 * (no hay nada que mover) ni un teletransporte (mal fix o cambio de conductor).
 */
export function debeAnimarSalto(desde, hasta, umbralM = UMBRAL_SALTO_M) {
    const distancia = distanciaEntrePuntos(desde, hasta);
    return distancia > 1 && distancia <= umbralM;
}

/** Duración de la transición según la distancia, acotada a [min, max]. */
export function duracionDeTransicion(desde, hasta) {
    const distancia = distanciaEntrePuntos(desde, hasta);
    // ~20 ms por metro: un desplazamiento de 500 m se ve como 10 s, el mismo
    // ciclo del reporte GPS, así el movimiento parece continuo y no acelerado.
    return Math.min(DURACION_MAX_MS, Math.max(DURACION_MIN_MS, distancia * 20));
}

/**
 * Agrega un punto a la estela: lo inserta ordenado por hora, descarta
 * duplicados exactos y recorta los puntos más viejos si pasa del tope.
 * Devuelve una lista nueva (el store de Pinia espera reasignación).
 */
export function agregarPuntoAEstela(estela, punto, tope = TOPE_PUNTOS_ESTELA) {
    const limpio = normalizarPunto(punto);
    if (!limpio) return Array.isArray(estela) ? estela : [];

    const base = Array.isArray(estela) ? estela : [];
    const hora = marcaDeTiempo(limpio);

    if (hora === null) {
        // Sin hora no hay orden posible: se appendea (sin repetir el último si
        // viene con las mismas coordenadas) y se respeta el tope.
        const ultimo = base[base.length - 1];
        if (ultimo
            && Number(ultimo.latitude) === limpio.latitude
            && Number(ultimo.longitude) === limpio.longitude) {
            return base;
        }
        const lista = [...base, limpio];
        return lista.length > tope ? lista.slice(-tope) : lista;
    }

    const indice = base.findIndex((p) => {
        const otra = marcaDeTiempo(p);
        return otra !== null && otra >= hora;
    });

    if (indice !== -1 && marcaDeTiempo(base[indice]) === hora) return base;

    const lista = indice === -1 ? [...base, limpio] : [...base.slice(0, indice), limpio, ...base.slice(indice)];
    return lista.length > tope ? lista.slice(-tope) : lista;
}

/**
 * Une la estela sembrada (historial del día) con los puntos que ya llegaron
 * en vivo, sin duplicados y ordenada por hora.
 */
export function fusionarEstela(semilla, existente, tope = TOPE_PUNTOS_ESTELA) {
    let lista = [];
    [...(Array.isArray(semilla) ? semilla : []), ...(Array.isArray(existente) ? existente : [])]
        .forEach((punto) => {
            lista = agregarPuntoAEstela(lista, punto, tope);
        });
    return lista;
}

/**
 * Último tramo continuo de la lista: corta donde hubo un silencio mayor que
 * `umbralMs` (el viaje actual, no todo el día). Se conserva el punto previo al
 * corte para que la estela arranque donde empezó el viaje.
 */
export function viajeActual(puntos, umbralMs = UMBRAL_VIAJE_MS) {
    const lista = Array.isArray(puntos) ? puntos : [];
    if (lista.length < 2) return [...lista];

    let corte = -1;
    for (let i = lista.length - 1; i > 0; i -= 1) {
        const actual = marcaDeTiempo(lista[i]);
        const anterior = marcaDeTiempo(lista[i - 1]);
        if (actual === null || anterior === null) continue;
        if (actual - anterior > umbralMs) {
            corte = i - 1;
            break;
        }
    }

    return lista.slice(corte + 1);
}

/** Fecha local YYYY-MM-DD (nunca UTC: a las 7 p.m. de Bogotá el día ya cambió). */
export function fechaLocalDe(instante = new Date()) {
    const fecha = instante instanceof Date ? instante : new Date(instante);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
}
