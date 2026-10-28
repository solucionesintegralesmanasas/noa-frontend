import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePermissionsStore, toCanonicalRole } from '../permissions.js';

describe('usePermissionsStore & normalización de roles (Issue #1)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    describe('toCanonicalRole', () => {
        it('normaliza alias de admin empresa a ADMIN_EMPRESA', () => {
            expect(toCanonicalRole('ADMIN_EMPRESA')).toBe('ADMIN_EMPRESA');
            expect(toCanonicalRole('admin_empresa')).toBe('ADMIN_EMPRESA');
            expect(toCanonicalRole('admin-empresa')).toBe('ADMIN_EMPRESA');
            expect(toCanonicalRole('administrador')).toBe('ADMIN_EMPRESA');
            expect(toCanonicalRole('ADMINISTRADOR')).toBe('ADMIN_EMPRESA');
            expect(toCanonicalRole('admin')).toBe('ADMIN_EMPRESA');
            expect(toCanonicalRole('ADMIN')).toBe('ADMIN_EMPRESA');
        });

        it('normaliza variantes de super admin a SUPERADMIN', () => {
            expect(toCanonicalRole('SUPERADMIN')).toBe('SUPERADMIN');
            expect(toCanonicalRole('superadmin')).toBe('SUPERADMIN');
            expect(toCanonicalRole('super-admin')).toBe('SUPERADMIN');
            expect(toCanonicalRole('super_admin')).toBe('SUPERADMIN');
            expect(toCanonicalRole('Super Admin')).toBe('SUPERADMIN');
        });

        it('preserva otros roles canónicos del sistema', () => {
            expect(toCanonicalRole('CONDUCTOR')).toBe('CONDUCTOR');
            expect(toCanonicalRole('conductor')).toBe('CONDUCTOR');
            expect(toCanonicalRole('AFILIADO')).toBe('AFILIADO');
            expect(toCanonicalRole('EMPLEADO')).toBe('EMPLEADO');
            expect(toCanonicalRole('')).toBe('');
            expect(toCanonicalRole(null)).toBe('');
        });
    });

    describe('hasRole y can con roles asignados', () => {
        it('un usuario con rol ADMIN_EMPRESA responde true a hasRole(administrador) y hasRole(admin)', () => {
            const store = usePermissionsStore();
            store.setUser({
                id: 1,
                name: 'Admin Empresa',
                roles: ['ADMIN_EMPRESA'],
                permissions: [],
            });

            // Equivalencias fijadas por Issue #1
            expect(store.hasRole('ADMIN_EMPRESA')).toBe(true);
            expect(store.hasRole('administrador')).toBe(true);
            expect(store.hasRole('ADMINISTRADOR')).toBe(true);
            expect(store.hasRole('admin')).toBe(true);
            expect(store.hasRole('ADMIN')).toBe(true);
            expect(store.hasRole('admin-empresa')).toBe(true);

            // No responde a otros roles
            expect(store.hasRole('SUPERADMIN')).toBe(false);
            expect(store.hasRole('CONDUCTOR')).toBe(false);
            expect(store.hasRole('EMPLEADO')).toBe(false);

            // Acceso de administración global concedido
            expect(store.can('vehicles.create')).toBe(true);
            expect(store.can('users.delete')).toBe(true);
        });

        it('un usuario con rol SUPERADMIN responde true a variantes de superadmin', () => {
            const store = usePermissionsStore();
            store.setUser({
                id: 2,
                name: 'Super Admin',
                roles: ['SUPERADMIN'],
                permissions: [],
            });

            expect(store.hasRole('SUPERADMIN')).toBe(true);
            expect(store.hasRole('superadmin')).toBe(true);
            expect(store.hasRole('super-admin')).toBe(true);
            expect(store.hasRole('Super Admin')).toBe(true);

            // No es admin empresa
            expect(store.hasRole('ADMIN_EMPRESA')).toBe(false);
            expect(store.hasRole('administrador')).toBe(false);

            // Acceso concedido
            expect(store.can('any.action')).toBe(true);
        });

        it('un usuario regular EMPLEADO no tiene privilegios de administrador', () => {
            const store = usePermissionsStore();
            store.setUser({
                id: 3,
                name: 'Empleado Regular',
                roles: ['EMPLEADO'],
                permissions: ['vehicles.index'],
            });

            expect(store.hasRole('EMPLEADO')).toBe(true);
            expect(store.hasRole('ADMIN_EMPRESA')).toBe(false);
            expect(store.hasRole('administrador')).toBe(false);
            expect(store.hasRole('admin')).toBe(false);

            // Solo puede lo que tiene asignado
            expect(store.can('vehicles.index')).toBe(true);
            expect(store.can('vehicles.delete')).toBe(false);
        });
    });
});
