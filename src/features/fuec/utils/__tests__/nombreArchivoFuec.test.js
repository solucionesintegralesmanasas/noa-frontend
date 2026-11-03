import { describe, it, expect } from 'vitest';
import { nombreArchivoFuec } from '../nombreArchivoFuec.js';

describe('nombreArchivoFuec', () => {
    it('arma "FUEC - placa - recorrido.pdf" como el backend', () => {
        const nombre = nombreArchivoFuec({
            vehicle: { vehicle_license_plate: 'ABC123' },
            origin_route: 'Bogotá',
            destination_route: 'Medellín',
        });

        expect(nombre).toBe('FUEC - ABC123 - Bogotá - Medellín.pdf');
    });

    it('usa SINPLACA y conserva el recorrido cuando falta la placa', () => {
        expect(nombreArchivoFuec({ origin_route: 'Cali', destination_route: 'Palmira' }))
            .toBe('FUEC - SINPLACA - Cali - Palmira.pdf');
    });

    it('admite un solo tramo de la ruta', () => {
        expect(nombreArchivoFuec({ placa: 'XYZ987', origin: 'Cali' }))
            .toBe('FUEC - XYZ987 - Cali.pdf');
    });

    it('limpia caracteres inválidos y no deja separadores al final', () => {
        expect(nombreArchivoFuec({
            vehicle_license_plate: 'ABC 123',
            origin_route: 'Norte/Sur',
            destination_route: 'Centro: Occidente',
        })).toBe('FUEC - ABC 123 - Norte-Sur - Centro- Occidente.pdf');
    });

    it('usa SINPLACA cuando no hay ningún dato, igual que el backend', () => {
        expect(nombreArchivoFuec(null, 'uuid-123')).toBe('FUEC - SINPLACA.pdf');
    });
});
