// Entorno `node` (el predeterminado del proyecto): es aritmética de fechas, no
// hace falta el DOM.
import { describe, it, expect } from 'vitest';
import { diasEntre, mesesEntre, sumarMeses, fechasAutomaticas, validarFechasContrato } from '../utils/fechasContrato.js';

describe('diasEntre', () => {
  it('cuenta los días de un año de vigencia', () => {
    expect(diasEntre('2026-10-02', '2027-10-02')).toBe(365);
  });

  it('no se desplaza un día por la zona horaria del navegador', () => {
    expect(diasEntre('2026-12-31', '2027-01-01')).toBe(1);
    expect(diasEntre('2027-01-01', '2027-01-02')).toBe(1);
  });

  it('reparte correctamente los meses bisiestos y los de 30 días', () => {
    expect(diasEntre('2024-02-28', '2024-02-29')).toBe(1);
    expect(diasEntre('2024-02-29', '2025-02-28')).toBe(365);
    expect(diasEntre('2026-01-31', '2026-03-02')).toBe(30);
  });

  it('devuelve 0 en lugar de NaN cuando una fecha no es válida', () => {
    expect(diasEntre('', '2027-10-02')).toBe(0);
    expect(diasEntre('NaN-NaN-NaN', '2027-10-02')).toBe(0);
    expect(diasEntre('02/10/2026', '2027-10-02')).toBe(0);
  });
});

describe('fechasAutomaticas', () => {
  it('calcula la duración en días a partir de las fechas de inicio y fin', () => {
    const form = { issue_date: '', start_date: '2026-10-02', end_date: '2027-10-02', duration: '' };
    fechasAutomaticas(form);
    expect(form.issue_date).toBe('2026-10-02');
    expect(form.duration).toBe(365);
  });

  it('recalcula la duración al cambiar la fecha de fin', () => {
    const form = { issue_date: '2026-10-02', start_date: '2026-10-02', end_date: '2026-12-31', duration: 0 };
    fechasAutomaticas(form);
    expect(form.duration).toBe(90);
    form.end_date = '2027-03-31';
    fechasAutomaticas(form);
    expect(form.duration).toBe(180);
  });

  it('respeta una fecha de emisión escrita a mano', () => {
    const form = { issue_date: '2026-09-15', start_date: '2026-10-02', end_date: '2026-11-01', duration: 0 };
    fechasAutomaticas(form);
    expect(form.issue_date).toBe('2026-09-15');
    expect(form.duration).toBe(30);
  });

  it('deja la duración en 0 si falta alguna de las dos fechas', () => {
    const sinInicio = { issue_date: '', start_date: '', end_date: '2026-12-31', duration: 365 };
    fechasAutomaticas(sinInicio);
    expect(sinInicio.duration).toBe(0);

    const sinFin = { issue_date: '', start_date: '2026-10-02', end_date: '', duration: 365 };
    fechasAutomaticas(sinFin);
    expect(sinFin.duration).toBe(0);
  });
});

describe('mesesEntre', () => {
  it('cuenta los meses completos de la vigencia', () => {
    expect(mesesEntre('2026-01-01', '2028-01-01')).toBe(24);
    expect(mesesEntre('2026-11-12', '2027-11-12')).toBe(12);
  });

  it('no cuenta un mes parcial', () => {
    expect(mesesEntre('2026-01-01', '2026-01-31')).toBe(0);
    expect(mesesEntre('2026-01-15', '2026-02-14')).toBe(0);
  });

  it('ajusta el fin de mes como sumarMeses', () => {
    expect(mesesEntre('2026-01-31', '2026-02-28')).toBe(1);
  });

  it('devuelve 0 con fechas inválidas o invertidas', () => {
    expect(mesesEntre('', '2026-02-28')).toBe(0);
    expect(mesesEntre('2026-02-28', '2026-01-31')).toBe(0);
  });
});

describe('validarFechasContrato', () => {
  it('acepta un contrato completo y bien calculado', () => {
    const form = { issue_date: '', start_date: '2026-10-02', end_date: '2027-10-02', duration: 0 };
    fechasAutomaticas(form);
    expect(validarFechasContrato(form)).toEqual({});
  });

  it('exige la fecha de fin', () => {
    const form = { issue_date: '2026-10-02', start_date: '2026-10-02', end_date: '', duration: 0 };
    expect(validarFechasContrato(form).end_date).toBeTruthy();
  });

  it('exige que la fecha de fin sea posterior a la de inicio', () => {
    const form = { issue_date: '2026-10-02', start_date: '2026-10-02', end_date: '2026-10-02', duration: 0 };
    expect(validarFechasContrato(form).end_date).toContain('posterior');
  });

  it('acepta 24 meses exactos y rechaza un día más en el contrato de vinculación', () => {
    const exacto = { issue_date: '2026-01-01', start_date: '2026-01-01', end_date: '2028-01-01', duration: 730 };
    expect(validarFechasContrato(exacto, { maxMeses: 24 })).toEqual({});

    const excedido = { ...exacto, end_date: '2028-01-02' };
    expect(validarFechasContrato(excedido, { maxMeses: 24 }).end_date).toContain('24 meses');
  });

  it('exige que el contrato de vinculación esté vigente', () => {
    const form = { issue_date: '2020-01-01', start_date: '2020-01-01', end_date: '2020-12-31', duration: 365 };
    expect(validarFechasContrato(form, { exigirVigente: true }).end_date).toContain('vigente');
    expect(validarFechasContrato(form)).toEqual({});
  });

  it('suma meses ajustando al último día del mes', () => {
    expect(sumarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(sumarMeses('2026-05-31', 9)).toBe('2027-02-28');
  });
});
