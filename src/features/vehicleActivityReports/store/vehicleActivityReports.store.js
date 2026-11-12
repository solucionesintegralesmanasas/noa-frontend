import { defineStore } from 'pinia';
import { toast } from '@/utils/toast.js';
import vehicleActivityReportsService from '../services/vehicleActivityReports.service.js';

/**
 * Store del reporte de actividad vehicular: rango de fechas obligatorio,
 * filtros opcionales de vehículo/proyecto, paginación server-side y catálogos.
 */
export const useVehicleActivityReportsStore = defineStore('vehicleActivityReports', {
    state: () => ({
        fechaDesde: '',
        fechaHasta: '',
        vehicleUuid: '',
        projectUuid: '',
        items: [],
        loading: false,
        exporting: false,
        error: null,
        catalogs: { vehiculos: [], proyectos: [] },
        pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 },
    }),

    getters: {
        /**
         * Parámetros de consulta: fechas siempre (el backend las exige),
         * uuids solo cuando tienen valor.
         */
        currentParams: (s) => ({
            fecha_desde: s.fechaDesde,
            fecha_hasta: s.fechaHasta,
            vehicle_uuid: s.vehicleUuid || undefined,
            project_uuid: s.projectUuid || undefined,
            page: s.pagination.currentPage,
            per_page: s.pagination.itemsPerPage,
        }),
    },

    actions: {
        async _run(action, errorMsg) {
            this.loading = true;
            this.error = null;
            try { return await action(); }
            catch (error) {
                if (error.__isCanceled) return;
                this.error = error.response?.data?.message || error.message || errorMsg;
                await toast('Error', this.error, 'error');
                throw error;
            } finally { this.loading = false; }
        },

        async fetchItems() {
            // Sin rango de fechas no hay consulta: el backend responde 422.
            if (!this.fechaDesde || !this.fechaHasta) return;
            return this._run(async () => {
                const response = await vehicleActivityReportsService.report(this.currentParams);
                const p = response?.data ?? response;
                this.items = p.data ?? [];
                this.pagination.currentPage = p.current_page ?? 1;
                this.pagination.totalItems = p.total ?? 0;
                this.pagination.totalPages = p.last_page ?? 1;
                this.pagination.itemsPerPage = p.per_page ?? this.pagination.itemsPerPage;
            }, 'Error al cargar el reporte de actividad vehicular');
        },

        async setPage(page) {
            this.pagination.currentPage = page;
            await this.fetchItems();
        },

        /**
         * Aplica filtros (claves snake_case, como en la URL) y vuelve a la
         * primera página antes de consultar.
         */
        async setFiltros(filtros = {}) {
            if ('fecha_desde' in filtros) this.fechaDesde = filtros.fecha_desde ?? '';
            if ('fecha_hasta' in filtros) this.fechaHasta = filtros.fecha_hasta ?? '';
            if ('vehicle_uuid' in filtros) this.vehicleUuid = filtros.vehicle_uuid ?? '';
            if ('project_uuid' in filtros) this.projectUuid = filtros.project_uuid ?? '';
            this.pagination.currentPage = 1;
            await this.fetchItems();
        },

        async clearFilters() {
            this.fechaDesde = '';
            this.fechaHasta = '';
            this.vehicleUuid = '';
            this.projectUuid = '';
            this.pagination.currentPage = 1;
            this.items = [];
            // Sin fechas no se consulta (regla del backend); la vista muestra el aviso.
        },

        async loadCatalogos() {
            try {
                const opts = await vehicleActivityReportsService.getCatalogos();
                this.catalogs.vehiculos = opts.vehiculos ?? [];
                this.catalogs.proyectos = opts.proyectos ?? [];
            } catch {
                await toast('Advertencia', 'No se pudieron cargar los catálogos del reporte', 'warning');
            }
        },

        async exportReport(formato) {
            this.exporting = true;
            try {
                if (formato === 'excel') await vehicleActivityReportsService.downloadExcel(this.currentParams);
                else await vehicleActivityReportsService.downloadPdf(this.currentParams);
                await toast('Éxito', `Reporte exportado a ${formato.toUpperCase()}.`, 'success');
            } catch (error) {
                await toast('Error', error.message || 'No se pudo exportar el reporte.', 'error');
            } finally { this.exporting = false; }
        },
    },
});
