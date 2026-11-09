import { BaseService } from '@services/api/base.service.js';
import { logger } from '@/utils/logger.js';
import { formatVehicleList } from '@/utils/catalogFormatters.js';

/**
 * Servicio del reporte consolidado de actividad vehicular
 * (inspecciones, mantenimiento, combustible, tanqueos y hojas de control).
 */
class VehicleActivityReportsService extends BaseService {
    constructor() {
        super({
            resourcePath: 'reports/vehicle-activity',
            metadata: { module: 'reports', service: 'vehicle-activity' },
        });
        this._reportAbortController = null;
    }

    /**
     * Limpia parámetros vacíos o indefinidos antes de enviar la petición.
     * @private
     */
    _cleanParams(params = {}) {
        const limpios = {};
        for (const [k, v] of Object.entries(params ?? {})) {
            if (v === undefined || v === null || v === '' || v === 'undefined') continue;
            limpios[k] = v;
        }
        return limpios;
    }

    /**
     * Consulta paginada del reporte (requiere fecha_desde y fecha_hasta).
     * @private
     */
    async _getCancelable(endpoint, params = {}) {
        const limpios = this._cleanParams(params);
        let controller = null;

        if (typeof AbortController !== 'undefined') {
            if (this._reportAbortController) {
                this._reportAbortController.abort();
            }
            controller = new AbortController();
            this._reportAbortController = controller;
        }

        try {
            const res = await this._getInstance().get(endpoint, {
                params: limpios,
                ...(controller ? { signal: controller.signal } : {}),
            });
            return res.data;
        } catch (error) {
            if (controller?.signal?.aborted) {
                error.__isCanceled = true;
            }
            throw error;
        } finally {
            if (controller && this._reportAbortController === controller) {
                this._reportAbortController = null;
            }
        }
    }

    async report(params = {}) {
        return this._getCancelable(this.resourcePath, params);
    }

    async downloadExcel(params = {}) {
        const qs = new URLSearchParams(this._cleanParams(params)).toString();
        return this._downloadExcel(qs ? `/${this.resourcePath}/excel?${qs}` : `/${this.resourcePath}/excel`, 'Reporte_Actividad_Vehicular.xlsx');
    }

    async downloadPdf(params = {}) {
        const qs = new URLSearchParams(this._cleanParams(params)).toString();
        return this._downloadPdf(qs ? `/${this.resourcePath}/pdf?${qs}` : `/${this.resourcePath}/pdf`, 'Reporte_Actividad_Vehicular.pdf');
    }

    /**
     * Catálogos de los filtros: vehículos y proyectos de la empresa.
     */
    async getCatalogos() {
        const fetchSafe = async (url) => {
            try {
                const res = await this._getInstance().get(url);
                const data = res.data?.data ?? res.data ?? [];
                return Array.isArray(data) ? data : (data?.data ?? []);
            } catch (err) {
                logger.warn(`Error cargando catálogo: ${url}`, err.message);
                return [];
            }
        };

        const [vehiculos, proyectos] = await Promise.all([
            fetchSafe('vehicles/list'),
            fetchSafe('projects/list'),
        ]);

        return {
            vehiculos: formatVehicleList(vehiculos),
            proyectos: proyectos.map((p) => ({
                ...p,
                project_name: p.project_name ?? p.name ?? 'Sin nombre',
            })),
        };
    }
}

export default new VehicleActivityReportsService();
