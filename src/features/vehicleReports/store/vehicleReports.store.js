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
        pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 },
    }),

    getters: {
        hasActiveFilter: (s) => {
            if (!s.filterType) return false;
            if (s.filterType === 'affiliate' || s.filterType === 'driver' || s.filterType === 'project' || s.filterType === 'agreement') {
                return !!s.filterValue;
            }
            if (s.filterType === 'document') return !!s.documentType || !!s.filterValue || !!s.docStatus;
            if (s.filterType === 'operation_card') return !!s.filterValue || !!s.operationCardStatus;
            if (s.filterType === 'maintenance') return !!s.maintenanceStatus || !!s.filterValue;
            return false;
        },
        currentParams: (s) => {
            const p = {
                search: s.search || undefined,
                page: s.pagination.currentPage,
                per_page: s.pagination.itemsPerPage,
            };
            let active = false;

            if (s.filterType === 'affiliate' || s.filterType === 'driver') {
                if (s.filterValue) {
                    p.third_party_uuid = s.filterValue;
                    active = true;
                }
            } else if (s.filterType === 'project') {
                if (s.filterValue) {
                    p.project_uuid = s.filterValue;
                    active = true;
                }
            } else if (s.filterType === 'document') {
                const doc = s.documentType || s.filterValue;
                if (doc) {
                    p.document_type = doc;
                    active = true;
                }
                if (s.docStatus) {
                    p.doc_status = s.docStatus;
                    active = true;
                }
            } else if (s.filterType === 'operation_card') {
                if (s.filterValue) {
                    p.affiliated_company = s.filterValue;
                    active = true;
                }
                if (s.operationCardStatus) {
                    p.operation_card_status = s.operationCardStatus;
                    active = true;
                }
            } else if (s.filterType === 'agreement') {
                if (s.filterValue) {
                    p.contracting_entity_name = s.filterValue;
                    active = true;
                }
            } else if (s.filterType === 'maintenance') {
                const mtto = s.maintenanceStatus || s.filterValue;
                if (mtto) {
                    p.maintenance_status = mtto;
                    active = true;
                }
            }

            if (active && s.filterType) {
                p.filter_type = s.filterType;
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
            this.documentType = '';
            this.docStatus = '';
            this.operationCardStatus = '';
            this.maintenanceStatus = '';
            this.search = '';
            this.pagination.currentPage = 1;
            await this.fetchItems();
        },

        async exportReport(formato) {
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
