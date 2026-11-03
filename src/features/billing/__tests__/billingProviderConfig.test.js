import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { billingProviderConfigService } from '../services/billing.service.js';
import { useBillingStore } from '../store/billing.store.js';

vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));

describe('BillingProviderConfig - Protección contra UUIDs vacíos', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('BillingProviderConfigService._validarUuid', () => {
    it('arroja error ante uuid vacío, nulo o de solo espacios', () => {
      expect(() => billingProviderConfigService.consultar('')).toThrow(
        'UUID del proveedor tecnológico es requerido'
      );
      expect(() => billingProviderConfigService.consultar(null)).toThrow(
        'UUID del proveedor tecnológico es requerido'
      );
      expect(() => billingProviderConfigService.consultar('   ')).toThrow(
        'UUID del proveedor tecnológico es requerido'
      );
      expect(() => billingProviderConfigService.guardarEmpresa('', {})).toThrow(
        'UUID del proveedor tecnológico es requerido'
      );
      expect(() => billingProviderConfigService.software('', {})).toThrow(
        'UUID del proveedor tecnológico es requerido'
      );
      expect(() => billingProviderConfigService.softwareNomina('', {})).toThrow(
        'UUID del proveedor tecnológico es requerido'
      );
      expect(() => billingProviderConfigService.certificado('', {})).toThrow(
        'UUID del proveedor tecnológico es requerido'
      );
      expect(() => billingProviderConfigService.resolucion('', {})).toThrow(
        'UUID del proveedor tecnológico es requerido'
      );
      expect(() => billingProviderConfigService.ambiente('', {})).toThrow(
        'UUID del proveedor tecnológico es requerido'
      );
      expect(() => billingProviderConfigService.webhook('', {})).toThrow(
        'UUID del proveedor tecnológico es requerido'
      );
      expect(() => billingProviderConfigService.eliminarEmpresa('')).toThrow(
        'UUID del proveedor tecnológico es requerido'
      );
    });
  });

  describe('BillingStore.fetchProviderConfig', () => {
    it('retorna null sin llamar al servicio cuando el uuid está vacío o indefinido', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(billingProviderConfigService, 'consultar');

      const resVacio = await store.fetchProviderConfig('');
      expect(resVacio).toBeNull();
      expect(spy).not.toHaveBeenCalled();

      const resNulo = await store.fetchProviderConfig(null);
      expect(resNulo).toBeNull();
      expect(spy).not.toHaveBeenCalled();

      const resEspacios = await store.fetchProviderConfig('   ');
      expect(resEspacios).toBeNull();
      expect(spy).not.toHaveBeenCalled();
    });

    it('llama al servicio y asigna providerConfig cuando el uuid es válido', async () => {
      const store = useBillingStore();
      const mockData = { identification_number: '900123456', name: 'Transportes Test' };
      vi.spyOn(billingProviderConfigService, 'consultar').mockResolvedValue({
        data: { data: mockData },
      });

      const res = await store.fetchProviderConfig('uuid-123');
      expect(res).toEqual(mockData);
      expect(store.providerConfig).toEqual(mockData);
    });

    it('arroja error al guardar configuración si el uuid está vacío', async () => {
      const store = useBillingStore();
      await expect(store.guardarConfiguracion('', 'empresa', {})).rejects.toThrow(
        'UUID del proveedor tecnológico es requerido'
      );
    });
  });
});
