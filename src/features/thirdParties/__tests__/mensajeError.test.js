// Entorno `node` (el predeterminado del proyecto): lógica pura, no hace
// falta el DOM.
import { describe, expect, it } from 'vitest';
import { mensajeErrorValidacion } from '../utils/mensajeError.js';

const fabricar = (data) => ({ response: { status: 422, data } });

describe('mensajeErrorValidacion (regla de licencia única)', () => {
    it('lee el formato del manejador (error.details)', () => {
        const mensaje = mensajeErrorValidacion(fabricar({
            error: { details: { status: ['El conductor ya tiene una licencia vigente.'] } },
        }));
        expect(mensaje).toContain('El conductor ya tiene una licencia vigente.');
    });

    it('lee el formato Laravel (errors)', () => {
        const mensaje = mensajeErrorValidacion(fabricar({
            message: 'The given data was invalid.',
            errors: { status: ['Regla de licencia.'] },
        }));
        expect(mensaje).toContain('Regla de licencia.');
    });

    it('cae al message y luego al defecto', () => {
        expect(mensajeErrorValidacion(fabricar({ message: 'Mal.' }))).toBe('Mal.');
        expect(mensajeErrorValidacion({})).toBe('No se pudo guardar');
        expect(mensajeErrorValidacion(null)).toBe('No se pudo guardar');
    });
});
