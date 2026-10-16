/**
 * Estado documental de un vehículo para el menú "Revisar documentos".
 * Ubicación: src/features/vehicles/utils/documentosVehiculo.js
 *
 * Lógica pura: sin Pinia, sin DOM, sin Capacitor.
 * Las pólizas RCE y RCC se registran juntas con los mismos datos (solo cambia
 * el número de póliza), por eso se evalúan y se muestran agrupadas.
 */

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const UMBRAL_POR_VENCER_MS = 30 * MS_POR_DIA;

/** Fecha de vencimiento de un documento (tarjetas usan `expiration_date`). */
export function expiryDe(doc, esTarjeta = false) {
    if (!doc) return null;
    return (esTarjeta ? doc.expiration_date : doc.expiry_date) ?? null;
}

/**
 * Estado de un documento o tarjeta.
 * @param {Object|null} doc
 * @param {{ esTarjeta?: boolean }} [opciones]
 * @returns {'faltante'|'vencido'|'por-vencer'|'vigente'}
 */
export function estadoDocumento(doc, { esTarjeta = false } = {}) {
    if (!doc) return 'faltante';
    if (!esTarjeta && doc.status === 'VENCIDO') return 'vencido';
    const vence = expiryDe(doc, esTarjeta);
    if (!vence) return 'vigente';
    const fin = new Date(vence);
    if (Number.isNaN(fin.getTime())) return 'vigente';
    const ahora = new Date();
    if (fin <= ahora) return 'vencido';
    if (fin.getTime() - ahora.getTime() <= UMBRAL_POR_VENCER_MS) return 'por-vencer';
    return 'vigente';
}

const SEVERIDAD = { vigente: 0, faltante: 1, 'por-vencer': 2, vencido: 3 };

/**
 * Estado combinado de las pólizas RCE y RCC: el más severo (peor caso primero).
 * @param {Object|null} rce
 * @param {Object|null} rcc
 * @returns {'faltante'|'vencido'|'por-vencer'|'vigente'}
 */
export function estadoPolizas(rce, rcc) {
    const estados = [estadoDocumento(rce), estadoDocumento(rcc)];
    estados.sort((a, b) => SEVERIDAD[b] - SEVERIDAD[a]);
    return estados[0];
}

/**
 * Las pólizas solo se agrupan cuando existen ambas. Si falta una, se conservan
 * las filas individuales para no perder el botón "Completar".
 */
export function debenAgruparse(rce, rcc) {
    return Boolean(rce && rcc);
}

/**
 * Vencimiento más próximo entre RCE y RCC (peor caso). Devuelve el valor
 * original, no una fecha re-serializada.
 * @returns {*|null}
 */
export function vencimientoMasProximo(rce, rcc) {
    const candidatos = [expiryDe(rce), expiryDe(rcc)].filter(Boolean);
    let mejor = null;
    let mejorTiempo = Infinity;
    for (const candidato of candidatos) {
        const tiempo = new Date(candidato).getTime();
        if (Number.isNaN(tiempo)) continue;
        if (tiempo < mejorTiempo) {
            mejorTiempo = tiempo;
            mejor = candidato;
        }
    }
    return mejor;
}
