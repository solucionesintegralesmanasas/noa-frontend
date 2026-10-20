// @vitest-environment jsdom
// Regresión: el primer login dejaba la barra de navegación colgada al 85%
// porque endNavigation() solo se llamaba en el catch. Debe apagarse siempre.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';

import LoginView from '../views/LoginView.vue';
import { useAuthStore } from '../store/auth.store.js';
import { useConfigStore } from '@/store/modules/config.js';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(async () => {}) }),
  useRoute: () => ({ query: {} }),
}));
vi.mock('../store/auth.store.js', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@/hooks/useFormManager.js', () => ({
  useFormManager: (inicial) => ({
    formData: ref(inicial),
    errors: {},
    isSubmitting: ref(false),
    validateAndFocus: vi.fn(async () => true),
  }),
}));
vi.mock('@/utils/error-handler.js', () => ({
  handleGlobalError: vi.fn(),
}));

const montarConLoginQue = (rechaza) => {
  const login = vi.fn(() => (rechaza ? Promise.reject(new Error('boom')) : Promise.resolve({})));
  useAuthStore.mockReturnValue({ login, isHydrated: true, isAuthenticated: false });
  const vista = mount(LoginView, {
    global: { stubs: { 'router-link': true } },
  });
  return { vista, login };
};

describe('LoginView apaga la barra de navegación', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('la apaga cuando el login tiene éxito', async () => {
    const configStore = useConfigStore();
    const { vista } = montarConLoginQue(false);

    await vista.find('form').trigger('submit');
    await flushPromises();

    expect(configStore.isNavigating).toBe(true);
    vi.advanceTimersByTime(200);
    expect(configStore.isNavigating).toBe(false);
  });

  it('la apaga también cuando el login falla', async () => {
    const configStore = useConfigStore();
    const { vista } = montarConLoginQue(true);

    await vista.find('form').trigger('submit');
    await flushPromises();

    expect(configStore.isNavigating).toBe(true);
    vi.advanceTimersByTime(200);
    expect(configStore.isNavigating).toBe(false);
    expect(vista.text()).toContain('Correo o contraseña incorrectos.');
  });
});
