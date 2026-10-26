import { describe, expect, it } from 'vitest';
import {
    filtrarVehiculos,
    formatearNumero,
    formatearPlaca,
    iniciales,
    primerNombre,
    saludoPorHora,
} from '../presentacionConductor.js';

describe('primerNombre', () => {
    it('toma el primer nombre y normaliza mayúsculas', () => {
        expect(primerNombre('CARLOS PÉREZ')).toBe('Carlos');
        expect(primerNombre('  ana  ')).toBe('Ana');
    });

    it('usa el respaldo con nombre vacío o ausente', () => {
        expect(primerNombre('')).toBe('Conductor');
        expect(primerNombre(null)).toBe('Conductor');
        expect(primerNombre(undefined, 'Sin asignar')).toBe('Sin asignar');
    });
});

describe('iniciales', () => {
    it('combina la inicial de los dos primeros nombres', () => {
        expect(iniciales('Carlos Pérez')).toBe('CP');
        expect(iniciales('maría josé lópez')).toBe('MJ');
    });

    it('con un solo nombre usa sus dos primeras letras', () => {
        expect(iniciales('Ana')).toBe('AN');
    });

    it('usa el respaldo cuando no llega nombre', () => {
        expect(iniciales('')).toBe('CO');
        expect(iniciales(null, 'XX')).toBe('XX');
    });
});

describe('saludoPorHora', () => {
    it('saluda según la hora del día', () => {
        expect(saludoPorHora(new Date(2026, 0, 1, 8))).toBe('Buenos días');
        expect(saludoPorHora(new Date(2026, 0, 1, 12))).toBe('Buenas tardes');
        expect(saludoPorHora(new Date(2026, 0, 1, 18))).toBe('Buenas noches');
    });
});

describe('filtrarVehiculos', () => {
    const flota = [
        { plate: 'GUX649', brand: 'Hino', line: 'Dutro', internal_number: 'A-01' },
        { plate: 'ABC123', brand: 'Chevrolet', line: 'NPR', internal_number: 'B-02' },
    ];

    it('filtra por placa, marca, línea o número interno sin distinguir mayúsculas', () => {
        expect(filtrarVehiculos(flota, 'gux')).toEqual([flota[0]]);
        expect(filtrarVehiculos(flota, 'chevrolet')).toEqual([flota[1]]);
        expect(filtrarVehiculos(flota, 'dutro')).toEqual([flota[0]]);
        expect(filtrarVehiculos(flota, 'b-02')).toEqual([flota[1]]);
    });

    it('sin consulta devuelve la lista completa', () => {
        expect(filtrarVehiculos(flota, '')).toBe(flota);
        expect(filtrarVehiculos(flota, '   ')).toBe(flota);
    });

    it('no devuelve coincidencias inexistentes', () => {
        expect(filtrarVehiculos(flota, 'zzz')).toEqual([]);
    });
});

describe('formatearNumero', () => {
    it('formatea con separador de miles de es-CO', () => {
        expect(formatearNumero(1234567)).toBe(Number(1234567).toLocaleString('es-CO'));
        expect(formatearNumero('9876')).toBe(Number(9876).toLocaleString('es-CO'));
    });

    it('devuelve 0 para vacíos o valores no numéricos', () => {
        expect(formatearNumero(null)).toBe('0');
        expect(formatearNumero(undefined)).toBe('0');
        expect(formatearNumero('abc')).toBe('0');
    });
});

describe('formatearPlaca', () => {
    it('separa la placa colombiana de seis caracteres', () => {
        expect(formatearPlaca('GUX649')).toBe('GUX · 649');
        expect(formatearPlaca(' gux649 ')).toBe('GUX · 649');
    });

    it('deja intactas las demás y usa SIN-PLACA si falta', () => {
        expect(formatearPlaca('ABC12')).toBe('ABC12');
        expect(formatearPlaca('')).toBe('SIN-PLACA');
        expect(formatearPlaca(null)).toBe('SIN-PLACA');
    });
});
