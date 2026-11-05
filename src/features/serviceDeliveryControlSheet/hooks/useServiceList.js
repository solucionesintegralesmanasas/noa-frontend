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
    const validos = hijos.filter((x) => x && (x.uuid || x.service_date));
    const filtrados = soloCerradas ? validos.filter((x) => esCerrado(x)) : validos;

    // Solo en la pestaña de cerradas se organiza de la más nueva a la más vieja (descendente).
    // En las demás pestañas se conserva el orden cronológico normal (ascendente).
    return filtrados.sort((a, b) => {
        const fechaA = String(a.service_date || '');
        const fechaB = String(b.service_date || '');
        return soloCerradas ? fechaB.localeCompare(fechaA) : fechaA.localeCompare(fechaB);
    });
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
    return data.daily_route || '';
}

export function esCerrado(data) {
    return !(data?.is_active == 1 || data?.is_active === true);
}

/**
 * Resumen claro e inequívoco de los días del servicio.
 * En lugar de abreviaturas crípticas como "Inc" o "Borr", expresa exactamente
 * cuántos días componen la planilla y cuántos han sido completados/cerrados.
 */
export function resumenDiasInfo(data) {
    const raw = data?.children ?? data?.dias ?? [];
    const lista = Array.isArray(raw) ? [...raw] : Object.values(raw ?? {});
    const total = lista.length;

    if (total === 0) {
        const cerrado = esCerrado(data);
        return {
            total: 1,
            cerrados: cerrado ? 1 : 0,
            pendientes: cerrado ? 0 : 1,
            texto: cerrado ? '1 de 1 cerrado' : '1 día pendiente',
            clase: cerrado ? 'badge-subtle-success' : 'badge-subtle-secondary',
            icono: cerrado ? 'fas fa-check-circle' : 'fad fa-clock',
            tooltip: cerrado ? 'Planilla diaria completada y cerrada' : 'Planilla diaria pendiente de cierre'
        };
    }

    const items = lista
        .filter(h => h && (h.uuid || h.service_date))
        .sort((a, b) => String(a.service_date || '').localeCompare(String(b.service_date || '')))
        .map(h => {
            const f = formatRango(h.service_date);
            const cerrado = esCerrado(h);
            const estadoTexto = cerrado ? 'Cerrado' : (h.estado === 'EN_CURSO' ? 'En curso' : 'Pendiente');
            return {
                fecha: f,
                cerrado,
                estado: estadoTexto
            };
        });

    const cerrados = items.filter(i => i.cerrado).length;
    const pendientes = total - cerrados;

    let clase = 'badge-subtle-secondary';
    let icono = 'fad fa-clock';
    if (cerrados === total && total > 0) {
        clase = 'badge-subtle-success';
        icono = 'fas fa-check-circle';
    } else if (cerrados > 0) {
        clase = 'badge-subtle-warning';
        icono = 'fad fa-hourglass-half';
    }

    const tooltip = items.map(i => `${i.fecha ? i.fecha.slice(0, 5) : 'Día'}: ${i.estado}`).join(' · ');

    return {
        total,
        cerrados,
        pendientes,
        texto: `${cerrados} de ${total} cerrados`,
        clase,
        icono,
        tooltip
    };
}

export function formatKm(inicial, final) {
    if (!tieneKm(inicial) && !tieneKm(final)) {
        return '-';
    }
    const fInit = tieneKm(inicial) ? formatKmValor(inicial) : 'Pendiente';
    const fEnd = tieneKm(final) ? formatKmValor(final) : 'Pendiente';
    return `${fInit} — ${fEnd}`;
}

export function tieneKm(val) {
    return val !== null && val !== undefined && val !== '' && !Number.isNaN(Number(val));
}

export function formatKmValor(val) {
    if (!tieneKm(val)) return '-';
    const num = Number(val);
    return Number.isFinite(num) ? `${num.toLocaleString('es-CO')} km` : `${val} km`;
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
