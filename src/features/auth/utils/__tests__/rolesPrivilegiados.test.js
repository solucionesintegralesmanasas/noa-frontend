import { describe, it, expect } from 'vitest';
import {
    ROLES_SOLO_SUPERADMIN,
    esRolReservado,
    rolesVisibles,
    usuarioTieneRolReservado,
    puedeGestionarRol,
} from '../rolesPrivilegiados.js';

describe('rolesPrivilegiados', () => {
    it('marca como reservados SUPERADMIN y ADMIN_EMPRESA aceptando variantes de escritura', () => {
        expect(ROLES_SOLO_SUPERADMIN).toEqual(['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN_EMPRESA']);
        expect(esRolReservado('SUPERADMIN')).toBe(true);
        expect(esRolReservado('ADMIN_EMPRESA')).toBe(true);
        expect(esRolReservado('admin-empresa')).toBe(true);
        expect(esRolReservado('super admin')).toBe(true);
        expect(esRolReservado('EMPLEADO')).toBe(false);
        expect(esRolReservado('CONDUCTOR')).toBe(false);
        expect(esRolReservado(null)).toBe(false);
        expect(esRolReservado({ name: 'AFILIADO' })).toBe(false);
    });

    it('rolesVisibles oculta los reservados a quien no es superadmin y devuelve todo al superadmin', () => {
        const catalogo = { data: [
            { id: 1, name: 'SUPERADMIN' },
            { id: 2, name: 'ADMIN_EMPRESA' },
            { id: 3, name: 'EMPLEADO' },
            { id: 4, name: 'CONDUCTOR' },
            { name: '' },
        ] };

        const deAdmin = rolesVisibles(catalogo, false);
        expect(deAdmin.map(r => r.name)).toEqual(['EMPLEADO', 'CONDUCTOR']);

        const deSuper = rolesVisibles(catalogo, true);
        expect(deSuper.map(r => r.name)).toEqual(['SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO', 'CONDUCTOR']);

        // Con array plano también funciona, y con basura no revienta.
        expect(rolesVisibles(['ADMIN_EMPRESA', 'AFILIADO'], false)).toEqual(['AFILIADO']);
        expect(rolesVisibles(null, false)).toEqual([]);
    });

    it('usuarioTieneRolReservado detecta el rol sea string u objeto', () => {
        expect(usuarioTieneRolReservado(['EMPLEADO', 'ADMIN_EMPRESA'])).toBe(true);
        expect(usuarioTieneRolReservado(['EMPLEADO'])).toBe(false);
        expect(usuarioTieneRolReservado([])).toBe(false);
        expect(usuarioTieneRolReservado('SUPERADMIN')).toBe(true);
        expect(usuarioTieneRolReservado(undefined)).toBe(false);
    });

    it('puedeGestionarRol permite todo al superadmin y bloquea los reservados al resto', () => {
        expect(puedeGestionarRol('SUPERADMIN', true)).toBe(true);
        expect(puedeGestionarRol('ADMIN_EMPRESA', true)).toBe(true);
        expect(puedeGestionarRol('EMPLEADO', false)).toBe(true);
        expect(puedeGestionarRol('SUPERADMIN', false)).toBe(false);
        expect(puedeGestionarRol('admin_empresa', false)).toBe(false);
    });
});
