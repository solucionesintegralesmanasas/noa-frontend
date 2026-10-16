// Utilidades de rol/tipo para el formulario de terceros.
// Lógica pura (testeable en node) separada del cableado del formulario.

/** Tipo de tercero -> rol RBAC sugerido al crear desde su listado. */
export const ROL_POR_DEFECTO_POR_TIPO = Object.freeze({
    is_affiliate: 'AFILIADO',
    is_driver: 'CONDUCTOR',
    is_employee: 'EMPLEADO',
});

function aNombre(rol) {
    if (typeof rol === 'string') return rol;
    return rol?.name ?? rol?.value ?? rol?.label;
}

function aNombres(rolesDisponibles) {
    const lista = Array.isArray(rolesDisponibles) ? rolesDisponibles : [];
    const nombres = new Set();
    for (const r of lista) {
        const nombre = aNombre(r);
        if (typeof nombre === 'string' && nombre) nombres.add(nombre);
    }
    return nombres;
}

/**
 * Rol sugerido al crear desde un listado (afiliado/conductor/empleado).
 * Devuelve el nombre solo si existe en el catálogo; si no, null para no
 * enviar nunca un rol inválido al backend.
 */
export function rolPorDefectoPara(tipo, rolesDisponibles) {
    const sugerido = ROL_POR_DEFECTO_POR_TIPO[tipo];
    if (!sugerido) return null;
    return aNombres(rolesDisponibles).has(sugerido) ? sugerido : null;
}

/**
 * Normaliza los roles que trae el perfil para el selector.
 * Acepta strings u objetos {name}, descarta flags is_* y duplicados.
 * Nunca revienta con formas inesperadas ni convierte datos en vacío.
 */
export function normalizarRolesDelPerfil(roles) {
    const lista = Array.isArray(roles) ? roles : (roles != null ? [roles] : []);
    const vistos = new Set();
    const limpios = [];
    for (const r of lista) {
        const nombre = aNombre(r);
        if (typeof nombre !== 'string' || !nombre || nombre.startsWith('is_')) continue;
        if (vistos.has(nombre)) continue;
        vistos.add(nombre);
        limpios.push(nombre);
    }
    return limpios;
}
