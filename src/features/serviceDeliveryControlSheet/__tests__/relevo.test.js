import { describe, expect, it } from 'vitest';
import {
    armarPayloadRelevo,
    candidatosDeRelevo,
    esRelevo,
    etiquetaTurno,
    nombreConductor,
    validarRelevo,
} from '../utils/relevo.js';

const conductor = (uuid, first, last) => ({ uuid, first_name: first, last_name: last });

describe('relevo', () => {
    it('etiqueta el turno solo cuando es mayor a uno', () => {
        expect(etiquetaTurno({ turno: 1 })).toBeNull();
        expect(etiquetaTurno({ turno: 2 })).toBe('Turno 2');
        expect(etiquetaTurno({})).toBeNull();
    });

    it('detecta la planilla que nació de un relevo', () => {
        expect(esRelevo({ relevo_de_uuid: 'x' })).toBe(true);
        expect(esRelevo({})).toBe(false);
    });

    it('nombra al conductor con degradación a documento', () => {
        expect(nombreConductor(conductor('1', 'Ana', 'Pérez'))).toBe('Ana Pérez');
        expect(nombreConductor({ document_number: '123' })).toBe('123');
    });

    it('toma los conductores del catálogo de terceros y excluye al del turno abierto', () => {
        const conductores = [
            { uuid: 'c1', is_active: true, ...conductor('c1', 'A', 'Uno') },
            { uuid: 'c2', is_active: true, ...conductor('c2', 'B', 'Dos') },
            { uuid: 'c3', is_active: false, ...conductor('c3', 'C', 'Tres') },
            { uuid: 'c2', is_active: true, ...conductor('c2', 'B', 'Dos') },
        ];

        const candidatos = candidatosDeRelevo(conductores, 'c1');

        expect(candidatos.map((c) => c.uuid)).toEqual(['c2']);
        expect(candidatos[0].label).toBe('B Dos');
    });

    it('valida el conductor obligatorio', () => {
        expect(validarRelevo({ third_party_uuid: '' })).toHaveProperty('third_party_uuid');
        expect(validarRelevo({ third_party_uuid: 'x' })).toEqual({});
    });

    it('arma el payload solo con los identificadores', () => {
        const payload = armarPayloadRelevo({
            projectUuid: 'p',
            vehicleUuid: 'v',
            thirdPartyUuid: 'c',
        });

        expect(payload).toEqual({
            project_uuid: 'p',
            vehicle_uuid: 'v',
            third_party_uuid: 'c',
        });
    });
});
