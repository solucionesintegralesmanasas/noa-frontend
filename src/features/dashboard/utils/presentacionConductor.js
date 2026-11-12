/**
 * Presentación del conductor: nombre, iniciales, saludo, filtro de vehículos
 * y formatos. Funciones puras compartidas por las vistas web y móvil del
 * conductor y por el layout, para que no vuelvan a divergir.
 * Ubicación: src/features/dashboard/utils/presentacionConductor.js
 */

export function primerNombre(nombre, respaldo = 'Conductor') {
    const crudo = String(nombre || '').trim();
    if (!crudo) return respaldo;
    const primera = crudo.split(/\s+/)[0];
    return primera.charAt(0).toUpperCase() + primera.slice(1).toLowerCase();
}

export function iniciales(nombre, respaldo = 'CO') {
    const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
        const char1 = [...partes[0]][0] || '';
        const char2 = [...partes[1]][0] || '';
        return (char1 + char2).toUpperCase();
    }
    if (partes.length === 1) {
        return [...partes[0]].slice(0, 2).join('').toUpperCase();
    }
    return respaldo;
}

export function saludoPorHora(fecha = new Date()) {
    if (typeof fecha === 'symbol') return 'Hola';
    try {
        const f = fecha instanceof Date ? fecha : new Date(fecha);
        if (Number.isNaN(f.getTime())) return 'Hola';
        const hora = f.getHours();
        if (hora < 12) return 'Buenos días';
        if (hora < 18) return 'Buenas tardes';
        return 'Buenas noches';
    } catch {
        return 'Hola';
    }
}

/** Filtra por placa, marca, línea o número interno (sin distinguir mayúsculas). */
export function filtrarVehiculos(lista, consulta) {
    const arr = Array.isArray(lista) ? lista : [];
    let q = '';
    try {
        if (typeof consulta === 'string') q = consulta.trim().toLowerCase();
        else if (typeof consulta !== 'symbol' && consulta != null) q = String(consulta).trim().toLowerCase();
    } catch {
        return arr;
    }
    if (!q) return arr;
    return arr.filter((v) => {
        if (!v || typeof v !== 'object') return false;
        return ['plate', 'brand', 'line', 'internal_number'].some((campo) => {
            const val = v[campo];
            if (val == null || typeof val === 'symbol') return false;
            try { return String(val).toLowerCase().includes(q); } catch { return false; }
        });
    });
}

export function formatearNumero(valor) {
    if (valor === null || valor === undefined || typeof valor === 'symbol' || typeof valor === 'object' || !Number.isFinite(Number(valor))) return '0';
    return Number(valor).toLocaleString('es-CO');
}

/** Placa colombiana de 6 caracteres: GUX649 -> GUX · 649. */
export function formatearPlaca(placa) {
    if (!placa) return 'SIN-PLACA';
    const limpia = String(placa).trim().toUpperCase();
    if (limpia.length === 6) return `${limpia.substring(0, 3)} · ${limpia.substring(3)}`;
    return limpia;
}
