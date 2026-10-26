import { describe, expect, it } from 'vitest';
import {
    esDashboardDeConductor,
    esModoConductor,
    esMovilConductor,
    esRutaOperativaConductor,
} from '../modoConductor.js';

describe('esModoConductor', () => {
    it('sigue el rol del usuario', () => {
        expect(esModoConductor({ esConductor: true })).toBe(true);
        expect(esModoConductor({ esConductor: false })).toBe(false);
        expect(esModoConductor()).toBe(false);
    });

    it('?view=conductor previsualiza y ?view=admin lo anula', () => {
        expect(esModoConductor({ view: 'conductor', esConductor: false })).toBe(true);
        expect(esModoConductor({ view: 'admin', esConductor: true })).toBe(false);
    });
});

describe('esRutaOperativaConductor', () => {
    it('reconoce las rutas del conductor y sus subrutas', () => {
        expect(esRutaOperativaConductor('/dashboard')).toBe(true);
        expect(esRutaOperativaConductor('/flota/solicitudes-tanqueo')).toBe(true);
        expect(esRutaOperativaConductor('/planilla-de-control-de-prestacion-servicios/editar/1')).toBe(true);
    });

    it('deja fuera las pantallas de administración', () => {
        expect(esRutaOperativaConductor('/usuarios')).toBe(false);
        expect(esRutaOperativaConductor('')).toBe(false);
    });
});

describe('esDashboardDeConductor', () => {
    it('oculta el sidebar en el dashboard del conductor', () => {
        expect(esDashboardDeConductor({ path: '/dashboard', esConductor: true })).toBe(true);
        expect(esDashboardDeConductor({ path: '/dashboard/conductor' })).toBe(true);
    });

    it('no oculta el sidebar a un administrador', () => {
        expect(esDashboardDeConductor({ path: '/dashboard', esConductor: false })).toBe(false);
        expect(esDashboardDeConductor({ path: '/dashboard/conductor', view: 'admin' })).toBe(false);
    });

    it('la previsualización solo rige en rutas operativas', () => {
        expect(esDashboardDeConductor({ path: '/vehiculos', view: 'conductor' })).toBe(true);
        expect(esDashboardDeConductor({ path: '/usuarios', view: 'conductor' })).toBe(false);
    });
});

describe('esMovilConductor', () => {
    it('usa el shell móvil al conductor en sus rutas operativas', () => {
        expect(esMovilConductor({ path: '/dashboard', esConductor: true })).toBe(true);
        // Sin importar el ancho ni la plataforma.
        expect(esMovilConductor({ path: '/extracto-de-contrato', esConductor: true, ancho: 1920 })).toBe(true);
    });

    it('no lo usa fuera de las rutas operativas', () => {
        expect(esMovilConductor({ path: '/usuarios', esConductor: true })).toBe(false);
    });

    it('no lo usa quien no está en modo conductor ni con ?view=admin', () => {
        expect(esMovilConductor({ path: '/dashboard', esConductor: false })).toBe(false);
        expect(esMovilConductor({ path: '/dashboard', esConductor: true, view: 'admin' })).toBe(false);
        expect(esMovilConductor({ path: '/dashboard', view: 'conductor' })).toBe(true);
    });
});
