// Entorno `node` (el predeterminado del proyecto): lógica pura, no hace
// falta el DOM.
import { describe, expect, it } from 'vitest';
import { elegirLicencia, afiliadoDeLicencias } from '../driverLicense.js';

// Regresión: en FUEC sale la licencia inactiva/vieja en vez de la más
// reciente. El endpoint no ordena: viene en orden de BD (la más vieja
// primero) y el selector tomaba la primera ACTIVA exacta o licencias[0].
describe('elegirLicencia (licencia más reciente y activa)', () => {
    it('entre dos ACTIVAs elige la de vencimiento más lejano', () => {
        const vieja = { uuid: 'vieja', status: 'ACTIVA', expiration_date: '2023-05-01' };
        const nueva = { uuid: 'nueva', status: 'ACTIVA', expiration_date: '2028-05-01' };
        expect(elegirLicencia([vieja, nueva])).toMatchObject({ uuid: 'nueva' });
    });

    it('tolera estado en minúsculas o con espacios', () => {
        const vencida = { uuid: 'vencida', status: 'VENCIDA', expiration_date: '2023-01-01' };
        const nueva = { uuid: 'nueva', status: 'activa ', expiration_date: '2028-01-01' };
        expect(elegirLicencia([vencida, nueva])).toMatchObject({ uuid: 'nueva' });
    });

    it('sin ninguna ACTIVA muestra la más reciente (no la más vieja)', () => {
        const vieja = { uuid: 'vieja', status: 'VENCIDA', expiration_date: '2022-01-01' };
        const nueva = { uuid: 'nueva', status: 'VENCIDA', expiration_date: '2025-01-01' };
        expect(elegirLicencia([vieja, nueva])).toMatchObject({ uuid: 'nueva' });
    });

    it('una sola ACTIVA se conserva', () => {
        const unica = { uuid: 'unica', status: 'ACTIVA', expiration_date: '2027-06-01' };
        expect(elegirLicencia([unica])).toMatchObject({ uuid: 'unica' });
    });

    it('sin licencias devuelve null', () => {
        expect(elegirLicencia([])).toBeNull();
        expect(elegirLicencia(undefined)).toBeNull();
    });
});

// Regresión: al editar un conductor renovado, la licencia ACTIVA puede apuntar
// al propio conductor (owner_driver sin heredar) mientras la VENCIDA conserva
// al afiliado real. El afiliado debe resolverse entre todas las licencias.
describe('afiliadoDeLicencias (afiliado propietario entre todas las licencias)', () => {
    const catalogo = [
        { uuid: 'afiliado-1', document_number: '9001' },
        { uuid: 'afiliado-2', document_number: '9002' },
    ];

    it('la licencia elegida con afiliado real lo devuelve', () => {
        const licencias = [
            { uuid: 'l1', status: 'ACTIVA', expiration_date: '2029-01-01', owner_driver: { third_party_uuid: 'afiliado-1' } },
        ];
        expect(afiliadoDeLicencias(licencias, catalogo)).toBe('afiliado-1');
    });

    it('si la ACTIVA apunta al conductor, busca el afiliado en la vieja', () => {
        const conductor = 'conductor-1';
        const licencias = [
            { uuid: 'vieja', status: 'VENCIDA', expiration_date: '2023-01-01', owner_driver: { third_party_uuid: 'afiliado-1' } },
            { uuid: 'nueva', status: 'ACTIVA', expiration_date: '2029-01-01', owner_driver: { third_party_uuid: conductor } },
        ];
        expect(afiliadoDeLicencias(licencias, catalogo)).toBe('afiliado-1');
    });

    it('sin afiliado en el catálogo conserva el respaldo del propietario elegido', () => {
        const conductor = 'conductor-1';
        const licencias = [
            { uuid: 'l1', status: 'ACTIVA', expiration_date: '2029-01-01', owner_driver: { third_party_uuid: conductor } },
        ];
        expect(afiliadoDeLicencias(licencias, catalogo)).toBe(conductor);
    });

    it('sin licencias devuelve null', () => {
        expect(afiliadoDeLicencias([], catalogo)).toBeNull();
        expect(afiliadoDeLicencias(undefined, catalogo)).toBeNull();
    });
});
