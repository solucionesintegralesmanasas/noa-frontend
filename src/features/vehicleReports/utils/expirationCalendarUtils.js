/**
 * Utilidades puras de fechas, celdas y enlaces para el Calendario de Vencimientos y Convenios.
 */

export const NOMBRES_MESES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

export const ABREV_MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const DIAS_SEMANA_CORTOS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

/**
 * Formatea una fecha YYYY-MM-DD en formato colombiano DD/MM/AAAA.
 */
export function formatearFechaCorta(isoDate) {
    if (!isoDate) return '—';
    const partes = String(isoDate).slice(0, 10).split('-');
    if (partes.length !== 3) return String(isoDate);
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/**
 * Formatea una fecha YYYY-MM-DD en formato largo (ej. "03 de Noviembre, 2026").
 */
export function formatearFechaLarga(isoDate) {
    if (!isoDate) return '';
    const partes = String(isoDate).slice(0, 10).split('-');
    if (partes.length !== 3) return String(isoDate);
    const anio = Number(partes[0]);
    const mes = Number(partes[1]);
    const dia = String(partes[2]).padStart(2, '0');
    const nombreMes = NOMBRES_MESES[mes - 1] || '';
    return `${dia} de ${nombreMes}, ${anio}`;
}

/**
 * Construye una cadena YYYY-MM-DD a partir de año, mes (1-12) y día.
 */
export function aIsoDate(year, month, day) {
    const y = String(year);
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Construye la matriz de 42 celdas (6 semanas de lunes a domingo) para un mes y año dados.
 *
 * @param {number} year Año (ej. 2026)
 * @param {number} month Mes 1-12 (ej. 11 para Noviembre)
 * @param {Record<string, Array>} eventsByDate Mapa fecha ISO -> arreglo de eventos
 * @param {string} todayIso Fecha de hoy YYYY-MM-DD
 * @returns {Array<Object>} 42 celdas con metadatos y eventos
 */
export function construirCeldasMes(year, month, eventsByDate = {}, todayIso = '') {
    const primerDiaMes = new Date(year, month - 1, 1);
    // En JS getDay(): 0 = Domingo, 1 = Lunes ... 6 = Sábado.
    // Convertimos a índice Lunes = 0 ... Domingo = 6:
    const offsetLunes = (primerDiaMes.getDay() + 6) % 7;

    const fechaInicio = new Date(year, month - 1, 1 - offsetLunes);
    const celdas = [];

    for (let i = 0; i < 42; i++) {
        const current = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate() + i);
        const cYear = current.getFullYear();
        const cMonth = current.getMonth() + 1;
        const cDay = current.getDate();
        const dateStr = aIsoDate(cYear, cMonth, cDay);
        const isCurrentMonth = cMonth === month && cYear === year;
        const isToday = Boolean(todayIso && dateStr === todayIso);
        const dayEvents = eventsByDate[dateStr] || [];

        const showMonthTag = cDay === 1 || i === 0;
        const dayNumberStr = String(cDay).padStart(2, '0');
        const dayLabel = showMonthTag ? `${dayNumberStr} ${ABREV_MESES[cMonth - 1]}` : dayNumberStr;

        const alertCount = dayEvents.filter((e) => e.days_remaining <= 15).length;
        const hasCritical = dayEvents.some((e) => e.status === 'expired' || e.status === 'today' || e.days_remaining <= 0);
        const hasWarning = dayEvents.some((e) => (e.days_remaining > 0 && e.days_remaining <= 15) || e.status === 'expiring_5d' || e.status === 'expiring_15d');

        celdas.push({
            date: dateStr,
            day: cDay,
            month: cMonth,
            year: cYear,
            dayLabel,
            isCurrentMonth,
            isToday,
            events: dayEvents,
            totalCount: dayEvents.length,
            alertCount,
            hasCritical,
            hasWarning,
        });
    }

    return celdas;
}

/**
 * Construye las 7 celdas de la semana (Lunes a Domingo) que contiene la fecha `selectedDateIso`.
 */
export function construirCeldasSemana(selectedDateIso, month, year, eventsByDate = {}, todayIso = '') {
    const todas = construirCeldasMes(year, month, eventsByDate, todayIso);
    const idx = todas.findIndex((c) => c.date === selectedDateIso);
    if (idx !== -1) {
        const inicioSemana = Math.floor(idx / 7) * 7;
        return todas.slice(inicioSemana, inicioSemana + 7);
    }
    return todas.slice(0, 7);
}

/**
 * Devuelve la configuración visual (tono, ícono FontAwesome y etiqueta de estado) para un evento.
 * Respeta la regla de colores de NOA:
 * - Rojo (danger): vencido / vence hoy
 * - Ámbar/Naranja (warning): vence <= 5 días o <= 15 días
 * - Azul (primary): convenio de colaboración
 * - Verde (success): al día / renovado
 */
export function estiloEventoCalendario(event) {
    if (!event) {
        return {
            tone: 'muted',
            icon: 'fas fa-circle',
            chipText: '',
            statusText: '',
        };
    }

    const placa = event.vehicle_license_plate || '—';
    const cat = event.category;
    const status = event.status;
    const days = Number(event.days_remaining ?? 0);

    let statusSuffix;
    if (days < 0) {
        statusSuffix = 'Vencido';
    } else if (days === 0) {
        statusSuffix = 'Hoy';
    } else if (days <= 5) {
        statusSuffix = `${days} día${days === 1 ? '' : 's'}`;
    } else if (days <= 15) {
        statusSuffix = `${days}d`;
    } else {
        statusSuffix = 'Al día';
    }

    if (cat === 'AGREEMENT') {
        const nombreConvenio = event.agreement_name || 'Convenio';
        const tone = status === 'expired' || status === 'today' || days <= 0
            ? 'danger'
            : (status === 'expiring_5d' || status === 'expiring_15d' || (days > 0 && days <= 15))
                ? 'warning'
                : 'primary';
        return {
            tone,
            icon: 'fas fa-handshake',
            chipText: `Convenio ${nombreConvenio}`,
            statusText: `${formatearFechaCorta(event.date)} (${statusSuffix})`,
        };
    }

    const catShort = cat === 'OPERATION_CARD' ? 'Tarj. Op.' : (event.category_label || cat);

    if (status === 'expired') {
        return {
            tone: 'danger',
            icon: 'fas fa-exclamation-triangle',
            chipText: `${placa} · ${catShort} Vencido`,
            statusText: `${formatearFechaCorta(event.date)} (Vencido)`,
        };
    }

    if (status === 'today') {
        return {
            tone: 'danger',
            icon: 'fas fa-exclamation-circle',
            chipText: `${placa} · ${catShort} Vence`,
            statusText: `${formatearFechaCorta(event.date)} (Hoy)`,
        };
    }

    if (status === 'expiring_5d' || status === 'expiring_15d' || (days > 0 && days <= 15)) {
        return {
            tone: 'warning',
            icon: 'fas fa-clock',
            chipText: `${placa} · ${catShort} (${days}d)`,
            statusText: `${formatearFechaCorta(event.date)} (${days} día${days === 1 ? '' : 's'})`,
        };
    }

    return {
        tone: 'success',
        icon: 'fas fa-check-circle',
        chipText: `${placa} · ${catShort} Al día`,
        statusText: `${formatearFechaCorta(event.date)} (Vigente)`,
    };
}

/**
 * Construye la ruta de edición del documento o tarjeta si el usuario tiene permiso.
 */
export function enlaceEditarDocumento(event, canFn) {
    if (!event?.vehicle_uuid || typeof canFn !== 'function') return null;

    if (event.category === 'OPERATION_CARD') {
        if (event.document_uuid && canFn('operation_cards.update')) {
            return { path: `/tarjetas-de-operacion/editar/${event.document_uuid}`, query: { wizard: event.vehicle_uuid } };
        }
        return null;
    }

    const mapaSegmentos = {
        SOAT: 'soat',
        RTM: 'tecnomecanica',
        RCC: 'poliza',
        RCE: 'poliza',
    };
    const seg = mapaSegmentos[event.category];
    if (seg && event.document_uuid && canFn('vehicle_documents.update')) {
        return { path: `/vehiculos-documentos/${seg}/editar/${event.document_uuid}`, query: { wizard: event.vehicle_uuid } };
    }

    return null;
}
