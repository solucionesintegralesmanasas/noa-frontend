// Payload de asignaciones de proyectos: conserva activas y no revive retiradas.
import { describe, expect, it } from 'vitest';
import { payloadConAlternancia, payloadConNuevaAsignacion, validarAsignaciones } from '../utils/assignments.js';

const asignaciones = [
    { uuid: 'a1', third_party_uuid: 'd1', vehicle_uuid: 'v1', is_active: true },
    { uuid: 'a2', third_party_uuid: 'd2', vehicle_uuid: 'v2', is_active: false },
    { uuid: 'a3', third_party_uuid: 'd3', vehicle_uuid: 'v3', is_active: true },
];

describe('payload de asignaciones de proyectos', () => {
    it('agrega la nueva y conserva solo las activas', () => {
        const payload = payloadConNuevaAsignacion(asignaciones, {
            third_party_uuid: 'd4',
            vehicle_uuid: 'v4',
        });

        expect(payload).toEqual([
            { third_party_uuid: 'd1', vehicle_uuid: 'v1', is_active: true },
            { third_party_uuid: 'd3', vehicle_uuid: 'v3', is_active: true },
            { third_party_uuid: 'd4', vehicle_uuid: 'v4', is_active: true },
        ]);
    });

    it('retira la asignación indicada sin revivir las retiradas', () => {
        const payload = payloadConAlternancia(asignaciones, asignaciones[0]);

        expect(payload).toEqual([
            { third_party_uuid: 'd3', vehicle_uuid: 'v3', is_active: true },
            { third_party_uuid: 'd1', vehicle_uuid: 'v1', is_active: false },
        ]);
    });

    it('reactiva una asignación retirada sin duplicar al conductor', () => {
        const payload = payloadConAlternancia(asignaciones, asignaciones[1]);

        expect(payload).toEqual([
            { third_party_uuid: 'd1', vehicle_uuid: 'v1', is_active: true },
            { third_party_uuid: 'd3', vehicle_uuid: 'v3', is_active: true },
            { third_party_uuid: 'd2', vehicle_uuid: 'v2', is_active: true },
        ]);
    });

    it('tolera proyectos sin asignaciones', () => {
        expect(payloadConNuevaAsignacion(undefined, { third_party_uuid: 'd1', vehicle_uuid: 'v1' }))
            .toEqual([{ third_party_uuid: 'd1', vehicle_uuid: 'v1', is_active: true }]);
    });
});

describe('validación de asignaciones del formulario', () => {
    it('ignora los históricos retirados al detectar duplicados', () => {
        const { errores, validAssignments } = validarAsignaciones([
            { third_party_uuid: 'd1', vehicle_uuid: 'v1', is_active: false },
            { third_party_uuid: 'd1', vehicle_uuid: 'v2', is_active: true },
        ]);

        expect(errores).toEqual([]);
        expect(validAssignments).toEqual([
            { third_party_uuid: 'd1', vehicle_uuid: 'v2', is_active: true },
        ]);
    });

    it('sigue rechazando conductores y vehículos duplicados entre activos', () => {
        const { errores, validAssignments } = validarAsignaciones([
            { third_party_uuid: 'd1', vehicle_uuid: 'v1', is_active: true },
            { third_party_uuid: 'd1', vehicle_uuid: 'v2', is_active: true },
            { third_party_uuid: 'd2', vehicle_uuid: 'v1', is_active: true },
        ]);

        expect(errores).toEqual([
            'Fila 2: el conductor ya fue asignado a este proyecto.',
            'Fila 3: el vehículo ya fue asignado a este proyecto.',
        ]);
        expect(validAssignments).toEqual([
            { third_party_uuid: 'd1', vehicle_uuid: 'v1', is_active: true },
        ]);
    });

    it('exige conductor y vehículo en cada fila', () => {
        const { errores, validAssignments } = validarAsignaciones([
            { third_party_uuid: 'd1', vehicle_uuid: '', is_active: true },
        ]);

        expect(errores).toEqual(['Fila 1: selecciona conductor y vehículo.']);
        expect(validAssignments).toEqual([]);
    });
});
