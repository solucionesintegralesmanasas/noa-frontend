import { defineStore } from 'pinia';
import { toast } from '@/utils/toast.js';
import vehicleReportsService from '../services/vehicleReports.service.js';

/**
 * Store del Calendario de Vencimientos y Convenios.
 * Gestiona eventos cronológicos, KPIs preventivos y filtros en vivo.
 */
/** Traduce el filtro de entidad ('propios' | 'terceros' | 'aff:<uuid>') a parámetros de la API. */
function parametrosDeEntidad(entityFilter) {
    if (entityFilter === 'propios' || entityFilter === 'terceros') {
        return { ownership_type: entityFilter };
    }
    if (entityFilter && entityFilter.startsWith('aff:')) {
        return { filter_type: 'affiliate', third_party_uuid: entityFilter.slice(4) };
    }
    return {};
}

export const useExpirationCalendarStore = defineStore('expirationCalendar', {
    state: () => {
        const now = new Date();
        return {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            today: now.toISOString().slice(0, 10),
            viewMode: 'month', // 'month' | 'week' | 'agenda'
            selectedDate: now.toISOString().slice(0, 10),
            category: 'ALL', // 'ALL' | 'SOAT' | 'RTM' | 'OPERATION_CARD' | 'POLIZAS' | 'AGREEMENT'
            entityFilter: '', // '' | 'propios' | 'terceros' | 'aff:<uuid>'
            serviceType: '', // '' | 'PUBLICO' | 'PARTICULAR'
            branchUuid: '',
            search: '',
            loading: false,
            exporting: false,
            error: null,
            events: [],
            kpis: {
                soat_alert: 0,
                rtm_alert: 0,
                operation_card_alert: 0,
                polizas_alert: 0,
                agreement_upcoming: 0,
                agreement_nearest_name: null,
                up_to_date_docs: 0,
                total_vehicles: 0,
            },
            categoryCounts: {
                ALL: 0,
                SOAT: 0,
                RTM: 0,
                OPERATION_CARD: 0,
                POLIZAS: 0,
                AGREEMENT: 0,
            },
            catalogs: {
                affiliates: [],
                branches: [],
            },
        };
    },

    getters: {
        hasActiveFilter: (s) =>
            s.category !== 'ALL' ||
            !!s.entityFilter ||
            !!s.serviceType ||
            !!s.branchUuid ||
            !!s.search,

        calendarParams: (s) => {
            const p = {
                month: s.month,
                year: s.year,
                category: s.category !== 'ALL' ? s.category : undefined,
                service_type: s.serviceType || undefined,
                branch_uuid: s.branchUuid || undefined,
                search: s.search || undefined,
                ...parametrosDeEntidad(s.entityFilter),
            };

            return p;
        },

        exportParams: (s) => {
            const p = {
                month: s.month,
                year: s.year,
                service_type: s.serviceType || undefined,
                branch_uuid: s.branchUuid || undefined,
                search: s.search || undefined,
                ...parametrosDeEntidad(s.entityFilter),
            };

            // Mapeo de categoría activa respetando combinaciones de filtros (ej. Afiliado + Categoría)
            if (s.category === 'SOAT' || s.category === 'RTM') {
                p.document_type = s.category;
                if (!p.filter_type) p.filter_type = 'document';
            } else if (s.category === 'POLIZAS') {
                p.document_type = 'TODOS';
                if (!p.filter_type) p.filter_type = 'document';
            } else if (s.category === 'OPERATION_CARD') {
                p.operation_card_status = 'TODOS';
                if (!p.filter_type) p.filter_type = 'operation_card';
            } else if (s.category === 'AGREEMENT') {
                p.agreement_status = 'TODOS';
                if (!p.filter_type) p.filter_type = 'agreement';
            }

            return p;
        },

        eventsByDate: (s) => {
            const map = {};
            for (const ev of s.events) {
                if (!ev?.date) continue;
                if (!map[ev.date]) map[ev.date] = [];
                map[ev.date].push(ev);
            }
            return map;
        },
    },

    actions: {
        async fetchCalendar() {
            this.loading = true;
            this.error = null;
            try {
                const res = await vehicleReportsService.calendar(this.calendarParams);
                const payload = res?.data ?? res ?? {};
                this.events = Array.isArray(payload.events) ? payload.events : [];
                if (payload.today) {
                    this.today = payload.today;
                }
                if (payload.kpis) {
                    this.kpis = { ...this.kpis, ...payload.kpis };
                }
                if (payload.category_counts) {
                    this.categoryCounts = { ...this.categoryCounts, ...payload.category_counts };
                }
            } catch (error) {
                if (error?.__isCanceled) return;
                this.error = error.response?.data?.message || error.message || 'Error al cargar el calendario de vencimientos';
                await toast('Error', this.error, 'error');
            } finally {
                this.loading = false;
            }
        },

        async loadCatalogs() {
            try {
                const [affOpts, branchOpts] = await Promise.all([
                    vehicleReportsService.getFilterOptions('affiliate'),
                    vehicleReportsService.getFilterOptions('branch'),
                ]);
                this.catalogs.affiliates = affOpts.terceros || [];
                this.catalogs.branches = branchOpts.branches || [];
            } catch {
                // Catálogos auxiliares opcionales
            }
        },

        async setMonthYear(month, year) {
            this.month = month;
            this.year = year;
            await this.fetchCalendar();
        },

        async prevMonth() {
            if (this.month === 1) {
                this.month = 12;
                this.year -= 1;
            } else {
                this.month -= 1;
            }
            await this.fetchCalendar();
        },

        async nextMonth() {
            if (this.month === 12) {
                this.month = 1;
                this.year += 1;
            } else {
                this.month += 1;
            }
            await this.fetchCalendar();
        },

        async goToToday() {
            const base = this.today ? new Date(`${this.today}T00:00:00`) : new Date();
            const targetMonth = base.getMonth() + 1;
            const targetYear = base.getFullYear();
            this.selectedDate = this.today || new Date().toISOString().slice(0, 10);
            if (this.month !== targetMonth || this.year !== targetYear) {
                this.month = targetMonth;
                this.year = targetYear;
                await this.fetchCalendar();
            }
        },

        async resetFilters() {
            this.category = 'ALL';
            this.entityFilter = '';
            this.serviceType = '';
            this.branchUuid = '';
            this.search = '';
            await this.fetchCalendar();
        },

        async exportCalendar(format) {
            this.exporting = true;
            try {
                if (format === 'excel') {
                    await vehicleReportsService.downloadExcel(this.exportParams);
                } else {
                    await vehicleReportsService.downloadPdf(this.exportParams);
                }
                await toast('Éxito', `Reporte exportado a ${format.toUpperCase()}.`, 'success');
            } catch (error) {
                await toast('Error', error.message || 'No se pudo exportar el reporte.', 'error');
            } finally {
                this.exporting = false;
            }
        },


    },
});
