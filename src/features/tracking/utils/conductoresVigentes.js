/**
 * Frescura de los conductores del mapa en vivo.
 *
 * El backend ya excluye las sesiones sin puntos recientes, pero el mapa
 * mantiene una copia en memoria entre sondeos. Este filtro evita que un
 * marcador quede congelado si la respuesta llega con retraso o si el
 * backend aún no tiene el filtro desplegado.
 *
 * La marca de tiempo es la del servidor (`created_at`), no la del teléfono:
 * un reloj adelantado o atrasado en el dispositivo no debe ocultar el
 * vehículo equivocado.
 */

/** Margen defensivo del cliente: 5 minutos más que el umbral del backend (10). */
export const UMBRAL_SIN_REPORTAR_MS = 15 * 60 * 1000;

function marcaDeTiempo(driver) {
    const valor = driver?.created_at
        ?? driver?.last_location?.created_at
        ?? driver?.recorded_at
        ?? driver?.last_location?.recorded_at
        ?? null;

    if (!valor) return null;

    const tiempo = new Date(valor).getTime();

    return Number.isFinite(tiempo) ? tiempo : null;
}

/**
 * Un conductor está vigente si tiene coordenadas y su último punto no supera
 * el umbral. Si la respuesta no trae fecha se mantiene visible (compatibilidad);
 * ocultarlo por un campo ausente sería peor que mostrar un punto congelado.
 */
export function conductorVigente(driver, ahora = Date.now(), umbral = UMBRAL_SIN_REPORTAR_MS) {
    const lat = driver?.latitude ?? driver?.last_location?.latitude;
    const lng = driver?.longitude ?? driver?.last_location?.longitude;

    if (lat == null || lng == null) return false;

    const tiempo = marcaDeTiempo(driver);
    if (tiempo === null) return true;

    return ahora - tiempo <= umbral;
}

export function conductoresVigentes(drivers, ahora = Date.now(), umbral = UMBRAL_SIN_REPORTAR_MS) {
    if (!Array.isArray(drivers)) return [];

    return drivers.filter((driver) => conductorVigente(driver, ahora, umbral));
}

/** Texto corto para el popup: "ahora", "hace 3 min" o "sin hora". */
export function textoUltimoReporte(driver, ahora = Date.now()) {
    const tiempo = marcaDeTiempo(driver);
    if (tiempo === null) return 'sin hora';

    const minutos = Math.max(0, Math.floor((ahora - tiempo) / 60000));

    return minutos === 0 ? 'ahora' : `hace ${minutos} min`;
}
