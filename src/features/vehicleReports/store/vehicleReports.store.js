import { defineStore } from 'pinia';
import { toast } from '@/utils/toast.js';
import vehicleReportsService from '../services/vehicleReports.service.js';

/**
 * Store del reporte de vehículos: un filtro activo a la vez,
 * paginación server-side y catálogos bajo demanda.
 */
export const useVehicleReportsStore = defineStore('vehicleReports', {
    state: () => ({
        items: [],
        loading: false,
        exporting: false,
        error: null,
        filterType: '',
        filterValue: '',
        documentType: '',
        docStatus: '',
        operationCardStatus: '',
        maintenanceStatus: '',
        search: '',
        catalogs: { terceros: [], proyectos: [], affiliatedCompanies: [], agreements: [] },
        pagination: { currentPage: 1, itemsPerPage: 15, totalItems: 0, totalPages: 0 },
    }),

    getters: {
        hasActiveFilter: (s) => !!s.filterType && !!s.filterValue,
        currentParams: (s) => {
            const p = {
                filter_type: s.filterType || undefined,
                search: s.search || undefined,
                page: s.pagination.currentPage,
                per_page: s.pagination.itemsPerPage,
            };
            if (s.filterType === 'affiliate' || s.filterType === 'driver') p.third_party_uuid = s.filterValue || undefined;
            if (s.filterType === 'project') p.project_uuid = s.filterValue || undefined;
            if (s.filterType === 'document') {
                p.document_type = s.documentType || undefined;
                p.doc_status = s.docStatus || undefined;
                // document usa filterValue como comodín si no hay subtipo
                if (!p.document_type && s.filterValue) p.document_type = s.filterValue;
            }
            if (s.filterType === 'operation_card') {
                p.affiliated_company = s.filterValue || undefined;
                p.operation_card_status = s.operationCardStatus || undefined;
            }
            if (s.filterType === 'agreement') {
                p.contracting_entity_name = s.filterValue || undefined;
            }
            if (s.filterType === 'maintenance') {
                p.maintenance_status = s.maintenanceStatus || undefined;
                if (!p.maintenance_status && s.filterValue) p.maintenance_status = s.filterValue;
            }
            return p;
        },
    },

    actions: {
        async _run(action, errorMsg) {
            this.loading = true;
            this.error = null;
            try { return await action(); }
            catch (error) {
                this.error = error.response?.data?.message || error.message || errorMsg;
                await toast('Error', this.error, 'error');
                throw error;
            } finally { this.loading = false; }
        },

        async fetchItems() {
            if (!this.filterType) {
                this.items = [];
                this.pagination.totalItems = 0;
                this.pagination.totalPages = 0;
                return;
            }
            return this._run(async () => {
                const response = await vehicleReportsService.report(this.currentParams);
                const p = response?.data ?? response;
                this.items = p.data ?? [];
                this.pagination.currentPage = p.current_page ?? 1;
                this.pagination.totalItems = p.total ?? 0;
                this.pagination.totalPages = p.last_page ?? 1;
                this.pagination.itemsPerPage = p.per_page ?? this.pagination.itemsPerPage;
            }, 'Error al cargar el reporte');
        },

        async setFilterType(type) {
            this.filterType = type;
            this.filterValue = '';
            this.documentType = '';
            this.docStatus = '';
            this.operationCardStatus = '';
            this.maintenanceStatus = '';
            this.pagination.currentPage = 1;
            if (type === 'affiliate' || type === 'driver' || type === 'project' || type === 'operation_card' || type === 'agreement') {
                await this.loadFilterCatalogs(type);
            }
        },

        async loadFilterCatalogs(type) {
            try {
                const opts = await vehicleReportsService.getFilterOptions(type);
                if (opts.terceros) this.catalogs.terceros = opts.terceros;
                if (opts.proyectos) this.catalogs.proyectos = opts.proyectos;
                if (opts.affiliatedCompanies) this.catalogs.affiliatedCompanies = opts.affiliatedCompanies;
                if (opts.agreements) this.catalogs.agreements = opts.agreements;
            } catch {
                await toast('Advertencia', 'No se pudieron cargar las opciones del filtro', 'warning');
            }
        },

        async setPage(page) {
            this.pagination.currentPage = page;
            await this.fetchItems();
        },

        async setGlobalFilter(value) {
            this.search = value;
            this.pagination.currentPage = 1;
            await this.fetchItems();
        },

        async clearFilters() {
            this.filterType = '';
            this.filterValue = '';
            this.search = '';
            this.pagination.currentPage = 1;
            this.items = [];
            this.pagination.totalItems = 0;
        },

        async exportReport(formato) {
            if (!this.filterType) {
                await toast('Atención', 'Seleccione primero un filtro para exportar.', 'warning');
                return;
            }
            this.exporting = true;
            try {
                if (formato === 'excel') await vehicleReportsService.downloadExcel(this.currentParams);
                else await vehicleReportsService.downloadPdf(this.currentParams);
                await toast('Éxito', `Reporte exportado a ${formato.toUpperCase()}.`, 'success');
            } catch (error) {
                await toast('Error', error.message || 'No se pudo exportar el reporte.', 'error');
            } finally { this.exporting = false; }
        },
    },
});
