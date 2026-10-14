import { defineStore } from 'pinia';
import { toast } from '@/utils/toast.js';
import billingService from '../services/billing.service.js';

/**
 * Store Pinia del módulo de facturación comercial.
 * Cotizaciones (fase 1) y facturas internas sin FE (fase 2).
 */
export const useBillingStore = defineStore('billing', {
    state: () => ({
        items: [],
        selectedItem: null,
        loading: false,
        error: null,
        tipoFiltro: 'COTIZACION',
        catalogs: { clientes: [], resoluciones: [], metodosPago: [], companies: [] },
        pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 },
        search: '',
    }),

    getters: {
        esCotizacion: (state) => state.tipoFiltro === 'COTIZACION',
    },

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
                const response = await billingService.list({
                    page: this.pagination.currentPage,
                    per_page: this.pagination.itemsPerPage,
                    search: this.search || undefined,
                    invoice_type: this.tipoFiltro,
                });
                // Forma real de `_request`: { success, message, data: <paginador> }.
                const p = response?.data ?? response;
                this.items = p.data ?? [];
                this.pagination.currentPage = p.current_page ?? 1;
                this.pagination.totalItems = p.total ?? 0;
                this.pagination.totalPages = p.last_page ?? 1;
                this.pagination.itemsPerPage = p.per_page ?? this.pagination.itemsPerPage;
            }, 'Error al cargar los documentos');
        },

        async loadCatalogs() {
            try {
                this.catalogs = await billingService.getFormOptions();
                return this.catalogs;
            } catch (error) {
                await toast('Advertencia', 'No se pudieron cargar todas las opciones del formulario', 'warning');
                throw error;
            }
        },

        async _afterCreate(response, mensaje) {
            const item = response?.data?.data ?? response?.data ?? response;
            await toast('¡Éxito!', mensaje, 'success');
            this.pagination.currentPage = 1;
            try { await this.fetchItems(); } catch (_e) { /* silencioso */ }
            return item;
        },

        crearCotizacion(data) {
            return this._run(
                () => billingService.crearCotizacion(data).then((r) => this._afterCreate(r, 'Cotización creada correctamente')),
                'Error al crear la cotización'
            );
        },

        crearFactura(data) {
            return this._run(
                () => billingService.crearFactura(data).then((r) => this._afterCreate(r, 'Factura interna creada correctamente')),
                'Error al crear la factura'
            );
        },

        actualizar(uuid, data) {
            return this._run(async () => {
                const response = await billingService.update(uuid, data);
                const updated = response?.data?.data ?? response?.data ?? response;
                await toast('¡Éxito!', 'Documento actualizado correctamente', 'success');
                return updated;
            }, 'Error al actualizar el documento');
        },

        cambiarEstado(uuid, status) {
            return this._run(async () => {
                const response = await billingService.cambiarEstado(uuid, status);
                return response?.data?.data ?? response?.data ?? response;
            }, 'Error al cambiar el estado');
        },

        convertir(uuid, data) {
            return this._run(async () => {
                const response = await billingService.convertir(uuid, data);
                const item = response?.data?.data ?? response?.data ?? response;
                await toast('¡Éxito!', 'Cotización convertida en factura', 'success');
                return item;
            }, 'Error al convertir la cotización');
        },

        registrarPago(uuid, data) {
            return this._run(async () => {
                const response = await billingService.registrarPago(uuid, data);
                const item = response?.data?.data ?? response?.data ?? response;
                await toast('¡Éxito!', 'Pago registrado correctamente', 'success');
                return item;
            }, 'Error al registrar el pago');
        },

        anular(uuid) {
            return this._run(async () => {
                const response = await billingService.anular(uuid);
                await toast('¡Éxito!', 'Documento anulado correctamente', 'success');
                return response?.data?.data ?? response?.data ?? response;
            }, 'Error al anular el documento');
        },

        async deleteItem(uuid) {
            return this._run(async () => {
                await billingService.delete(uuid);
                await toast('¡Eliminado!', 'El documento ha sido eliminado correctamente', 'success');
                if (this.items.length === 1 && this.pagination.currentPage > 1) {
                    this.pagination.currentPage -= 1;
                }
                await this.fetchItems();
            }, 'Error al eliminar el documento');
        },

        fetchProfileById(uuid) {
            return this._run(async () => {
                const r = await billingService.get(uuid);
                this.selectedItem = r?.data?.data ?? r?.data ?? r;
                return this.selectedItem;
            }, 'Error al cargar el documento');
        },

        descargarPdf(uuid, numero) {
            return this._run(
                () => billingService.descargarPdf(uuid, numero),
                'Error al descargar el PDF'
            );
        },

        setTipo(tipo) { this.tipoFiltro = tipo; this.pagination.currentPage = 1; return this.fetchItems(); },
        setPage(page) { this.pagination.currentPage = page; return this.fetchItems(); },
        setGlobalFilter(query) { this.search = query; this.pagination.currentPage = 1; return this.fetchItems(); },
        clearFilters() { this.search = ''; this.pagination.currentPage = 1; return this.fetchItems(); },
    },
});
