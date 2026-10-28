import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false },
}));
vi.mock('@capacitor/geolocation', () => ({
    Geolocation: {
        checkPermissions: vi.fn(),
        requestPermissions: vi.fn(),
        watchPosition: vi.fn(),
        getCurrentPosition: vi.fn(),
        clearWatch: vi.fn(),
    },
}));
vi.mock('../services/tracking.service', () => ({
    default: { startSession: vi.fn(), sendLocation: vi.fn(), stopSession: vi.fn() },
}));
vi.mock('../services/backgroundTracking.service', () => ({
    default: {
        available: false,
        isLocationEnabled: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        refreshToken: vi.fn(),
        updateContext: vi.fn(),
        getStatus: vi.fn(),
        isBatteryExempt: vi.fn(),
        requestBatteryExemption: vi.fn(),
    },
}));
vi.mock('@store', () => ({
    useUserStore: () => ({ uuid_driver: 'tercero-1', third_party_uuid: null }),
}));
vi.mock('@/utils/logger', () => ({
    default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { useDriverTrackingStore } from '../driverTracking.store.js';

describe('driverTracking: autoStartSiProcede', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        setActivePinia(createPinia());
    });

    it('con vehículos y preferido arranca con el preferido', async () => {
        const store = useDriverTrackingStore();
        store.ensureTracking = vi.fn(async () => 'sesion-1');
        store.updateContext = vi.fn();

        const res = await store.autoStartSiProcede({
            vehicles: [{ uuid: 'veh-1' }, { uuid: 'veh-2' }],
            preferredVehicleUuid: 'veh-2',
        });

        expect(store.ensureTracking).toHaveBeenCalledWith({ vehicleUuid: 'veh-2' });
        expect(res).toBe('sesion-1');
    });

    it('sin preferido usa el primer vehículo de la lista', async () => {
        const store = useDriverTrackingStore();
        store.ensureTracking = vi.fn(async () => 'sesion-1');
        store.updateContext = vi.fn();

        await store.autoStartSiProcede({ vehicles: [{ uuid: 'veh-1' }] });

        expect(store.ensureTracking).toHaveBeenCalledWith({ vehicleUuid: 'veh-1' });
    });

    it('sin vehículos no arranca ni crea sesión', async () => {
        const store = useDriverTrackingStore();
        store.ensureTracking = vi.fn(async () => null);
        store.updateContext = vi.fn();

        const res = await store.autoStartSiProcede({ vehicles: [] });

        expect(res).toBeNull();
        expect(store.ensureTracking).not.toHaveBeenCalled();
        expect(store.updateContext).not.toHaveBeenCalled();
    });

    it('ya rastreando no duplica: solo sincroniza el vehículo', async () => {
        const store = useDriverTrackingStore();
        store.isTracking = true;
        store.watchActive = true;
        store.session = { uuid: 'sesion-vigente' };
        store.ensureTracking = vi.fn(async () => 'sesion-1');
        store.updateContext = vi.fn();

        const res = await store.autoStartSiProcede({ vehicles: [{ uuid: 'veh-1' }] });

        expect(store.ensureTracking).not.toHaveBeenCalled();
        expect(store.updateContext).toHaveBeenCalledWith({ vehicleUuid: 'veh-1' });
        expect(res).toEqual({ uuid: 'sesion-vigente' });
    });

    it('mientras arranca no duplica', async () => {
        const store = useDriverTrackingStore();
        store.starting = true;
        store.ensureTracking = vi.fn(async () => 'sesion-1');
        store.updateContext = vi.fn();

        const res = await store.autoStartSiProcede({ vehicles: [{ uuid: 'veh-1' }] });

        expect(store.ensureTracking).not.toHaveBeenCalled();
        expect(store.updateContext).toHaveBeenCalledWith({ vehicleUuid: 'veh-1' });
        expect(res).toBeNull();
    });
});
