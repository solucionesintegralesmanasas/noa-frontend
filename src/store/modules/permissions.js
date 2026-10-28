import { defineStore } from "pinia";
import { rbac } from "@services/security/permissions/rbac.js";
import { defineAbilities } from "@services/security/permissions/abilities.js";
import { permissionsPersistencePlugin } from "@store/plugins/persistence.js";

/**
 * Normalizador canónico de roles del sistema (Issue #1).
 * Unifica el vocabulario para que 'ADMIN_EMPRESA', 'administrador' y 'admin' resuelvan igual,
 * y 'SUPERADMIN', 'super-admin' y 'super_admin' coincidan siempre.
 */
export const toCanonicalRole = (v) => {
    if (!v) return '';
    const clean = String(v).toUpperCase().replace(/[-_\s]+/g, '');
    if (clean === 'ADMINISTRADOR' || clean === 'ADMIN' || clean === 'ADMINEMPRESA') {
        return 'ADMIN_EMPRESA';
    }
    if (clean === 'SUPERADMIN' || clean === 'SUPER') {
        return 'SUPERADMIN';
    }
    return String(v).toUpperCase().replace(/[-\s]+/g, '_');
};

export const usePermissionsStore = defineStore("permissions", {
    state: () => ({
        user: null,
        roles: [],
        permissions: [],
        abilities: {},
        isLoaded: false,
        isHydrated: false,
    }),

    actions: {
        setUser(user) {
            this.user = user;
            this.roles = Array.isArray(user.roles) ? user.roles : Object.values(user.roles || {});
            this.permissions = Array.isArray(user.permissions) ? user.permissions : Object.values(user.permissions || {});

            rbac.setUser({ ...user, roles: this.roles, permissions: this.permissions });
            this.abilities = defineAbilities({ roles: this.roles, permissions: this.permissions });
            this.isLoaded = true;
        },

        async load() {
            if (this.isLoaded) return;
            const { authService } = await import("@services/api/auth.service.js");
            const { user } = await authService.getProfile();
            this.setUser(user);
        },

        hasRole(role) {
            if (!role) return false;
            const targetCanonical = toCanonicalRole(role);
            const normalize = (v) => String(v).toUpperCase().replace(/[-_\s]+/g, '');
            const targetRaw = normalize(role);

            return (this.roles || []).some(r => {
                const name = typeof r === 'string' ? r : r?.name;
                if (!name) return false;
                return toCanonicalRole(name) === targetCanonical || normalize(name) === targetRaw;
            }) || (typeof rbac.hasRole === 'function' && (rbac.hasRole(role) || rbac.hasRole(targetCanonical)));
        },

        can(action, subject = null) {
            // Acceso global de administración para SUPERADMIN y ADMIN_EMPRESA (Issue #1)
            if (this.hasRole('SUPERADMIN') || this.hasRole('ADMIN_EMPRESA')) {
                return true;
            }
            
            let permissionName = action;
            if (subject) {
                permissionName = `${subject}.${action}`;
            }
            
            return this.permissions.includes(permissionName) || rbac.can(action, subject);
        },

        clear() {
            this.$reset();
            rbac.clearUser();
        }
    },
    persist: { plugins: [permissionsPersistencePlugin] }
});
