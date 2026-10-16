// Un vehículo particular no tiene pólizas RCC/RCE ni tarjeta de operación: el asistente
// solo le ofrece SOAT y tecnomecánica.
import { describe, expect, it } from 'vitest';
import { elegirPolizaViva, esVehiculoParticular, masReciente, pasosAplicables, useDocumentWizard } from '../useDocumentWizard.js';

const permisos = { can: () => true };

describe('esVehiculoParticular', () => {
    it('reconoce el tipo de servicio sin importar mayúsculas', () => {
        expect(esVehiculoParticular({ type_of_service: 'PARTICULAR' })).toBe(true);
        expect(esVehiculoParticular({ type_of_service: 'particular' })).toBe(true);
        expect(esVehiculoParticular({ type_of_service: 'PUBLICO' })).toBe(false);
        expect(esVehiculoParticular(null)).toBe(false);
        expect(esVehiculoParticular(undefined)).toBe(false);
    });
});

describe('asistente de documentos por tipo de vehículo', () => {
    it('un público recorre todos los pasos', () => {
        expect(pasosAplicables({ particular: false }).map((s) => s.key))
            .toEqual(['vehiculo', 'soat', 'poliza', 'tecnomecanica', 'tarjeta']);
    });

    it('un particular salta pólizas y tarjeta', () => {
        expect(pasosAplicables({ particular: true }).map((s) => s.key))
            .toEqual(['vehiculo', 'soat', 'tecnomecanica']);
    });

    it('del SOAT pasa directo a tecnomecánica y de ahí al perfil', () => {
        const { nextStepRoute } = useDocumentWizard();
        const particular = { particular: true };

        expect(nextStepRoute('soat', 'v1', permisos, particular).path).toBe('/vehiculos-documentos/tecnomecanica/crear');
        expect(nextStepRoute('tecnomecanica', 'v1', permisos, particular).path).toBe('/vehiculos/perfil/v1');
    });

    it('un público sigue pasando por las pólizas', () => {
        const { nextStepRoute } = useDocumentWizard();

        expect(nextStepRoute('soat', 'v1', permisos, { particular: false }).path).toBe('/vehiculos-documentos/poliza/crear');
    });

    it('hacia atrás, desde tecnomecánica de un particular vuelve al SOAT', () => {
        const { prevStepRoute } = useDocumentWizard();

        expect(prevStepRoute('tecnomecanica', 'v1', permisos, { particular: true }).path).toBe('/vehiculos-documentos/soat/crear');
    });

    it('el primer paso tras crear el vehículo es el SOAT en ambos casos', () => {
        const { firstStep } = useDocumentWizard();

        expect(firstStep(permisos, { particular: true }).key).toBe('soat');
        expect(firstStep(permisos, { particular: false }).key).toBe('soat');
    });

    it('sin contexto se comporta como antes (compatibilidad)', () => {
        const { availableSteps } = useDocumentWizard();

        expect(availableSteps(permisos).map((s) => s.key)).toContain('tarjeta');
    });
});

describe('masReciente (documento más reciente por tipo)', () => {
    const docs = [
        { uuid: 'viejo', document_type: 'RTM', expiry_date: '2025-11-27', created_at: '2025-01-01' },
        { uuid: 'nuevo', document_type: 'RTM', expiry_date: '2027-09-30', created_at: '2026-10-01' },
        { uuid: 'soat', document_type: 'SOAT', expiry_date: '2026-06-01', created_at: '2025-06-01' },
    ];

    it('toma la RTM nueva aunque la vencida venga primero', () => {
        expect(masReciente(docs, (d) => d.document_type === 'RTM').uuid).toBe('nuevo');
    });

    it('con la misma fecha de vencimiento gana el registrado después', () => {
        const iguales = [
            { uuid: 'a', expiry_date: '2027-01-01', created_at: '2026-01-01' },
            { uuid: 'b', expiry_date: '2027-01-01', created_at: '2026-02-01' },
        ];
        expect(masReciente(iguales, () => true).uuid).toBe('b');
    });

    it('usa otro campo de vencimiento (tarjetas) y tolera vacío', () => {
        const tarjetas = [{ uuid: 't1', expiration_date: '2026-01-01' }, { uuid: 't2', expiration_date: '2028-01-01' }];
        expect(masReciente(tarjetas, () => true, 'expiration_date').uuid).toBe('t2');
        expect(masReciente([], () => true)).toBeNull();
        expect(masReciente(undefined, () => true)).toBeNull();
    });
});

describe('elegirPolizaViva (póliza viva más reciente por tipo)', () => {
    const docs = [
        { uuid: 'rcc-vieja', document_type: 'RCC', status: 'NO VIGENTE', expiry_date: '2026-01-01', created_at: '2026-02-01' },
        { uuid: 'rcc-nueva', document_type: 'RCC', status: 'VIGENTE', expiry_date: '2027-12-31', created_at: '2026-09-01' },
        { uuid: 'rce', document_type: 'RCE', status: 'VIGENTE', expiry_date: '2027-06-30', created_at: '2026-09-01' },
    ];

    it('toma la RCC nueva aunque la reemplazada venga primero', () => {
        expect(elegirPolizaViva(docs, 'RCC').uuid).toBe('rcc-nueva');
    });

    it('no depende del orden del arreglo', () => {
        expect(elegirPolizaViva([...docs].reverse(), 'RCC').uuid).toBe('rcc-nueva');
        expect(elegirPolizaViva(docs, 'RCE').uuid).toBe('rce');
    });

    it('con las mismas fechas gana la registrada después', () => {
        const iguales = [
            { uuid: 'a', document_type: 'RCC', status: 'VIGENTE', expiry_date: '2027-01-01', created_at: '2026-01-01' },
            { uuid: 'b', document_type: 'RCC', status: 'VIGENTE', expiry_date: '2027-01-01', created_at: '2026-02-01' },
        ];
        expect(elegirPolizaViva(iguales, 'RCC').uuid).toBe('b');
    });

    it('sin viva devuelve null (al guardar se crea)', () => {
        const soloHistorial = [
            { uuid: 'x', document_type: 'RCC', status: 'INACTIVA', expiry_date: '2027-12-31' },
        ];
        expect(elegirPolizaViva(soloHistorial, 'RCC')).toBeNull();
        expect(elegirPolizaViva([], 'RCC')).toBeNull();
        expect(elegirPolizaViva(undefined, 'RCC')).toBeNull();
    });

    it('prefiere la vigente aunque otra viva tenga mayor vencimiento', () => {
        const raras = [
            { uuid: 'no-vigente', document_type: 'RCC', status: 'NO VIGENTE', expiry_date: '2028-01-01', created_at: '2026-01-01' },
            { uuid: 'vigente', document_type: 'RCC', status: 'VIGENTE', expiry_date: '2027-01-01', created_at: '2026-02-01' },
        ];
        expect(elegirPolizaViva(raras, 'RCC').uuid).toBe('vigente');
    });

    it('sin vigentes elige la viva más reciente', () => {
        const sinVigentes = [
            { uuid: 'a', document_type: 'RCC', status: 'NO VIGENTE', expiry_date: '2026-01-01', created_at: '2026-01-01' },
            { uuid: 'b', document_type: 'RCC', status: 'NO', expiry_date: '2026-06-01', created_at: '2026-02-01' },
        ];
        expect(elegirPolizaViva(sinVigentes, 'RCC').uuid).toBe('b');
    });
});
