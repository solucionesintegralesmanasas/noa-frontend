// Utilidades de roles reservados para el módulo de usuarios y roles.
// Los roles SUPERADMIN y ADMIN_EMPRESA solo los puede ver, asignar y editar
// un SUPERADMIN (el backend los oculta en los catálogos; esta capa es defensa
// en profundidad por si el catálogo llega completo o hay caché).
// Lógica pura (testeable en node), separada del cableado de las vistas.

/** Roles que solo un SUPERADMIN ve y gestiona (SUPER_ADMIN es variante escrita del mismo rol). */
export const ROLES_SOLO_SUPERADMIN = Object.freeze(['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN_EMPRESA']);

function aNombre(rol) {
    if (typeof rol === 'string') return rol;
    // `internalName` es el nombre que usan las vistas que ya normalizaron el
    // rol de la API (p. ej. Rolepermissionsform); `name` es la forma cruda.
    return rol?.name ?? rol?.internalName ?? rol?.value ?? rol?.label ?? '';
}

/** Normaliza el nombre ('admin-empresa', 'super admin' → 'ADMIN_EMPRESA' / 'SUPER_ADMIN'). */
export function nombreRolNormalizado(rol) {
    const nombre = aNombre(rol);
    return typeof nombre === 'string' ? nombre.trim().toUpperCase().replace(/[\s-]+/g, '_') : '';
}

/** Indica si el rol es de los reservados al SUPERADMIN. */
export function esRolReservado(rol) {
    return ROLES_SOLO_SUPERADMIN.includes(nombreRolNormalizado(rol));
}

/**
 * Filtra el catálogo de roles (array o {data:[...]}): los reservados solo
 * aparecen para un SUPERADMIN. Nunca revienta con formas inesperadas.
 */
export function rolesVisibles(roles, esSuperadmin = false) {
    const lista = Array.isArray(roles) ? roles : (roles?.data ?? []);
    return lista.filter(r => {
        const nombre = aNombre(r);
        if (!nombre) return false;
        return esSuperadmin || !esRolReservado(nombre);
    });
}

/** Indica si un usuario (array de roles en cualquier forma) tiene un rol reservado. */
export function usuarioTieneRolReservado(roles) {
    const lista = Array.isArray(roles) ? roles : (roles ? [roles] : []);
    return lista.some(r => esRolReservado(r));
}

/** Puede el actor gestionar (asignar/editar/quitar) ese rol? */
export function puedeGestionarRol(rol, esSuperadmin = false) {
    if (esSuperadmin) return true;
    return !esRolReservado(rol);
}
