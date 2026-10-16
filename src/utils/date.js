/**
 * Utilidad para el manejo de fechas
 * Ubicación: src/utils/date.js
 */

import dayjs from "dayjs";
// Plugins para tener la misma funcionalidad de moment
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import "dayjs/locale/es.js";
import "dayjs/locale/en-gb.js";

dayjs.extend(customParseFormat);

export const dateUtils = {
    /**
     * Cambia el locale globalmente
     */
    setLocale: (locale) => {
        if (!locale) return;
        const dayjsLocale = locale === 'en' ? 'en-gb' : 'es';
        dayjs.locale(dayjsLocale);
    },

    /**
     * Formatea fecha al estándar del ERP
     */
    format: (date, formatStr = "DD/MM/YYYY") => {
        if (!date) return "-";
        const m = dayjs(date);
        return m.isValid() ? m.format(formatStr) : "-";
    },

    /**
     * Fecha actual formateada
     */
    now: (formatStr = "DD/MM/YYYY") => dayjs().format(formatStr),

    /**
     * Instancia base (Mantenemos el nombre 'moment' para que nada se rompa en otras vistas)
     */
    moment: (...args) => dayjs(...args),

    /**
     * Instancia base (Nombre correcto)
     */
    dayjs: (...args) => dayjs(...args),
};

/**
 * Parsea un texto pegado o escrito a ISO (YYYY-MM-DD).
 * Acepta los formatos de las páginas del gobierno y el RUNT (día/mes/año,
 * año/mes/día, año corto, fecha compacta) y el ISO del input nativo;
 * tolera hora al final ("2026-09-14 00:00:00"). Día/mes conserva prioridad.
 * Devuelve null si no es una fecha válida.
 * @param {string|null|undefined} texto
 * @returns {string|null}
 */
export function parsearFechaFlexible(texto) {
    if (texto === null || texto === undefined) return null;
    // Solo importa la parte de fecha: recorta hora ("... 00:00:00") e ISO con T.
    const limpio = String(texto).trim().split(/\s+/)[0].split('T')[0];
    if (!limpio) return null;
    const formatos = [
        'DD/MM/YYYY', 'D/M/YYYY', 'DD-MM-YYYY', 'D-M-YYYY',
        'DD.MM.YYYY', 'D.M.YYYY', 'YYYY-MM-DD',
        'YYYY/MM/DD', 'YYYY/M/D', 'YYYY.MM.DD', 'YYYY.M.D',
        'DD/MM/YY', 'D/M/YY', 'DD-MM-YY', 'DD.MM.YY',
        'YYYYMMDD',
    ];
    const m = dayjs(limpio, formatos, true);
    return m.isValid() ? m.format('YYYY-MM-DD') : null;
}

export default dateUtils;