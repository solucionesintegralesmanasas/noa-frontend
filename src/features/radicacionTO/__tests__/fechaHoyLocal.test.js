// Entorno `node` (el predeterminado del proyecto): lógica pura, no hace
// falta el DOM.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dateUtils } from '@/utils/date.js';

// Regresión: RadicacionListView usaba `new Date().toISOString().slice(0, 10)`
// (fecha UTC) para `date_of_creation`: en Colombia (UTC-5) después de las
// 19:00 sellaba MAÑANA. Los formularios deben usar la fecha local.
describe('fecha de hoy local (no UTC)', () => {
    beforeEach(() => {
        process.env.TZ = 'America/Bogota';
        // 2026-10-05 19:30 hora Colombia = 2026-10-06 00:30 UTC.
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-05T19:30:00-05:00'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('dateUtils.now da el día local, no el UTC', () => {
        expect(dateUtils.now('YYYY-MM-DD')).toBe('2026-10-05');
    });

    it('documenta el bug viejo: toISOString da el día siguiente', () => {
        expect(new Date().toISOString().slice(0, 10)).toBe('2026-10-06');
    });
});
