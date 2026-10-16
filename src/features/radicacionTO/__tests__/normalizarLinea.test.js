import { describe, it, expect } from 'vitest';
import { normalizarLinea } from '../utils/pasosRadicacion.js';

const paso = (estado) => ({ paso: 'X', estado });

describe('normalizarLinea', () => {
  it('deja un solo paso en proceso: el primero sin completar', () => {
    const r = normalizarLinea([paso('COMPLETADO'), paso('COMPLETADO'), paso('EN_PROCESO'), paso('EN_PROCESO')]);
    expect(r.map((p) => p.estado)).toEqual(['COMPLETADO', 'COMPLETADO', 'EN_PROCESO', 'PENDIENTE']);
  });

  it('muestra como pendientes los pasos recibidos', () => {
    const r = normalizarLinea([paso('EN_PROCESO'), paso('RECIBIDO'), paso('PENDIENTE')]);
    expect(r.map((p) => p.estado)).toEqual(['EN_PROCESO', 'PENDIENTE', 'PENDIENTE']);
  });

  it('con todo completado no marca ninguno en proceso', () => {
    const r = normalizarLinea([paso('COMPLETADO'), paso('COMPLETADO')]);
    expect(r.every((p) => p.estado === 'COMPLETADO')).toBe(true);
  });

  it('no falla con una línea vacía', () => {
    expect(normalizarLinea([])).toEqual([]);
  });
});

import { porcentajeAvance } from '../utils/pasosRadicacion.js';

describe('porcentajeAvance', () => {
  it('convierte "2/4" en 50', () => expect(porcentajeAvance('2/4')).toBe(50));
  it('un trámite completo da 100', () => expect(porcentajeAvance('1/1')).toBe(100));
  it('un valor inválido da 0', () => {
    expect(porcentajeAvance(undefined)).toBe(0);
    expect(porcentajeAvance('x/y')).toBe(0);
    expect(porcentajeAvance('1/0')).toBe(0);
  });
});
