import { BaseService } from '@services/api/base.service.js';
import { logger } from '@/utils/logger.js';

/**
 * Servicio del reporte de vehículos.
 * Un solo filtro activo a la vez para consultas acotadas.
 */
class VehicleReportsService extends BaseService {
    constructor() {
        super({
            resourcePath: 'reports/vehicles',
            metadata: { module: 'reports', service: 'vehicles' },
        });
    }

    /**
     * Consulta paginada del reporte (requiere filter_type).
     * Usa la instancia directa para no forzar third_party_uuid de afiliado:
     * el filtro activo lo define el usuario.
     */
    async report(params = {}) {
        const limpios = {};
        for (const [k, v] of Object.entries(params ?? {})) {
            if (v === undefined || v === null || v === '' || v === 'undefined') continue;
            limpios[k] = v;
        }
        const res = await this._getInstance().get(this.resourcePath, { params: limpios });
        return res.data;
    }

    async downloadExcel(params = {}) {
        const limpios = {};
        for (const [k, v] of Object.entries(params ?? {})) {
            if (v === undefined || v === null || v === '' || v === 'undefined') continue;
            limpios[k] = v;
        }
        const qs = new URLSearchParams(limpios).toString();
        return this._downloadExcel(qs ? `/excel?${qs}` : '/excel', 'Reporte_Vehiculos.xlsx');
    }

    async downloadPdf(params = {}) {
        const limpios = {};
        for (const [k, v] of Object.entries(params ?? {})) {
            if (v === undefined || v === null || v === '' || v === 'undefined') continue;
            limpios[k] = v;
        }
        const qs = new URLSearchParams(limpios).toString();
        return this._downloadPdf(qs ? `/pdf?${qs}` : '/pdf', 'Reporte_Vehiculos.pdf');
    }

    /**
     * Catálogos bajo demanda según el filtro activo (no precargar todo).
     */
    async getFilterOptions(filterType) {
        const fetchSafe = async (url, params = {}) => {
            try {
                const res = await this._getInstance().get(url, { params });
                const data = res.data?.data ?? res.data ?? [];
                return Array.isArray(data) ? data : (data?.data ?? []);
            } catch (err) {
                logger.warn(`Error cargando catálogo: ${url}`, err.message);
                return [];
            }
        };

        const withLabel = (items, labelField, fallbacks = []) =>
            (Array.isArray(items) ? items : []).map((item) => {
                if (!item || typeof item !== 'object') return item;
                let label = item[labelField];
                for (const fb of fallbacks) {
                    if (label !== null && label !== undefined && String(label).trim() !== '') break;
                    label = typeof fb === 'function' ? fb(item) : item[fb];
                }
                if (label === null || label === undefined || String(label).trim() === '') label = 'Sin nombre';
                return { ...item, [labelField]: String(label) };
            });

        if (filterType === 'affiliate') {
            const afiliados = await fetchSafe('third-parties/list', { type: 'is_affiliate' });
            return {
                terceros: withLabel(afiliados, 'company_name', [
                    (i) => [i.first_name, i.last_name].filter(Boolean).join(' ').trim(),
                    'document_number',
                ]),
            };
        }
        if (filterType === 'driver') {
            // Catálogo propio: solo personas naturales con asignación activa (nunca jurídicas)
            const conductores = await fetchSafe('reports/vehicles/catalogs/drivers');
            const normalizados = (Array.isArray(conductores) ? conductores : []).map((c) => ({
                uuid: c.value,
                company_name: c.label,
            }));
            return { terceros: withLabel(normalizados, 'company_name', ['document_number']) };
        }
        if (filterType === 'project') {
            const proyectos = await fetchSafe('projects/list');
            return { proyectos: withLabel(proyectos, 'project_name', ['name']) };
        }
        if (filterType === 'operation_card') {
            const empresas = await fetchSafe('reports/vehicles/catalogs/affiliated-companies');
            return { affiliatedCompanies: withLabel(empresas, 'label', ['value']) };
        }
        if (filterType === 'agreement') {
            const convenios = await fetchSafe('reports/vehicles/catalogs/agreements');
            return { agreements: withLabel(convenios, 'label', ['value']) };
        }
        return {};
    }
}

export default new VehicleReportsService();
