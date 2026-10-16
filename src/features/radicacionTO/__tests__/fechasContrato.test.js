// Entorno `node` (el predeterminado del proyecto): es aritmética de fechas, no
// hace falta el DOM.
import { describe, it, expect } from 'vitest';
import { sumarDias, fechasAutomaticas, validarFechasContrato } from '../utils/fechasContrato.js';

describe('sumarDias', () => {
  it('suma un año de días a la fecha de inicio', () => {
    expect(sumarDias('2026-10-02', 365)).toBe('2027-10-02');
  });

  it('no se desplaza un día por la zona horaria del navegador', () => {
    // Un día después del 31 de diciembre tiene que caer en el 1 de enero.
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDias('2027-01-01', 1)).toBe('2027-01-02');
  });

  it('reparte correctamente los meses bisiestos y los de 30 días', () => {
    expect(sumarDias('2024-02-28', 1)).toBe('2024-02-29');
    expect(sumarDias('2024-02-29', 365)).toBe('2025-02-28');
    expect(sumarDias('2026-04-30', 1)).toBe('2026-05-01');
    expect(sumarDias('2026-01-31', 30)).toBe('2026-03-02');
  });

  it('acepta la duración como texto, porque el input numérico puede llegar así', () => {
    expect(sumarDias('2026-10-02', '365')).toBe('2027-10-02');
  });

  it('devuelve cadena vacía en lugar de NaN cuando la fecha no es válida', () => {
    // Este caso es el que provocaba el 422 "Fecha de fin no es una fecha válida".
    expect(sumarDias('', 365)).toBe('');
    expect(sumarDias('NaN-NaN-NaN', 365)).toBe('');
    expect(sumarDias('02/10/2026', 365)).toBe('');
  });
});

describe('fechasAutomaticas', () => {
  it('calcula la fecha de fin como inicio más duración', () => {
    const form = { issue_date: '', start_date: '2026-10-02', end_date: '', duration: 365 };
    fechasAutomaticas(form);
    expect(form.issue_date).toBe('2026-10-02');
    expect(form.end_date).toBe('2027-10-02');
  });

  it('recalcula la fecha de fin al cambiar la duración', () => {
    const form = { issue_date: '2026-10-02', start_date: '2026-10-02', end_date: '', duration: 90 };
    fechasAutomaticas(form);
    expect(form.end_date).toBe('2026-12-31');
    form.duration = 180;
    fechasAutomaticas(form);
    expect(form.end_date).toBe('2027-03-31');
  });

  it('respeta una fecha de emisión escrita a mano', () => {
    const form = { issue_date: '2026-09-15', start_date: '2026-10-02', end_date: '', duration: 30 };
    fechasAutomaticas(form);
    expect(form.issue_date).toBe('2026-09-15');
    expect(form.end_date).toBe('2026-11-01');
  });

  it('deja la fecha de fin vacía si falta la de inicio, sin inventar valores', () => {
    const form = { issue_date: '', start_date: '', end_date: '2026-12-31', duration: 365 };
    fechasAutomaticas(form);
    expect(form.end_date).toBe('');
  });

  it('vacía la fecha de fin si la duración no es un número válido', () => {
    const form = { issue_date: '', start_date: '2026-10-02', end_date: '2027-10-02', duration: '' };
    fechasAutomaticas(form);
    expect(form.end_date).toBe('');
  });
});

describe('validarFechasContrato', () => {
  it('acepta un contrato completo y bien calculado', () => {
    const form = { contract_number: '109', issue_date: '', start_date: '2026-10-02', end_date: '', duration: 365 };
    fechasAutomaticas(form);
    expect(validarFechasContrato(form)).toEqual({});
  });

  it('reporta la fecha de fin no calculable en vez de dejarla pasar', () => {
    const form = { contract_number: '109', issue_date: '2026-10-02', start_date: '', end_date: '', duration: 365 };
    expect(validarFechasContrato(form).start_date).toBeTruthy();
    expect(validarFechasContrato(form).end_date).toBeTruthy();
  });

  it('exige número de contrato y duración mínima', () => {
    const form = { contract_number: '   ', issue_date: '2026-10-02', start_date: '2026-10-02', end_date: '2026-10-03', duration: 0 };
    const errores = validarFechasContrato(form);
    expect(errores.contract_number).toBeTruthy();
    expect(errores.duration).toBeTruthy();
  });

  it('rechaza una fecha de fin anterior a la de inicio', () => {
    const form = { contract_number: '109', issue_date: '2026-10-02', start_date: '2026-10-02', end_date: '2026-10-01', duration: 365 };
    expect(validarFechasContrato(form).end_date).toContain('anterior');
  });
});
