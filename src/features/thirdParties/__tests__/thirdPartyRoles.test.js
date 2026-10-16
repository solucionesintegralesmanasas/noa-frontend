// Entorno `node` (el predeterminado del proyecto): lógica pura, no hace
// falta el DOM.
import { describe, expect, it } from 'vitest';
import {
    ROL_POR_DEFECTO_POR_TIPO,
    normalizarRolesDelPerfil,
    rolPorDefectoPara,
} from '../utils/thirdPartyRoles.js';

const catalogo = [{ value: 'AFILIADO', label: 'AFILIADO' }, { value: 'CONDUCTOR', label: 'CONDUCTOR' }, { value: 'EMPLEADO', label: 'EMPLEADO' }, { value: 'ADMIN_EMPRESA', label: 'ADMIN_EMPRESA' }];

describe('rolPorDefectoPara (crear desde cada listado)', () => {
    it('sugiere AFILIADO/CONDUCTOR/EMPLEADO según el tipo', () => {
        expect(rolPorDefectoPara('is_affiliate', catalogo)).toBe('AFILIADO');
        expect(rolPorDefectoPara('is_driver', catalogo)).toBe('CONDUCTOR');
        expect(rolPorDefectoPara('is_employee', catalogo)).toBe('EMPLEADO');
    });

    it('no sugiere nada para cliente, proveedor o genérico', () => {
        expect(rolPorDefectoPara('is_customer', catalogo)).toBeNull();
        expect(rolPorDefectoPara('is_supplier', catalogo)).toBeNull();
        expect(rolPorDefectoPara('all', catalogo)).toBeNull();
        expect(rolPorDefectoPara(undefined, catalogo)).toBeNull();
    });

    it('no sugiere si el rol no está en el catálogo', () => {
        expect(rolPorDefectoPara('is_affiliate', [{ value: 'OTRO', label: 'OTRO' }])).toBeNull();
        expect(rolPorDefectoPara('is_affiliate', [])).toBeNull();
        expect(rolPorDefectoPara('is_affiliate', undefined)).toBeNull();
    });

    it('acepta el catálogo como strings', () => {
        expect(rolPorDefectoPara('is_driver', ['CONDUCTOR'])).toBe('CONDUCTOR');
    });

    it('expone el mapa para el aviso cuando falta el rol', () => {
        expect(ROL_POR_DEFECTO_POR_TIPO.is_affiliate).toBe('AFILIADO');
    });
});

describe('normalizarRolesDelPerfil (editar sin vaciar ni revertir)', () => {
    it('conserva los strings del backend', () => {
        expect(normalizarRolesDelPerfil(['AFILIADO', 'CONDUCTOR'])).toEqual(['AFILIADO', 'CONDUCTOR']);
    });

    it('descarta flags is_* mezclados', () => {
        expect(normalizarRolesDelPerfil(['AFILIADO', 'is_affiliate', 'is_driver'])).toEqual(['AFILIADO']);
    });

    it('acepta objetos {name} sin reventar', () => {
        expect(normalizarRolesDelPerfil([{ name: 'AFILIADO' }, { name: 'is_affiliate' }, null])).toEqual(['AFILIADO']);
    });

    it('elimina duplicados conservando el orden', () => {
        expect(normalizarRolesDelPerfil(['AFILIADO', 'AFILIADO'])).toEqual(['AFILIADO']);
    });

    it('acepta objetos {value} como en el catálogo', () => {
        expect(normalizarRolesDelPerfil([{ value: 'AFILIADO', label: 'AFILIADO' }])).toEqual(['AFILIADO']);
    });

    it('ausencia real de roles queda en vacío (sin inventar)', () => {
        expect(normalizarRolesDelPerfil(undefined)).toEqual([]);
        expect(normalizarRolesDelPerfil(null)).toEqual([]);
        expect(normalizarRolesDelPerfil([])).toEqual([]);
    });

    it('formas inesperadas no revientan ni fabrican valores', () => {
        expect(normalizarRolesDelPerfil('AFILIADO')).toEqual(['AFILIADO']);
        expect(normalizarRolesDelPerfil(5)).toEqual([]);
        expect(normalizarRolesDelPerfil([{}])).toEqual([]);
    });
});
