// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import {
    formatearFechaCorta,
    formatearFechaLarga,
    construirCeldasMes,
    construirCeldasSemana,
    estiloEventoCalendario,
    enlaceEditarDocumento,
} from '../utils/expirationCalendarUtils.js';
import { useExpirationCalendarStore } from '../store/expirationCalendar.store.js';
import ExpirationCalendarToolbar from '../components/ExpirationCalendarToolbar.vue';
import ExpirationCalendarGrid from '../components/ExpirationCalendarGrid.vue';

vi.mock('../services/vehicleReports.service.js', () => ({
    default: {
        calendar: vi.fn(),
        getFilterOptions: vi.fn(),
        downloadExcel: vi.fn(),
        downloadPdf: vi.fn(),
        syncNotifications: vi.fn(),
    },
    vehicleReportsService: {
        calendar: vi.fn(),
        getFilterOptions: vi.fn(),
        downloadExcel: vi.fn(),
        downloadPdf: vi.fn(),
        syncNotifications: vi.fn(),
    },
}));

vi.mock('@/utils/toast.js', () => ({
    toast: vi.fn(() => Promise.resolve()),
}));

import vehicleReportsService from '../services/vehicleReports.service.js';

describe('Calendario de Vencimientos — Utilidades y Componentes', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('formatearFechaCorta y formatearFechaLarga devuelven fechas en español', () => {
        expect(formatearFechaCorta('2026-04-06')).toBe('06/04/2026');
        expect(formatearFechaLarga('2026-04-06')).toBe('06 de Abril, 2026');
    });

    it('construirCeldasMes construye 42 celdas y marca alertas del día', () => {
        const eventosDia10 = [
            { id: '1', vehicle_license_plate: 'AAA111', category: 'SOAT', date: '2026-04-10', status: 'expired', days_remaining: -2 },
            { id: '2', vehicle_license_plate: 'BBB222', category: 'RTM', date: '2026-04-10', status: 'expiring_5d', days_remaining: 3 },
            { id: '3', vehicle_license_plate: 'CCC333', category: 'RCC', date: '2026-04-10', status: 'expiring_15d', days_remaining: 10 },
            { id: '4', vehicle_license_plate: 'DDD444', category: 'OPERATION_CARD', date: '2026-04-10', status: 'valid', days_remaining: 25 },
        ];
        const celdas = construirCeldasMes(2026, 4, {
            '2026-04-10': eventosDia10,
        }, '2026-04-06');

        expect(celdas).toHaveLength(42);
        const celda10 = celdas.find((c) => c.date === '2026-04-10');
        expect(celda10).toBeDefined();
        expect(celda10.isCurrentMonth).toBe(true);
        expect(celda10.events).toHaveLength(4);
        expect(celda10.totalCount).toBe(4);
        expect(celda10.alertCount).toBe(3);
        expect(celda10.hasCritical).toBe(true);
    });

    it('construirCeldasSemana construye los 7 días de la semana seleccionada', () => {
        const celdas = construirCeldasSemana('2026-04-15', 4, 2026, {
            '2026-04-15': [
                { id: '1', vehicle_license_plate: 'TJW731', category: 'SOAT', date: '2026-04-15', status: 'today', days_remaining: 0 },
            ],
        }, '2026-04-15');

        expect(celdas).toHaveLength(7);
        const miercoles = celdas.find((c) => c.date === '2026-04-15');
        expect(miercoles).toBeDefined();
        expect(miercoles.isToday).toBe(true);
        expect(miercoles.events).toHaveLength(1);
    });

    it('estiloEventoCalendario y enlaceEditarDocumento resuelven tonos y rutas', () => {
        const evVencido = {
            date: '2026-04-06',
            status: 'expired',
            days_remaining: -4,
            category: 'SOAT',
            category_label: 'SOAT',
            document_uuid: 'doc-123',
            vehicle_uuid: 'veh-456',
            vehicle_license_plate: 'TJW731',
        };
        const estilo = estiloEventoCalendario(evVencido);
        expect(estilo.tone).toBe('danger');
        expect(estilo.chipText).toBe('TJW731 · SOAT Vencido');
        expect(estilo.statusText).toContain('(Vencido)');

        const link = enlaceEditarDocumento(evVencido, (perm) => perm === 'vehicle_documents.update');
        expect(link).toEqual({
            path: '/vehiculos-documentos/soat/editar/doc-123',
            query: { wizard: 'veh-456' },
        });
    });

    it('useExpirationCalendarStore carga eventos, agrupa por fecha y navega entre meses', async () => {
        vehicleReportsService.calendar.mockResolvedValue({
            data: {
                today: '2026-04-06',
                kpis: {
                    soat_alert: 2,
                    rtm_alert: 1,
                    operation_card_alert: 0,
                    polizas_alert: 1,
                    agreement_upcoming: 1,
                    agreement_nearest_name: 'CONVENIO NORTE',
                    up_to_date_docs: 12,
                    total_vehicles: 5,
                },
                category_counts: {
                    ALL: 3,
                    SOAT: 1,
                    RTM: 1,
                    OPERATION_CARD: 0,
                    POLIZAS: 0,
                    AGREEMENT: 1,
                },
                events: [
                    {
                        id: 'veh-1-SOAT',
                        date: '2026-04-06',
                        vehicle_uuid: 'veh-1',
                        vehicle_license_plate: 'TJW731',
                        category: 'SOAT',
                        category_label: 'SOAT',
                        days_remaining: -2,
                        status: 'expired',
                    },
                    {
                        id: 'veh-2-RTM',
                        date: '2026-04-12',
                        vehicle_uuid: 'veh-2',
                        vehicle_license_plate: 'WXY987',
                        category: 'RTM',
                        category_label: 'RTM',
                        days_remaining: 4,
                        status: 'expiring_5d',
                    },
                ],
            },
        });

        const store = useExpirationCalendarStore();
        store.year = 2026;
        store.month = 4;
        await store.fetchCalendar();

        expect(store.events).toHaveLength(2);
        expect(store.kpis.soat_alert).toBe(2);
        expect(store.eventsByDate['2026-04-06']).toHaveLength(1);

        await store.nextMonth();
        expect(store.month).toBe(5);
        expect(vehicleReportsService.calendar).toHaveBeenCalledTimes(2);
    });

    it('ExpirationCalendarToolbar distribuye los botones en el ancho horizontal y emite update:category', async () => {
        const wrapper = mount(ExpirationCalendarToolbar, {
            props: {
                category: 'ALL',
                categoryCounts: {
                    ALL: 10,
                    SOAT: 4,
                    RTM: 3,
                    OPERATION_CARD: 2,
                    POLIZAS: 1,
                    AGREEMENT: 2,
                },
                entityFilter: '',
                serviceType: '',
                branchUuid: '',
                affiliates: [],
                branches: [],
                hasActiveFilter: false,
            },
            global: {
                stubs: {
                    PrimeSelect: true,
                },
            },
        });

        expect(wrapper.findAll('.noa-cat-btn')).toHaveLength(6);
        expect(wrapper.text()).toContain('SOAT');
        expect(wrapper.text()).toContain('4');
        expect(wrapper.text()).toContain('Convenios');

        const soatBtn = wrapper.findAll('.noa-cat-btn')[1];
        await soatBtn.trigger('click');
        expect(wrapper.emitted('update:category')[0]).toEqual(['SOAT']);
    });

    it('ExpirationCalendarGrid renderiza las 42 celdas y emite selectDay y openEvent', async () => {
        const eventos = [
            {
                id: 'ev-1',
                date: '2026-04-10',
                vehicle_uuid: 'veh-1',
                vehicle_license_plate: 'TJW731',
                category: 'SOAT',
                category_label: 'SOAT',
                subtitle: 'Seguro Obligatorio',
                status: 'expired',
                days_remaining: -1,
            },
        ];

        const wrapper = mount(ExpirationCalendarGrid, {
            props: {
                month: 4,
                year: 2026,
                today: '2026-04-06',
                selectedDate: '2026-04-06',
                viewMode: 'month',
                events: eventos,
                eventsByDate: { '2026-04-10': eventos },
                loading: false,
            },
            global: {
                stubs: {
                    'router-link': true,
                },
            },
        });

        expect(wrapper.findAll('.noa-calendar-cell')).toHaveLength(42);
        expect(wrapper.text()).toContain('TJW731 · SOAT Vencido');

        // Verifica la barra de búsqueda estándar de la plataforma en la cabecera
        const searchInput = wrapper.find('#f-calendario-busqueda');
        expect(searchInput.exists()).toBe(true);
        await searchInput.setValue('TJW731');
        expect(wrapper.emitted('update:search')[0]).toEqual(['TJW731']);

        const chip = wrapper.find('.noa-event-chip');
        await chip.trigger('click');
        expect(wrapper.emitted('openEvent')).toBeTruthy();
        expect(wrapper.emitted('openEvent')[0][0].date).toBe('2026-04-10');
    });
});
