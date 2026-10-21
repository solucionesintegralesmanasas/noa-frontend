// @vitest-environment jsdom
// La barra de navegación no debe quedarse colgada al 85%: se enciende al navegar
// y se apaga en cuanto isNavigating pasa a false (caso del primer login).
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import NavProgressBar from '../NavProgressBar.vue';
import { useConfigStore } from '@store/modules/config.js';

const montarBarra = () => mount(NavProgressBar);

describe('NavProgressBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('no se muestra sin navegación en curso', () => {
    const barra = montarBarra();
    expect(barra.find('.nav-progress-bar').exists()).toBe(false);
  });

  it('se enciende al navegar y se oculta tras endNavigation', async () => {
    const configStore = useConfigStore();
    const barra = montarBarra();

    configStore.startNavigation();
    await barra.vm.$nextTick();
    expect(barra.find('.nav-progress-bar').exists()).toBe(true);
    expect(barra.find('.nav-progress-bar').attributes('aria-valuenow')).toBe('25');

    configStore.startNavigation();
    vi.advanceTimersByTime(2000);
    await barra.vm.$nextTick();
    // Sin endNavigation el avance simulado nunca pasa del 85%
    const tope = Number(barra.find('.nav-progress-bar').attributes('aria-valuenow'));
    expect(tope).toBeGreaterThan(0);
    expect(tope).toBeLessThanOrEqual(85);

    configStore.startNavigation();
    configStore.endNavigation();
    vi.advanceTimersByTime(150);
    await barra.vm.$nextTick();
    expect(barra.find('.nav-progress-bar').attributes('aria-valuenow')).toBe('100');

    vi.advanceTimersByTime(800);
    await barra.vm.$nextTick();
    expect(barra.find('.nav-progress-bar').exists()).toBe(false);
  });

  it('endNavigation del store apaga isNavigating tras su temporizador', () => {
    const configStore = useConfigStore();
    configStore.startNavigation();
    expect(configStore.isNavigating).toBe(true);
    configStore.endNavigation();
    expect(configStore.isNavigating).toBe(true);
    vi.advanceTimersByTime(200);
    expect(configStore.isNavigating).toBe(false);
  });
});
