/**
 * Lógica compartida del listado de Hojas de Control de Servicio.
 * Solo días cerrados cuando soloCerradas es true.
 */
export function formatRango(fecha) {
    if (!fecha) return '';
    const texto = String(fecha).trim();
    const m = texto.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return texto;
    return `${m[3]}/${m[2]}/${m[1]}`;
}

export function diasHijos(data, soloCerradas = true) {
    const raw = data?.children ?? data?.dias ?? [];
    const hijos = Array.isArray(raw) ? [...raw] : Object.values(raw ?? {});
    const l = hijos
        .filter((h) => h && (h.uuid || h.service_date))
        .sort((a, b) => String(a.service_date || '').localeCompare(String(b.service_date || '')));
    return soloCerradas ? l.filter((x) => !(x.is_active == 1 || x.is_active === true)) : l;
}

export function recorridosCount(data) {
    if (Array.isArray(data.routes)) return data.routes.length;
    if (data.routes_total) return Number(data.routes_total);
    return data.daily_route ? 1 : 0;
}

export function recorridosTexto(data) {
    if (Array.isArray(data.routes) && data.routes.length) {
        return data.routes.map((r) => `${r.origin || ''} - ${r.destination || ''}`.trim().replace(/^- | -$/g, '')).filter(Boolean).join(' · ');
    }
    return data.daily_route || '-';
}

export function esCerrado(data) {
    return !(data?.is_active == 1 || data?.is_active === true);
}

/**
 * Página de destino (base 1) a partir del evento del paginador de PrimeVue
 * (`{ first, rows, page }`) o de los botones móviles (`{ page, rows }`).
 * Devuelve `null` si el evento no permite calcularla (no se navega).
 *
 * @param {Object} evento - Evento de PrimeVue o de los botones móviles.
 * @param {number} filasActuales - Filas por página del store (respaldo).
 * @returns {number|null}
 */
export function paginaDestino(evento = {}, filasActuales = 10) {
    if (!evento || typeof evento !== 'object') return null;
    const filas = Number(evento.rows) > 0 ? Number(evento.rows) : Number(filasActuales);
    if (!Number.isFinite(filas) || filas <= 0) return null;

    if (evento.page !== undefined && evento.page !== null) {
        const destino = Number(evento.page);
        if (!Number.isFinite(destino) || destino < 0) return null;
        return destino + 1;
    }

    const first = Number(evento.first);
    if (!Number.isFinite(first) || first < 0) return null;
    return Math.floor(first / filas) + 1;
}
