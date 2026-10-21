import { BaseService } from '@services/api/base.service.js';
import { logger } from '@utils/logger.js';

/**
 * Servicios API del módulo de facturación comercial.
 * Cotizaciones (fase 1) y facturas internas sin FE (fase 2).
 */
class BillingApiService extends BaseService {
    constructor(resourcePath, module = 'billing') {
        super({ resourcePath, metadata: { module, service: 'billing' } });
    }

    list(params = {}) { return this._request('GET', '', { params }); }
    get(uuid) { return this._request('GET', `/${uuid}`); }
    create(data) { return this._request('POST', '', { data }); }
    update(uuid, data) { return this._request('PUT', `/${uuid}`, { data }); }
    delete(uuid) { return this._request('DELETE', `/${uuid}`); }
}

class CommercialInvoicesService extends BillingApiService {
    constructor() { super('/billing/commercial-invoices'); }

    crearCotizacion(data) { return this._request('POST', '/quotations', { data }); }
    crearFactura(data) { return this._request('POST', '/invoices', { data }); }
    cambiarEstado(uuid, status) { return this._request('PATCH', `/${uuid}/estado`, { data: { status } }); }
    convertir(uuid, data) { return this._request('POST', `/${uuid}/convertir`, { data }); }
    registrarPago(uuid, data) { return this._request('POST', `/${uuid}/pagos`, { data }); }
    anular(uuid) { return this._request('POST', `/${uuid}/anular`); }

    descargarPdf(uuid, numero) {
        return this._downloadPdf(`/${uuid}/pdf`, `Documento_${numero || uuid}.pdf`);
    }

    async getFormOptions() {
        const { companyUuid } = this._getUserContext();
        const company = companyUuid ? `?company_uuid=${companyUuid}` : '';
        const fetchSafe = async (url) => {
            try {
                const res = await this._getInstance().get(url);
                const body = res.data?.data ?? res.data ?? [];
                return Array.isArray(body) ? body : (body.data ?? []);
            } catch (err) {
                // Un catálogo que falla no debe tumbar el formulario, pero sí deja huella para diagnosticar.
                logger.warn(`Opciones del formulario no disponibles (${url}):`, err?.message ?? err);
                return [];
            }
        };
        const [clientes, resoluciones, metodosPago, companies] = await Promise.all([
            this.listarClientes(companyUuid),
            fetchSafe(`/billing/billing-resolutions/list${company}`),
            fetchSafe('catalogs/payment-methods/list'),
            fetchSafe('administration/companies/list'),
        ]);
        return { clientes, resoluciones, metodosPago, companies };
    }

    /** Solo terceros activos marcados como cliente (el backend rechaza cualquier otro). */
    async listarClientes(companyUuid) {
        const params = new URLSearchParams({ type: 'is_customer' });
        if (companyUuid) params.set('company_uuid', companyUuid);
        try {
            const res = await this._getInstance().get(`third-parties/list?${params.toString()}`);
            const body = res.data?.data ?? res.data ?? [];
            return Array.isArray(body) ? body : (body.data ?? []);
        } catch (err) {
            logger.warn('Clientes del formulario no disponibles:', err?.message ?? err);
            return [];
        }
    }
}

class NotasService extends BillingApiService {
    emitir(uuid) { return this._request('POST', `/${uuid}/emitir`); }
    anular(uuid) { return this._request('POST', `/${uuid}/anular`); }
}

/**
 * Documentos electrónicos genéricos ApiDian (fase 3): documento soporte y su
 * nota, equivalentes POS, nómina 102, eventos RADIAN 030-051, lote y zip.
 * La bandera `send` la pone el proveedor de la empresa en el backend.
 */
class DocumentosElectronicosService extends BillingApiService {
    constructor() { super('/billing/electronic-documents'); }

    emitir(uuid) { return this._request('POST', `/${uuid}/emitir`, {}); }
    estado(uuid) { return this._request('GET', `/${uuid}/estado`); }
}

export const billingService = new CommercialInvoicesService();
export const billingResolutionsService = new BillingApiService('/billing/billing-resolutions');
export const billingProvidersService = new BillingApiService('/billing/billing-providers');
export const electronicDocumentsService = new DocumentosElectronicosService();
export const creditNotesService = new (class extends NotasService { constructor() { super('/billing/credit-notes'); } })();
export const debitNotesService = new (class extends NotasService { constructor() { super('/billing/debit-notes'); } })();

export default billingService;
