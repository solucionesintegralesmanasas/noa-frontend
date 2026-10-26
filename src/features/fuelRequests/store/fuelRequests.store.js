import { defineStore } from 'pinia';
import { toast } from '@/utils/toast.js';
import fuelRequestsService from '../services/fuelRequests.service.js';

export const useFuelRequestsStore = defineStore('fuelRequests', {
    state: () => ({
        items: [],
        selected: null,
        qr: null,
        loading: false,
        error: null,
        pagination: { currentPage: 1, itemsPerPage: 15, totalItems: 0, totalPages: 0 },
        filters: { status: '', search: '' },
        sortField: null,
        sortOrder: null,
    }),

    actions: {
        async fetchItems() {
            this.loading = true;
            this.error = null;
            try {
                const response = await fuelRequestsService.list({
                    page: this.pagination.currentPage,
                    per_page: this.pagination.itemsPerPage,
                    status: this.filters.status || undefined,
                    search: this.filters.search || undefined,
                    sort_by: this.sortField || undefined,
                    sort_order: this.sortOrder === 1 ? 'asc' : this.sortOrder === -1 ? 'desc' : undefined,
                });
                const p = response?.data ?? response;
                this.items = p.data ?? [];
                this.pagination.currentPage = p.current_page ?? 1;
                this.pagination.totalItems = p.total ?? 0;
                this.pagination.totalPages = p.last_page ?? 1;
                this.pagination.itemsPerPage = p.per_page ?? this.pagination.itemsPerPage;
            } catch (error) {
                this.error = error?.response?.data?.message || 'No se pudieron cargar las solicitudes.';
                await toast('Error', this.error, 'error');
            } finally {
                this.loading = false;
            }
        },

        async createItem(data) {
            this.loading = true;
            try {
                const response = await fuelRequestsService.create(data);
                const item = response?.data?.data ?? response?.data ?? response;
                await toast('Solicitud creada', 'Queda pendiente de aprobación por la empresa.', 'success');
                await this.fetchItems();
                return item;
            } catch (error) {
                await toast('Error', error?.response?.data?.message || 'No se pudo crear la solicitud.', 'error');
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async approveItem(uuid) {
            try {
                await fuelRequestsService.approve(uuid);
                await toast('Solicitud aprobada', 'El conductor ya puede mostrar el QR.', 'success');
                await this.fetchItems();
            } catch (error) {
                await toast('Error', error?.response?.data?.message || 'No se pudo aprobar.', 'error');
            }
        },

        async rejectItem(uuid, reason) {
            try {
                await fuelRequestsService.reject(uuid, { reason });
                await toast('Solicitud rechazada', 'Se notificó el motivo al conductor.', 'success');
                await this.fetchItems();
            } catch (error) {
                await toast('Error', error?.response?.data?.message || 'No se pudo rechazar.', 'error');
            }
        },

        async cancelItem(uuid) {
            try {
                await fuelRequestsService.cancel(uuid);
                await toast('Solicitud anulada', 'La solicitud ya no es válida.', 'success');
                await this.fetchItems();
            } catch (error) {
                await toast('Error', error?.response?.data?.message || 'No se pudo anular.', 'error');
            }
        },

        async loadQr(uuid) {
            const response = await fuelRequestsService.qr(uuid);
            // La API responde { success, message, data: { data, url, qr_data, qr_url } }.
            // El contenido del QR también trae una clave `data` (el texto), así que
            // `response.data.data` devolvía ese texto y el modal se quedaba sin imágenes.
            const payload = response?.data ?? response;
            this.qr = payload?.qr_url || payload?.qr_data ? payload : null;
            return this.qr;
        },

        setPage(page) {
            this.pagination.currentPage = page;
            return this.fetchItems();
        },

        setSort(field, order) {
            this.sortField = field;
            this.sortOrder = order;
            this.pagination.currentPage = 1;
            return this.fetchItems();
        },
    },
});
