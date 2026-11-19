import { defineStore } from 'pinia';
import { toast } from '@/utils/toast.js';
import rentalContractsService from '../services/rentalContracts.service.js';

export const useRentalContractsStore = defineStore('rentalContracts', {
    state: () => ({
        items: [],
        selectedItem: null,
        loading: false,
        error: null,
        catalogs: {},
        pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 },
        search: '',
        sortField: null,
        sortOrder: null,
    }),

    actions: {
        async _run(action, errorMsg) {
            this.loading = true;
            this.error = null;
            try { return await action(); }
            catch (error) {
                this.error = error.message || errorMsg;
                await toast('Error', this.error, 'error');
                throw error;
            } finally { this.loading = false; }
        },

        async fetchItems() {
            return this._run(async () => {
                const response = await rentalContractsService.list({
                    page: this.pagination.currentPage,
                    per_page: this.pagination.itemsPerPage,
                    search: this.search || undefined,
                    sort_by: this.sortField || undefined,
                    sort_order: (this.sortOrder === 1 || this.sortOrder === 'asc') ? 'asc' : (this.sortOrder === -1 || this.sortOrder === 'desc') ? 'desc' : undefined,
                });
                const p = response?.data ?? response;
                this.items = p.data ?? [];
                this.pagination.currentPage = p.current_page ?? 1;
                this.pagination.totalItems = p.total ?? 0;
                this.pagination.totalPages = p.last_page ?? 1;
                this.pagination.itemsPerPage = p.per_page ?? this.pagination.itemsPerPage;
            }, 'Error al cargar los contratos');
        },

        async fetchProfileById(uuid) {
            return this._run(async () => {
                const response = await rentalContractsService.get(uuid);
                this.selectedItem = response?.data?.data ?? response?.data ?? response;
                return this.selectedItem;
            }, 'Error al cargar el contrato');
        },

        setPage(page) { this.pagination.currentPage = page; return this.fetchItems(); },

        setSort(field, order) {
            this.sortField = field;
            this.sortOrder = order;
            this.pagination.currentPage = 1;
            return this.fetchItems();
        },

        setGlobalFilter(query) { this.search = query; this.pagination.currentPage = 1; return this.fetchItems(); },

        clearFilters() { this.search = ''; this.pagination.currentPage = 1; return this.fetchItems(); },

        async loadCatalogs() {
            try {
                this.catalogs = await rentalContractsService.getFormOptions();
                return this.catalogs;
            } catch (error) {
                await toast('Advertencia', 'No se pudieron cargar algunas opciones', 'warning');
                throw error;
            }
        },

        async createItem(data) {
            return this._run(async () => {
                const res = await rentalContractsService.create(data);
                await toast('Éxito', 'Contrato de alquiler creado correctamente', 'success');
                return res;
            }, 'Error al crear el contrato');
        },

        async updateInstallment(uuid, data) {
            return this._run(async () => {
                const res = await rentalContractsService.updateInstallment(uuid, data);
                await toast('Éxito', 'Cuota actualizada correctamente', 'success');
                return res;
            }, 'Error al actualizar la cuota');
        },

        async downloadPdf(uuid) {
            return this._run(async () => {
                await rentalContractsService.downloadPdf(uuid);
                await toast('Éxito', 'PDF descargado correctamente', 'success');
            }, 'Error al descargar el PDF');
        },

        async createDiscount(contractUuid, data) {
            return this._run(async () => {
                const res = await rentalContractsService.createDiscount(contractUuid, data);
                await toast('Éxito', 'Descuento registrado y aplicado a la cuota vigente', 'success');
                return res;
            }, 'Error al registrar el descuento');
        },

        async deleteDiscount(discountUuid) {
            return this._run(async () => {
                const res = await rentalContractsService.deleteDiscount(discountUuid);
                await toast('Éxito', 'Descuento eliminado correctamente', 'success');
                return res;
            }, 'Error al eliminar el descuento');
        }
    }
});
