import { describe, expect, it } from 'vitest';
import {
    asignacionesActivas,
    asignacionDeConductor,
    asignacionDeVehiculo,
    opcionesConductores,
    opcionesVehiculos,
} from '../utils/projectAssignments.js';

const detalle = {
    uuid: 'proyecto-1',
    assignments: [
        {
            uuid: 'a1',
            third_party_uuid: 'conductor-1',
            vehicle_uuid: 'vehiculo-1',
            is_active: true,
            conductor: {
                uuid: 'conductor-1',
                first_name: 'BRANDON JOSE',
                last_name: 'OROZCO PINEDA',
                document_number: '900000001',
                company_name: null,
            },
            vehicle: {
                uuid: 'vehiculo-1',
                vehicle_license_plate: 'TLQ735',
                internal_number: 'INT-01',
            },
        },
        {
            uuid: 'a2',
            third_party_uuid: 'conductor-2',
            vehicle_uuid: 'vehiculo-2',
            is_active: true,
            conductor: {
                uuid: 'conductor-2',
                first_name: 'RAMON',
                last_name: 'AVENDAÑO',
                document_number: '900000002',
                company_name: null,
            },
            vehicle: {
                uuid: 'vehiculo-2',
                vehicle_license_plate: 'UPB554',
                internal_number: null,
            },
        },
        {
            uuid: 'a3',
            third_party_uuid: 'conductor-3',
            vehicle_uuid: 'vehiculo-3',
            is_active: false,
            conductor: { uuid: 'conductor-3', first_name: 'RETIRADO', last_name: 'PRUEBA' },
            vehicle: { uuid: 'vehiculo-3', vehicle_license_plate: 'XXX000' },
        },
    ],
};

describe('projectAssignments', () => {
    it('devuelve solo las asignaciones activas del proyecto seleccionado', () => {
        const activas = asignacionesActivas(detalle, 'proyecto-1');

        expect(activas).toHaveLength(2);
        expect(activas.map((a) => a.uuid)).toEqual(['a1', 'a2']);
    });

    it('no cae a otros datos si el detalle no corresponde al proyecto', () => {
        expect(asignacionesActivas(detalle, 'otro-proyecto')).toEqual([]);
        expect(asignacionesActivas(null, 'proyecto-1')).toEqual([]);
    });

    it('acepta la clave legacy driverVehicleAssignments', () => {
        const legacy = {
            uuid: 'proyecto-1',
            driverVehicleAssignments: detalle.assignments,
        };

        expect(asignacionesActivas(legacy, 'proyecto-1')).toHaveLength(2);
    });

    it('arma opciones únicas con los datos actualizados del proyecto', () => {
        const activas = asignacionesActivas(detalle, 'proyecto-1');

        expect(opcionesVehiculos(activas)).toEqual([
            { uuid: 'vehiculo-1', vehicle_license_plate: 'TLQ735', internal_number: 'INT-01' },
            { uuid: 'vehiculo-2', vehicle_license_plate: 'UPB554', internal_number: null },
        ]);

        expect(opcionesConductores(activas)).toEqual([
            {
                uuid: 'conductor-1',
                first_name: 'BRANDON JOSE',
                last_name: 'OROZCO PINEDA',
                company_name: null,
                document_number: '900000001',
            },
            {
                uuid: 'conductor-2',
                first_name: 'RAMON',
                last_name: 'AVENDAÑO',
                company_name: null,
                document_number: '900000002',
            },
        ]);
    });

    it('encuentra el par conductor → vehículo y vehículo → conductor', () => {
        const activas = asignacionesActivas(detalle, 'proyecto-1');

        expect(asignacionDeConductor(activas, 'conductor-2')?.vehicle_uuid).toBe('vehiculo-2');
        expect(asignacionDeVehiculo(activas, 'vehiculo-1')?.third_party_uuid).toBe('conductor-1');
        expect(asignacionDeConductor(activas, 'conductor-3')).toBeNull();
        expect(asignacionDeVehiculo(activas, '')).toBeNull();
    });

    it('sin asignaciones no inventa opciones', () => {
        expect(opcionesVehiculos([])).toEqual([]);
        expect(opcionesConductores([])).toEqual([]);
    });
});
