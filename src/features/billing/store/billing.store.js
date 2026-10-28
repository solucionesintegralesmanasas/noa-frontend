import { defineStore } from 'pinia';
import { toast } from '@/utils/toast.js';
import billingService, {
    billingResolutionsService,
    billingProvidersService,
    billingProviderConfigService,
    electronicDocumentsService,
} from '../services/billing.service.js';

/** Catálogo de tipos documentales del módulo genérico ApiDian. */
export const TIPOS_DOCUMENTO_API = [
    { valor: 'support-document', etiqueta: 'Documento soporte' },
    { valor: 'support-adjustment-note', etiqueta: 'Nota de ajuste del documento soporte' },
    { valor: 'equivalent-document', etiqueta: 'Documento equivalente (POS / tiquete)' },
    { valor: 'equivalent-adjustment-note', etiqueta: 'Nota de ajuste del equivalente' },
    { valor: 'payroll', etiqueta: 'Nómina electrónica (102)' },
    { valor: 'payroll-adjust-note', etiqueta: 'Nota de ajuste de nómina' },
    { valor: 'event', etiqueta: 'Evento RADIAN (030–051)' },
    { valor: 'batch', etiqueta: 'Lote (batch)' },
    { valor: 'send-zip', etiqueta: 'Envío de ZIP' },
];

/** Mapa único de estado → estilo de pastilla (verde/azul/gris/rojo). */
export const ESTILOS_ESTADO_DOC = {
    ACEPTADA_DIAN: 'bg-success',
    VALIDADA_SIN_ENVIO: 'bg-primary',
    PENDIENTE_DIAN: 'bg-secondary',
    RECHAZADA_DIAN: 'bg-danger',
};

