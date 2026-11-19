import { BaseService } from '@services/api/base.service.js';
import { logger } from '@/utils/logger.js';

/**
 * Servicio para la gestión de contratos de alquiler de vehículos.
 */
class RentalContractsService extends BaseService {
    constructor() {
        super({
            resourcePath: 'fleet-management/rental-contracts',
            metadata: { module: 'rentalContracts', service: 'rentalContracts' },
        });
    }

    /**
     * Obtiene el listado paginado de contratos.
     */
    list(params = {}) {
        return this._request('GET', '', { params });
    }

    /**
     * Obtiene un contrato por su UUID.
     */
    get(uuid) {
        return this._request('GET', `/${uuid}`);
    }

    /**
     * Crea un nuevo contrato.
     */
    create(data) {
        return this._request('POST', '', { data });
    }

    /**
     * Actualiza el pago o descuento de una cuota.
     */
    updateInstallment(uuid, data) {
        // La cuota vive en `rental-installments`, un recurso hermano de `rental-contracts`;
        // se llama por instancia (no por `_request`) para no anteponer dos veces el resourcePath.
        return this._getInstance().put(`fleet-management/rental-installments/${uuid}`, data).then(res => res.data);
    }

    /**
     * Descarga el PDF del contrato de alquiler.
     */
    downloadPdf(uuid) {
        return this._downloadPdf(`/${uuid}/pdf`);
    }

    /**
     * Registra un descuento en la cuota vigente del contrato.
     */
    createDiscount(contractUuid, data) {
        return this._request('POST', `/${contractUuid}/discounts`, { data });
    }

    /**
     * Elimina un descuento de la cuota vigente.
     */
    deleteDiscount(discountUuid) {
        return this._request('DELETE', `/discounts/${discountUuid}`);
    }

    /**
     * Obtiene las opciones para los selects del formulario (vehículos).
     */
    async getFormOptions() {
        const fetchSafe = async (url) => {
            try {
                const res = await this._getInstance().get(url);
                return res.data?.data ?? res.data ?? [];
            } catch (err) {
                logger.warn(`Error cargando catálogo: ${url}`, err.message);
                return [];
            }
        };

        const { companyUuid, thirdPartyUuid, isAfiliado } = this._getUserContext();

        let vehicleQuery = `?company_uuid=${companyUuid || ''}&companyUuid=${companyUuid || ''}`;

        if (isAfiliado && thirdPartyUuid) {
            vehicleQuery += `&filter[third_party_uuid]=${thirdPartyUuid}&third_party_uuid=${thirdPartyUuid || ''}`;
        }

        const vehicles = await fetchSafe('fleet-management/vehicles/list' + vehicleQuery);

        return { vehicles };
    }
}

export default new RentalContractsService();
