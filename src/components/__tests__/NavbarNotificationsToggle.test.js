// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Navbar from '../layout/Navbar.vue';
import { useNotificationsStore } from '@/features/notifications/store/notifications.store.js';

// Mock de Bootstrap Dropdown
const mockShow = vi.fn();
const mockHide = vi.fn();
const mockToggle = vi.fn();

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();

  window.bootstrap = {
    Dropdown: {
      getOrCreateInstance: vi.fn(() => ({
        show: mockShow,
        hide: mockHide,
        toggle: mockToggle,
      })),
    },
  };
});

afterEach(() => {
  delete window.bootstrap;
});

const montarNavbar = () => {
  return mount(Navbar, {
    attachTo: document.body,
    global: {
      stubs: {
        'router-link': { template: '<a><slot /></a>' },
        Transition: false,
      },
    },
  });
};

describe('Navbar - Toggle de notificaciones desde botones de alerta', () => {
  it('abre la campana con el primer click en alertas de la empresa y la cierra con el segundo click', async () => {
    const store = useNotificationsStore();
    // Simulamos notificaciones no leídas de la empresa en state
    store.unreadCounts = { total: 3, PRIORITARIA: 3, NORMAL: 0 };

    const wrapper = montarNavbar();
    await wrapper.vm.$nextTick();

    const botonEmpresa = wrapper.find('.notification-dock-toggle--company');
    expect(botonEmpresa.exists()).toBe(true);

    const triggerEl = document.getElementById('navbarDropdownNotification');

    // 1. Primer click: la campana está cerrada -> debe llamar a show()
    await botonEmpresa.trigger('click');
    expect(mockShow).toHaveBeenCalledTimes(1);
    expect(mockHide).not.toHaveBeenCalled();

    // Simulamos que Bootstrap abre el dropdown en el DOM
    triggerEl.classList.add('show');
    triggerEl.setAttribute('aria-expanded', 'true');

    // 2. Segundo click en el mismo botón: la campana ya está abierta -> debe llamar a hide()
    await botonEmpresa.trigger('click');
    expect(mockHide).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('abre la campana con el primer click en alertas de terceros y la cierra con el segundo click', async () => {
    const store = useNotificationsStore();
    store.unreadCounts = { total: 2, PRIORITARIA: 0, NORMAL: 2 };

    const wrapper = montarNavbar();
    await wrapper.vm.$nextTick();

    const botonTerceros = wrapper.find('.notification-dock-toggle--third-party');
    expect(botonTerceros.exists()).toBe(true);

    const triggerEl = document.getElementById('navbarDropdownNotification');

    // 1. Primer click: debe abrir con show()
    await botonTerceros.trigger('click');
    expect(mockShow).toHaveBeenCalledTimes(1);
    expect(mockHide).not.toHaveBeenCalled();

    // Simulamos apertura en DOM por Bootstrap
    triggerEl.classList.add('show');
    triggerEl.setAttribute('aria-expanded', 'true');

    // 2. Segundo click: debe cerrar con hide()
    await botonTerceros.trigger('click');
    expect(mockHide).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('permite alternar entre empresa y terceros sin cerrar hasta que se repita el click en el activo', async () => {
    const store = useNotificationsStore();
    store.unreadCounts = { total: 3, PRIORITARIA: 2, NORMAL: 1 };

    const wrapper = montarNavbar();
    await wrapper.vm.$nextTick();

    const botonEmpresa = wrapper.find('.notification-dock-toggle--company');
    const botonTerceros = wrapper.find('.notification-dock-toggle--third-party');
    const triggerEl = document.getElementById('navbarDropdownNotification');

    // Abre empresa
    await botonEmpresa.trigger('click');
    expect(mockShow).toHaveBeenCalledTimes(1);
    triggerEl.classList.add('show');

    // Cambia a terceros: NO debe llamar a hide(), solo a show()/enfocar
    await botonTerceros.trigger('click');
    expect(mockHide).not.toHaveBeenCalled();
    expect(mockShow).toHaveBeenCalledTimes(2);

    // Click nuevamente en terceros: ahora sí debe llamar a hide()
    await botonTerceros.trigger('click');
    expect(mockHide).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });
});