/**
 * Store Pinia del módulo de facturación comercial.
 * Cotizaciones (fase 1) y facturas internas sin FE (fase 2),
 * más proveedores tecnológicos y documentos electrónicos ApiDian.
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
        // Proveedores tecnológicos (ApiDian u otro driver).
        providers: [],
        providerEnEdicion: null,
        // Configuraciones básicas (módulo 01) del proveedor ApiDian.
        providerConfig: null,
        configLoading: false,
        // Documentos electrónicos genéricos.
        electronicDocs: [],
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
                // El backend explica el motivo real (p. ej. login fallido o
                // rango inválido); axios solo trae "Request failed...".
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

        // ── Proveedores tecnológicos (ApiDian) ─────────────────────────────

        async fetchProviders() {
            return this._run(async () => {
                const response = await billingProvidersService.list();
                const body = response?.data ?? response;
                this.providers = body?.data ?? body ?? [];
            }, 'Error al cargar los proveedores tecnológicos');
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
                this.providerEnEdicion = null;
                await this.fetchProviders();
            }, 'Error al actualizar el proveedor tecnológico');
        },

        async eliminarProveedor(uuid) {
            return this._run(async () => {
                await billingProvidersService.delete(uuid);
                await toast('¡Eliminado!', 'El proveedor tecnológico fue eliminado', 'success');
                if (this.providerEnEdicion === uuid) this.providerEnEdicion = null;
                await this.fetchProviders();
            }, 'Error al eliminar el proveedor tecnológico');
        },

        // ── Configuraciones básicas ApiDian (módulo 01) ───────────────────

        async fetchProviderConfig(uuid) {
            this.configLoading = true;
            try {
                const response = await billingProviderConfigService.consultar(uuid);
                const cuerpo = response?.data ?? response;
                // ApiDian responde {success, data}; se expone el objeto interno.
                this.providerConfig = cuerpo?.data ?? cuerpo ?? null;
                return this.providerConfig;
            } catch (error) {
                this.providerConfig = null;
                throw error;
            } finally {
                this.configLoading = false;
            }
        },

        /**
         * Guarda un paso de la configuración básica.
         * @param {'empresa'|'software'|'software-nomina'|'certificado'|'resolucion'|'ambiente'|'webhook'} paso
         */
        async guardarConfiguracion(uuid, paso, datos = {}) {
            const acciones = {
                empresa: [billingProviderConfigService.guardarEmpresa, 'Empresa guardada en ApiDian'],
                software: [billingProviderConfigService.software, 'Software guardado en ApiDian'],
                'software-nomina': [billingProviderConfigService.softwareNomina, 'Software de nómina guardado en ApiDian'],
                certificado: [billingProviderConfigService.certificado, 'Certificado cargado en ApiDian'],
                resolucion: [billingProviderConfigService.resolucion, 'Resolución guardada en ApiDian'],
                ambiente: [billingProviderConfigService.ambiente, 'Ambiente actualizado en ApiDian'],
                webhook: [billingProviderConfigService.webhook, 'Webhook guardado en ApiDian'],
            };

            const [accion, mensaje] = acciones[paso] ?? [];
            if (!accion) throw new Error(`Paso de configuración desconocido: ${paso}`);

            return this._run(async () => {
                const response = await accion.call(billingProviderConfigService, uuid, datos);
                await toast('¡Éxito!', mensaje, 'success');
                return response?.data?.data ?? response?.data ?? response;
            }, 'ApiDian rechazó la configuración');
        },

        async eliminarConfigEmpresa(uuid) {
            return this._run(async () => {
                await billingProviderConfigService.eliminarEmpresa(uuid);
                this.providerConfig = null;
                await toast('¡Eliminada!', 'La empresa se eliminó de ApiDian', 'success');
            }, 'No se pudo eliminar la empresa en ApiDian');
        },

        // ── Documentos electrónicos genéricos (ApiDian, fase 3) ───────────

        async fetchElectronicDocs() {
            return this._run(async () => {
                const response = await electronicDocumentsService.list();
                const body = response?.data ?? response;
                this.electronicDocs = body?.data ?? body ?? [];
            }, 'Error al cargar los documentos electrónicos');
        },

        async inscribirDocumentoElectronico(data) {
            return this._run(async () => {
                const response = await electronicDocumentsService.create(data);
                await toast('¡Éxito!', 'Documento electrónico registrado; pendiente de emitir', 'success');
                await this.fetchElectronicDocs();
                return response?.data?.data ?? response;
            }, 'Error al registrar el documento electrónico');
        },

        async actualizarDocumentoElectronico(uuid, data) {
            return this._run(async () => {
                await electronicDocumentsService.update(uuid, data);
                await toast('¡Éxito!', 'Documento electrónico actualizado', 'success');
                await this.fetchElectronicDocs();
            }, 'Error al actualizar el documento electrónico');
        },

        async emitirDocumentoElectronico(uuid) {
            return this._run(async () => {
                const response = await electronicDocumentsService.emitir(uuid);
                const doc = response?.data?.data ?? response?.data ?? response;
                const estado = doc?.electronic_status === 'ACEPTADA_DIAN'
                    ? 'El documento fue aceptado por la DIAN'
                    : 'El documento fue procesado sin transmisión a la DIAN';
                await toast('¡Éxito!', estado, doc?.electronic_status === 'RECHAZADA_DIAN' ? 'warning' : 'success');
                await this.fetchElectronicDocs();
                return doc;
            }, 'Error al emitir el documento electrónico');
        },

        async estadoDocumentoElectronico(uuid) {
            return this._run(async () => {
                const response = await electronicDocumentsService.estado(uuid);
                return response?.data?.data ?? response?.data ?? response;
            }, 'Error al consultar el estado del documento electrónico');
        },

        async eliminarDocumentoElectronico(uuid) {
            return this._run(async () => {
                await electronicDocumentsService.delete(uuid);
                await toast('¡Eliminado!', 'El documento electrónico fue eliminado', 'success');
                await this.fetchElectronicDocs();
            }, 'Error al eliminar el documento electrónico');
        },
    },
});
