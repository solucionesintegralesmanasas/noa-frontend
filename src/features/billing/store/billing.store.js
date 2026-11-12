import { defineStore } from 'pinia';
import { toast } from '@/utils/toast.js';
import billingService, {
    billingResolutionsService,
    billingProvidersService,
} from '../services/billing.service.js';

/**
 * Store Pinia del módulo de facturación comercial.
 * Cotizaciones y facturas internas, más proveedores tecnológicos Factus.
 */
export const useBillingStore = defineStore('billing', {
    state: () => ({
        items: [],
        selectedItem: null,
        loading: false,
        error: null,
        tipoFiltro: 'COTIZACION',
        catalogs: { clientes: [], resoluciones: [], metodosPago: [], companies: [] },
        resolutions: [],
        // Proveedores tecnológicos (driver único: Factus).
        providers: [],
        provider: null,
        pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 },
        search: '',
        sortField: null,
        sortOrder: null,
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
                // El backend explica el motivo real (p. ej. login fallido);
                // axios solo trae "Request failed...".
                this.error = error?.response?.data?.message || error.message || errorMsg;
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
                    sort_by: this.sortField || undefined,
                    sort_order: (this.sortOrder === 1 || this.sortOrder === 'asc') ? 'asc' : (this.sortOrder === -1 || this.sortOrder === 'desc') ? 'desc' : undefined,
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

        async fetchResolutions() {
            return this._run(async () => {
                const response = await billingResolutionsService.list();
                const body = response?.data ?? response;
                this.resolutions = body?.data ?? body ?? [];
            }, 'Error al cargar las resoluciones');
        },

        async createResolution(data) {
            return this._run(async () => {
                const response = await billingResolutionsService.create(data);
                const item = response?.data?.data ?? response?.data ?? response;
                await toast('¡Éxito!', 'Resolución registrada correctamente', 'success');
                try { await this.fetchResolutions(); } catch (_e) { /* silencioso */ }
                return item;
            }, 'Error al registrar la resolución');
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

        emitir(uuid) {
            return this._run(async () => {
                const response = await billingService.emitir(uuid);
                const item = response?.data?.data ?? response?.data ?? response;
                await toast('¡Éxito!', 'Factura enviada a la DIAN', 'success');
                return item;
            }, 'Error al enviar la factura a la DIAN');
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
        setSort(field, order) {
            this.sortField = field;
            this.sortOrder = order;
            this.pagination.currentPage = 1;
            return this.fetchItems();
        },
        setGlobalFilter(query) { this.search = query; this.pagination.currentPage = 1; return this.fetchItems(); },
        clearFilters() { this.search = ''; this.pagination.currentPage = 1; return this.fetchItems(); },

        // ── Proveedores tecnológicos (Factus) ────────────────────────────────

        async fetchProviders() {
            return this._run(async () => {
                const response = await billingProvidersService.list();
                const body = response?.data ?? response;
                this.providers = body?.data ?? body ?? [];
            }, 'Error al cargar los proveedores tecnológicos');
        },

        async fetchProviderById(uuid) {
            return this._run(async () => {
                const response = await billingProvidersService.get(uuid);
                this.provider = response?.data?.data ?? response?.data ?? response;
                return this.provider;
            }, 'Error al cargar el proveedor tecnológico');
        },

        async crearProveedor(data) {
            return this._run(async () => {
                await billingProvidersService.create(data);
                await toast('¡Éxito!', 'Proveedor tecnológico registrado correctamente', 'success');
                await this.fetchProviders();
            }, 'Error al registrar el proveedor tecnológico');
        },

        async actualizarProveedor(uuid, data) {
            return this._run(async () => {
                await billingProvidersService.update(uuid, data);
                await toast('¡Éxito!', 'Proveedor tecnológico actualizado correctamente', 'success');
                await this.fetchProviders();
            }, 'Error al actualizar el proveedor tecnológico');
        },

        async eliminarProveedor(uuid) {
            return this._run(async () => {
                await billingProvidersService.delete(uuid);
                await toast('¡Eliminado!', 'El proveedor tecnológico fue eliminado', 'success');
                await this.fetchProviders();
            }, 'Error al eliminar el proveedor tecnológico');
        },
    },
});
