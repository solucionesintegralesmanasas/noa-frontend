import { describe, it, expect, vi, beforeEach } from 'vitest';

const keys = vi.fn();
vi.mock('@capacitor/preferences', () => ({
    Preferences: { keys: (...a) => keys(...a), get: vi.fn(), set: vi.fn(), remove: vi.fn() },
}));

const { secureStorage, secureSessionStorage } = await import('../secure-storage.js');

describe('SecureStorage.hasStoredData', () => {
    beforeEach(() => keys.mockReset());

    it('es false para un visitante sin datos (el arranque omite la derivación PBKDF2)', async () => {
        keys.mockResolvedValue({ keys: ['sec_client_salt', 'otra_clave'] });
        expect(await secureStorage.hasStoredData()).toBe(false);
    });

    it('es true si hay algún dato cifrado guardado', async () => {
        keys.mockResolvedValue({ keys: ['secure_auth'] });
        expect(await secureStorage.hasStoredData()).toBe(true);
    });

    it('distingue el prefijo: datos de sesión no cuentan para el almacén persistente', async () => {
        keys.mockResolvedValue({ keys: ['session_secure_token'] });
        expect(await secureStorage.hasStoredData()).toBe(false);
        expect(await secureSessionStorage.hasStoredData()).toBe(true);
    });

    it('ante una respuesta inválida del almacén asume que hay datos (calienta la clave como antes)', async () => {
        keys.mockResolvedValue({}); // sin `keys`: la lectura falla dentro del try
        expect(await secureStorage.hasStoredData()).toBe(true);
    });
});
