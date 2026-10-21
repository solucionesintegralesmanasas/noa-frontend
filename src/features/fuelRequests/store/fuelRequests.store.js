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
            this.qr = response?.data?.data ?? response?.data ?? response;
            return this.qr;
        },

        setPage(page) {
            this.pagination.currentPage = page;
            return this.fetchItems();
        },
    },
});
