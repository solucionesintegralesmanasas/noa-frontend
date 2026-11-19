// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const { mockDownloadProjectZip, mockToast } = vi.hoisted(() => ({
    mockDownloadProjectZip: vi.fn(),
    mockToast: vi.fn(),
}));

vi.mock('../services/serviceDeliveryControlSheet.service.js', () => ({
    default: { downloadProjectZip: mockDownloadProjectZip },
}));
vi.mock('@/utils/toast.js', () => ({ toast: mockToast }));
vi.mock('@/utils/error-handler.js', () => ({ handleGlobalError: vi.fn() }));

import { useServiceDeliveryControlSheetStore } from '../store/serviceDeliveryControlSheet.store.js';

describe('store.downloadProjectZip', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setActivePinia(createPinia());
    });

    it('descarga el proyecto en un solo ZIP y avisa al usuario', async () => {
        mockDownloadProjectZip.mockResolvedValueOnce(undefined);

        const store = useServiceDeliveryControlSheetStore();
        await store.downloadProjectZip({
            project_uuid: 'p-1',
            fecha_desde: '2026-11-01',
            fecha_hasta: '2026-11-15',
            incluir_abiertos: 1,
        });

        expect(mockDownloadProjectZip).toHaveBeenCalledWith(
            expect.objectContaining({ project_uuid: 'p-1', incluir_abiertos: 1 }),
        );
        expect(mockToast).toHaveBeenCalledWith('¡Éxito!', expect.stringContaining('ZIP'), 'success');
        expect(store.loading).toBe(false);
    });

    it('si la descarga falla, avisa con el mensaje de respaldo y relanza', async () => {
        mockDownloadProjectZip.mockRejectedValueOnce(new Error('Sin planillas'));

        const store = useServiceDeliveryControlSheetStore();

        await expect(store.downloadProjectZip({ project_uuid: 'p-1' })).rejects.toThrow('Sin planillas');
        expect(store.loading).toBe(false);
    });
});
