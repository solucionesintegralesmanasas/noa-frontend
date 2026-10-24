import { describe, it, expect } from 'vitest';
import {
    formatThirdPartyOption,
    formatThirdPartyList,
    formatVehicleOption,
    formatVehicleList,
} from '../catalogFormatters.js';

describe('catalogFormatters', () => {
    it('formatea persona natural con nombre completo y documento', () => {
        const tp = formatThirdPartyOption({
            uuid: 'tp-1',
            person_type: 'NATURAL',
            first_name: 'Carlos',
            last_name: 'Rodríguez Gómez',
            company_name: null,
            document_number: '10203040',
        });

        expect(tp.display_name).toBe('Carlos Rodríguez Gómez');
        expect(tp.company_name).toBe('Carlos Rodríguez Gómez — 10203040');
        expect(tp.search_text).toContain('Rodríguez Gómez Carlos');
        expect(tp.search_text).toContain('10203040');
    });

    it('usa trade_name cuando company_name viene vacío en persona jurídica', () => {
        const tp = formatThirdPartyOption({
            uuid: 'tp-2',
            person_type: 'JURIDICA',
            company_name: '',
            trade_name: 'Inversiones del Valle',
            document_number: '900123456',
        });

        expect(tp.display_name).toBe('Inversiones del Valle');
        expect(tp.company_name).toBe('Inversiones del Valle — 900123456');
    });

    it('maneja registros vacíos sin lanzar error y deduplica por uuid', () => {
        const lista = formatThirdPartyList([
            { uuid: '1', first_name: 'Ana', last_name: 'Paz', document_number: '111' },
            { uuid: '1', first_name: 'Ana Duplicada', last_name: 'Paz', document_number: '111' },
            { uuid: '2', company_name: null, first_name: null, last_name: null, document_number: null },
        ]);

        expect(lista).toHaveLength(2);
        expect(lista[0].company_name).toBe('Ana Paz — 111');
        expect(lista[1].company_name).toBe('Sin nombre');
    });

    it('formatea vehículos con placa, número interno y texto de búsqueda', () => {
        const vehs = formatVehicleList([
            { uuid: 'v-1', vehicle_license_plate: 'ABC123', internal_number: '045', model: '2024', line: 'NKR' },
            { uuid: 'v-1', vehicle_license_plate: 'ABC123', internal_number: '045' },
        ]);

        expect(vehs).toHaveLength(1);
        expect(vehs[0].vehicle_license_plate).toBe('ABC123');
        expect(vehs[0].display_plate).toBe('ABC123 — Móvil 045');
        expect(vehs[0].search_text).toContain('045');
        expect(vehs[0].search_text).toContain('NKR');
    });
});
