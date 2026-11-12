// Utilidades de roles reservados para el módulo de usuarios y roles.
// Los roles SUPERADMIN y ADMIN_EMPRESA solo los puede ver, asignar y editar
// un SUPERADMIN (el backend los oculta en los catálogos; esta capa es defensa
// en profundidad por si el catálogo llega completo o hay caché).
// Lógica pura (testeable en node), separada del cableado de las vistas.

/** Roles que solo un SUPERADMIN ve y gestiona (SUPER_ADMIN es variante escrita del mismo rol). */
export const ROLES_SOLO_SUPERADMIN = Object.freeze(['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN_EMPRESA']);

function aNombre(rol) {
    if (typeof rol === 'string') return rol;
    if (!rol || typeof rol === 'symbol') return '';
    try {
        // `internalName` es el nombre que usan las vistas que ya normalizaron el
        // rol de la API (p. ej. Rolepermissionsform); `name` es la forma cruda.
        const val = rol?.name ?? rol?.internalName ?? rol?.value ?? rol?.label;
        return typeof val === 'string' ? val : '';
    } catch {
        return '';
    }
}

/** Normaliza el nombre ('admin-empresa', 'super admin', 'administrador', 'admin' → 'ADMIN_EMPRESA' / 'SUPERADMIN'). */
export function nombreRolNormalizado(rol) {
    const nombre = aNombre(rol);
    if (typeof nombre !== 'string') return '';
    const clean = nombre.trim().toUpperCase().replace(/[\s-]+/g, '_');
    const sinSeparadores = clean.replace(/_/g, '');
    if (sinSeparadores === 'ADMINISTRADOR' || sinSeparadores === 'ADMIN' || sinSeparadores === 'ADMINEMPRESA') {
        return 'ADMIN_EMPRESA';
    }
    if (sinSeparadores === 'SUPERADMIN' || sinSeparadores === 'SUPER') {
        return 'SUPERADMIN';
    }
    return clean;
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
    const lista = Array.isArray(roles)
        ? roles
        : (Array.isArray(roles?.data) ? roles.data : []);

    return lista.filter(r => {
        try {
            const nombre = aNombre(r);
            if (!nombre || typeof nombre !== 'string') return false;
            return esSuperadmin || !esRolReservado(nombre);
        } catch {
            return false;
        }
    });
}

/** Indica si un usuario (array de roles en cualquier forma) tiene un rol reservado. */
export function usuarioTieneRolReservado(roles) {
    const lista = Array.isArray(roles)
        ? roles
        : (roles && typeof roles === 'object' && !Array.isArray(roles) ? [roles] : (typeof roles === 'string' ? [roles] : []));
    return lista.some(r => esRolReservado(r));
}

/** Puede el actor gestionar (asignar/editar/quitar) ese rol? */
export function puedeGestionarRol(rol, esSuperadmin = false) {
    if (esSuperadmin) return true;
    return !esRolReservado(rol);
}
