// Garantías de detección de plataforma para el layout móvil Android (mockup Capacitor).
// Solo cubre la lógica pura: nunca debe activar el layout móvil en web/iOS.
import { describe, expect, it } from 'vitest';
import { esAndroidNativo, usePlatform } from '../usePlatform.js';

describe('esAndroidNativo', () => {
    it('activa solo en android nativo', () => {
        expect(esAndroidNativo('android', true)).toBe(true);
    });

    it('no activa en web aunque la plataforma diga android sin bridge nativo', () => {
        expect(esAndroidNativo('android', false)).toBe(false);
    });

    it('no activa en ios nativo', () => {
        expect(esAndroidNativo('ios', true)).toBe(false);
    });

    it('no activa en web de escritorio', () => {
        expect(esAndroidNativo('web', false)).toBe(false);
    });
});

describe('usePlatform hook', () => {
    it('expone computadas reactivas sin error de ejecucion', () => {
        const platform = usePlatform();
        expect(typeof platform.esAndroidNativo.value).toBe('boolean');
        expect(typeof platform.esNativo.value).toBe('boolean');
        expect(typeof platform.esIosNativo.value).toBe('boolean');
    });
});
