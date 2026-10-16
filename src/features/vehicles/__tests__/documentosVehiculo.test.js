import { describe, it, expect } from 'vitest';
import { expiryDe, estadoDocumento, estadoPolizas, debenAgruparse, vencimientoMasProximo } from '../utils/documentosVehiculo.js';

const DIA_MS = 24 * 60 * 60 * 1000;
const fechaMas = (dias) => new Date(Date.now() + dias * DIA_MS).toISOString().slice(0, 10);

const doc = (vence, estado = 'VIGENTE') => ({ expiry_date: vence, status: estado });

describe('expiryDe', () => {
  it('lee expiry_date en documentos y expiration_date en tarjetas', () => {
    expect(expiryDe({ expiry_date: '2027-01-01' })).toBe('2027-01-01');
    expect(expiryDe({ expiration_date: '2027-02-01' }, true)).toBe('2027-02-01');
  });

  it('sin documento devuelve nulo', () => {
    expect(expiryDe(null)).toBeNull();
    expect(expiryDe(undefined)).toBeNull();
  });
});

describe('estadoDocumento', () => {
  it('sin documento es faltante', () => {
    expect(estadoDocumento(null)).toBe('faltante');
    expect(estadoDocumento(undefined)).toBe('faltante');
  });

  it('status VENCIDO manda sobre la fecha en documentos', () => {
    expect(estadoDocumento(doc(fechaMas(60), 'VENCIDO'))).toBe('vencido');
  });

  it('fecha pasada es vencido aunque el estado diga VIGENTE', () => {
    expect(estadoDocumento(doc(fechaMas(-10), 'VIGENTE'))).toBe('vencido');
  });

  it('dentro de 30 días es por-vencer y lejos es vigente', () => {
    expect(estadoDocumento(doc(fechaMas(10)))).toBe('por-vencer');
    expect(estadoDocumento(doc(fechaMas(200)))).toBe('vigente');
  });

  it('sin fecha o con fecha inválida no rompe y queda vigente', () => {
    expect(estadoDocumento({ status: 'VIGENTE' })).toBe('vigente');
    expect(estadoDocumento(doc('no-es-fecha'))).toBe('vigente');
  });

  it('en tarjetas solo manda la fecha: ignora status VENCIDO', () => {
    expect(estadoDocumento({ status: 'VENCIDO', expiration_date: fechaMas(200) }, { esTarjeta: true })).toBe('vigente');
    expect(estadoDocumento({ expiration_date: fechaMas(-5) }, { esTarjeta: true })).toBe('vencido');
  });

  it('una tarjeta sin documento es faltante', () => {
    expect(estadoDocumento(null, { esTarjeta: true })).toBe('faltante');
  });
});

describe('estadoPolizas', () => {
  it('ambas vigentes es vigente', () => {
    expect(estadoPolizas(doc(fechaMas(200)), doc(fechaMas(200)))).toBe('vigente');
  });

  it('ambas vencidas es vencido', () => {
    expect(estadoPolizas(doc(fechaMas(-10)), doc(fechaMas(-5)))).toBe('vencido');
  });

  it('una vencida y otra vigente es vencido (peor caso)', () => {
    expect(estadoPolizas(doc(fechaMas(-10)), doc(fechaMas(200)))).toBe('vencido');
    expect(estadoPolizas(doc(fechaMas(200)), doc(fechaMas(-10)))).toBe('vencido');
  });

  it('una por vencer y otra vigente es por-vencer', () => {
    expect(estadoPolizas(doc(fechaMas(10)), doc(fechaMas(200)))).toBe('por-vencer');
  });

  it('vencido pesa más que por-vencer', () => {
    expect(estadoPolizas(doc(fechaMas(-1)), doc(fechaMas(5)))).toBe('vencido');
  });

  it('ambas faltantes es faltante', () => {
    expect(estadoPolizas(null, null)).toBe('faltante');
  });
});

describe('debenAgruparse', () => {
  it('solo cuando existen ambas pólizas', () => {
    expect(debenAgruparse(doc(fechaMas(200)), doc(fechaMas(200)))).toBe(true);
    expect(debenAgruparse(doc(fechaMas(200)), null)).toBe(false);
    expect(debenAgruparse(null, doc(fechaMas(200)))).toBe(false);
    expect(debenAgruparse(null, null)).toBe(false);
    expect(debenAgruparse(null, undefined)).toBe(false);
  });
});

describe('vencimientoMasProximo', () => {
  it('devuelve el vencimiento más próximo con su valor original', () => {
    expect(vencimientoMasProximo(doc('2027-09-22'), doc('2027-03-10'))).toBe('2027-03-10');
    expect(vencimientoMasProximo(doc('2027-03-10'), doc('2027-09-22'))).toBe('2027-03-10');
  });

  it('con una sola fecha devuelve esa', () => {
    expect(vencimientoMasProximo(doc('2027-03-10'), null)).toBe('2027-03-10');
    expect(vencimientoMasProximo(null, doc('2027-03-10'))).toBe('2027-03-10');
  });

  it('sin fechas devuelve nulo', () => {
    expect(vencimientoMasProximo(null, null)).toBeNull();
    expect(vencimientoMasProximo({ status: 'VIGENTE' }, null)).toBeNull();
  });

  it('ignora fechas inválidas', () => {
    expect(vencimientoMasProximo(doc('no-es-fecha'), doc('2027-03-10'))).toBe('2027-03-10');
  });
});
