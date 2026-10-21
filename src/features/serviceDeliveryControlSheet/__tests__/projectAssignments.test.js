import { describe, expect, it } from 'vitest';
import {
    armarPayloadCreacion,
    asignacionesActivas,
    asignacionDeConductor,
    asignacionDeVehiculo,
    filasDeProyecto,
    opcionesConductores,
    opcionesVehiculos,
    resumenCreacion,
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

describe('filas de proyecto ( creación masiva SPEC-009)', () => {
    it('excluye inactivas: el detalle con asignación retirada no llega a la tabla', () => {
        const filas = filasDeProyecto(asignacionesActivas(detalle, 'proyecto-1'));

        expect(filas).toHaveLength(2);
        expect(filas.map((f) => f.vehicle_uuid)).toEqual(['vehiculo-1', 'vehiculo-2']);
    });

    it('arma la fila con placa, interno, conductor y documento', () => {
        const filas = filasDeProyecto(asignacionesActivas(detalle, 'proyecto-1'));

        expect(filas[0]).toEqual({
            asignacion_uuid: 'a1',
            vehicle_uuid: 'vehiculo-1',
            conductor_uuid: 'conductor-1',
            placa: 'TLQ735',
            internal_number: 'INT-01',
            conductor_nombre: 'BRANDON JOSE OROZCO PINEDA',
            document_number: '900000001',
        });
    });

    it('excluye la fila sin conductor o sin vehículo del proyecto', () => {
        const filas = filasDeProyecto([
            { uuid: 'x1', third_party_uuid: null, vehicle_uuid: 'vehiculo-9', conductor: {}, vehicle: { vehicle_license_plate: 'SIN001' } },
            { uuid: 'x2', third_party_uuid: 'conductor-9', vehicle_uuid: null, conductor: { first_name: 'HUECO' } },
            { uuid: 'x3', third_party_uuid: 'conductor-9', vehicle_uuid: 'vehiculo-9', conductor: { first_name: 'OK', last_name: 'FILA' }, vehicle: { vehicle_license_plate: 'OKX123' } },
        ]);

        expect(filas).toHaveLength(1);
        expect(filas[0]).toMatchObject({ placa: 'OKX123', conductor_nombre: 'OK FILA' });
    });

    it('deduplica por coche: de varias asignaciones del mismo vehículo queda la primera', () => {
        const filas = filasDeProyecto([
            { uuid: 'p1', third_party_uuid: 'c1', vehicle_uuid: 'v1', conductor: { first_name: 'PRIMERO' }, vehicle: { vehicle_license_plate: 'AAA111' } },
            { uuid: 'p2', third_party_uuid: 'c2', vehicle_uuid: 'v1', conductor: { first_name: 'SEGUNDO' }, vehicle: { vehicle_license_plate: 'AAA111' } },
        ]);

        expect(filas).toHaveLength(1);
        expect(filas[0]).toMatchObject({ conductor_uuid: 'c1', conductor_nombre: 'PRIMERO' });
    });

    it('el jurídico usa su razón social como nombre de conductor', () => {
        const filas = filasDeProyecto([{
            uuid: 'j1',
            third_party_uuid: 'c-j',
            vehicle_uuid: 'v-j',
            conductor: { company_name: 'TRANSPORTES JURIDICO SAS', first_name: null, last_name: null },
            vehicle: { vehicle_license_plate: 'JUR123' },
        }]);

        expect(filas[0].conductor_nombre).toBe('TRANSPORTES JURIDICO SAS');
    });
});

describe('resumen de creación (SPEC-009)', () => {
    it('cuenta hojas y planillas diarias por la duración del servicio', () => {
        const filas = filasDeProyecto(asignacionesActivas(detalle, 'proyecto-1'));

        expect(resumenCreacion(filas, 3)).toEqual({ hojas: 2, planillasDiarias: 6 });
        expect(resumenCreacion([{}, {}], 14)).toEqual({ hojas: 2, planillasDiarias: 28 });
    });

    it('con un solo día la hoja es su propia planilla diaria (sin hijas extra)', () => {
        expect(resumenCreacion([{}], 1)).toEqual({ hojas: 1, planillasDiarias: 1 });
    });

    it('sin filas o con días inválidos no explota', () => {
        expect(resumenCreacion([], 5)).toEqual({ hojas: 0, planillasDiarias: 0 });
        expect(resumenCreacion(null)).toEqual({ hojas: 0, planillasDiarias: 0 });
        // Días no positivos quedan en un solo día de servicio.
        expect(resumenCreacion([{}], 0)).toEqual({ hojas: 1, planillasDiarias: 1 });
        expect(resumenCreacion([{}], -3)).toEqual({ hojas: 1, planillasDiarias: 1 });
    });
});

describe('payload del bulk (SPEC-009)', () => {
    const comunes = {
        company_uuid: 'empresa-1',
        project_uuid: 'proyecto-1',
        service_date: '2026-10-10',
        start_date: '2026-10-10',
        end_date: '2026-10-11',
        daily_route: '  Ruta norte  ',
        type_of_control_sheet: 'DIRECTO_CON_LA_EMPRESA',
        is_active: '1',
        vehicle_uuid: 'vehiculo-1',
        third_party_uuid: 'conductor-1',
        official_name_and_surname: 'BRANDON JOSE OROZCO PINEDA',
        fuec_uuid: 'fuec-1',
    };

    it('envía vehicle_uuids y NINGÚN par, responsable ni FUEC', () => {
        const payload = armarPayloadCreacion(comunes, ['vehiculo-1', 'vehiculo-2']);

        expect(payload.vehicle_uuids).toEqual(['vehiculo-1', 'vehiculo-2']);
        expect(payload).not.toHaveProperty('vehicle_uuid');
        expect(payload).not.toHaveProperty('third_party_uuid');
        expect(payload).not.toHaveProperty('official_name_and_surname');
        expect(payload).not.toHaveProperty('fuec_uuid');
        expect(payload.type_of_control_sheet).toBe('DIRECTO_CON_LA_EMPRESA');
        expect(payload.daily_route).toBe('Ruta norte');
        expect(payload.is_active).toBe(true);
    });

    it('sincroniza service_date con la fecha de inicio si no venía', () => {
        const sinService = { ...comunes };
        delete sinService.service_date;

        expect(armarPayloadCreacion({ ...sinService, service_date: '' }, ['v1']).service_date).toBe('2026-10-10');
    });

    it('descarta huecos en la lista de coches y normaliza is_active', () => {
        const payload = armarPayloadCreacion({ ...comunes, is_active: '0' }, [null, '', 'v2']);

        expect(payload.vehicle_uuids).toEqual(['v2']);
        expect(payload.is_active).toBe(false);
    });
});
