/**
 * Orquestador del asistente de documentos del vehículo.
 * Define los pasos (SOAT → Pólizas → Tecnomecánica → Tarjeta → Resumen),
 * resuelve rutas, filtra por permisos y calcula documentos pendientes.
 *
 * Ubicación: src/hooks/useDocumentWizard.js
 */
import vehicleDocumentsService from '@/features/vehicleDocuments/services/vehicleDocuments.service.js';
import operationCardsService from '@/features/operationCards/services/operationCards.service.js';
import businessCollaborationAgreementsService from '@/features/businessCollaborationAgreements/services/businessCollaborationAgreements.service.js';
import vehiclesService from '@/features/vehicles/services/vehicles.service.js';

export const WIZARD_STEPS = [
    { key: 'vehiculo', label: 'Vehículo', icon: 'fad fa-car', permission: 'vehicles.create', hint: 'Registra los datos del vehículo y el afiliado; luego seguirás con sus documentos' },
    { key: 'soat', label: 'SOAT', icon: 'fad fa-file-invoice', permission: 'vehicle_documents.create', hint: 'Ten a la mano el número de SOAT, la entidad emisora y las fechas de vigencia' },
    { key: 'poliza', label: 'Pólizas RCE/RCC', icon: 'fad fa-file-contract', soloPublico: true, permission: 'vehicle_documents.create', hint: 'Consulta los números de póliza RCE y RCC, el tomador y la aseguradora' },
    { key: 'tecnomecanica', label: 'Tecnomecánica', icon: 'fad fa-industry', permission: 'vehicle_documents.create', hint: 'Consulta el número de revisión y el CDA que la expidió' },
    { key: 'tarjeta', label: 'Tarjeta de operación', icon: 'fad fa-car-bus', soloPublico: true, permission: 'operation_cards.create', hint: 'Ten a la mano el número de tarjeta y sus fechas de expedición y vencimiento' },
];

/**
 * Regla de negocio: un vehículo particular no tiene pólizas RCC/RCE ni tarjeta de operación
 * (solo SOAT y tecnomecánica). Los pasos marcados `soloPublico` no se le ofrecen.
 * @param {{type_of_service?: string}|null|undefined} vehiculo
 * @returns {boolean}
 */
export const esVehiculoParticular = (vehiculo) =>
    String(vehiculo?.type_of_service ?? '').toUpperCase() === 'PARTICULAR';

/**
 * Pasos del asistente aplicables al vehículo (los de solo público se omiten en particulares).
 * @param {{particular?: boolean}} [contexto]
 * @returns {Array}
 */
export const pasosAplicables = (contexto = {}) => {
    const ctx = contexto || {};
    return WIZARD_STEPS.filter((s) => !(ctx.particular && s.soloPublico));
};

/**
 * Documento más reciente de un tipo: mayor fecha de vencimiento y, a igual fecha, el último
 * registrado. La API devuelve todos los documentos del vehículo (incluidos los reemplazados) en
 * cualquier orden, así que tomar el primero mostraba, p. ej., una RTM vencida habiendo una nueva.
 * @param {Array} docs
 * @param {(d: Object) => boolean} coincide
 * @param {string} [campoVence]
 * @returns {Object|null}
 */
export const masReciente = (docs, coincide, campoVence = 'expiry_date') => {
    const lista = Array.isArray(docs) ? docs : [];
    const fnCoincide = typeof coincide === 'function' ? coincide : () => true;
    const toTime = (v) => {
        if (v == null || typeof v === 'symbol') return 0;
        try {
            const t = new Date(v).getTime();
            return Number.isFinite(t) ? t : 0;
        } catch {
            return 0;
        }
    };
    const campo = typeof campoVence === 'string' && campoVence ? campoVence : 'expiry_date';
    const marca = (d) => {
        if (!d || typeof d !== 'object') return 0;
        try { return toTime(d[campo]); } catch { return 0; }
    };
    const creado = (d) => {
        if (!d || typeof d !== 'object') return 0;
        try { return toTime(d.created_at); } catch { return 0; }
    };
    return lista
        .filter(fnCoincide)
        .sort((a, b) => marca(b) - marca(a) || creado(b) - creado(a))[0] ?? null;
};

/**
 * Póliza viva más reciente de un tipo (RCC/RCE/SOAT/RTM): excluye las
 * reemplazadas (INACTIVA, historial), prefiere las vigentes y elige por
 * vencimiento y registro. La API devuelve todos los documentos del vehículo
 * en cualquier orden, así que tomar el primero editaba o validaba contra
 * el registro viejo. Acepta SI por compatibilidad con registros anteriores
 * a la normalización.
 * @param {Array} docs
 * @param {string} tipo p. ej. 'RCC'
 * @returns {Object|null}
 */
export const elegirPolizaViva = (docs, tipo) => {
    let clave = '';
    try {
        if (typeof tipo === 'string') clave = tipo.toUpperCase();
        else if (typeof tipo !== 'symbol' && tipo != null) clave = String(tipo).toUpperCase();
    } catch { clave = ''; }
    const lista = Array.isArray(docs) ? docs : [];
    const esTipo = (d) => {
        if (!d || typeof d !== 'object') return false;
        try {
            return String(d.document_type ?? '').toUpperCase() === clave;
        } catch {
            return false;
        }
    };
    const vivas = lista.filter((d) => {
        if (!d || typeof d !== 'object') return false;
        try {
            return String(d.status ?? '').toUpperCase() !== 'INACTIVA' && esTipo(d);
        } catch {
            return false;
        }
    });
    const vigentes = vivas.filter((d) => {
        try {
            return ['VIGENTE', 'SI'].includes(String(d?.status ?? '').toUpperCase());
        } catch {
            return false;
        }
    });
    return masReciente(vigentes.length > 0 ? vigentes : vivas, () => true);
};

/**
 * Normaliza respuestas paginadas o planas a arreglo.
 * @param {*} resp
 * @returns {Array}
 */
const toList = (resp) => {
    const data = resp?.data ?? resp ?? [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

export function useDocumentWizard() {
    /**
     * Ruta del paso indicado para un vehículo.
     * @param {string} stepKey
     * @param {string} vehicleUuid
     * @returns {{path:string, query:Object}}
     */
    const stepRoute = (stepKey, vehicleUuid) => {
        if (stepKey === 'tarjeta') {
            return { path: '/tarjetas-de-operacion/crear', query: { wizard: vehicleUuid } };
        }
        return { path: `/vehiculos-documentos/${stepKey}/crear`, query: { wizard: vehicleUuid } };
    };

    const canRunStep = (step, permissionsStore, contexto = {}) => {
        if (contexto.particular && step.soloPublico) return false;
        if (!step.permission) return true;
        try {
            return permissionsStore.can(step.permission);
        } catch {
            return true;
        }
    };

    /**
     * Pasos ejecutables para el usuario actual.
     * @param {Object} permissionsStore
     * @returns {Array}
     */
    const availableSteps = (permissionsStore, contexto = {}) =>
        WIZARD_STEPS.filter((s) => canRunStep(s, permissionsStore, contexto));

    /**
     * Primer paso ejecutable tras crear el vehículo (null si no hay ninguno).
     * @param {Object} permissionsStore
     * @returns {Object|null} step
     */
    const firstStep = (permissionsStore, contexto = {}) =>
        availableSteps(permissionsStore, contexto).find((s) => s.key !== 'vehiculo') ?? null;

    /**
     * Ruta de salida del asistente: perfil del vehículo (las alertas cubren pendientes).
     * @param {string} vehicleUuid
     * @returns {{path:string, query:Object}}
     */
    const exitRoute = (vehicleUuid) => ({ path: `/vehiculos/perfil/${vehicleUuid}`, query: {} });

    /**
     * Paso siguiente al actual, saltando los no permitidos (sale al perfil al final).
     * @param {string} currentKey
     * @param {string} vehicleUuid
     * @param {Object} permissionsStore
     * @returns {{path:string, query:Object}}
     */
    const nextStepRoute = (currentKey, vehicleUuid, permissionsStore, contexto = {}) => {
        const idx = WIZARD_STEPS.findIndex((s) => s.key === currentKey);
        for (let i = idx + 1; i < WIZARD_STEPS.length; i++) {
            if (canRunStep(WIZARD_STEPS[i], permissionsStore, contexto)) {
                return stepRoute(WIZARD_STEPS[i].key, vehicleUuid);
            }
        }
        return exitRoute(vehicleUuid);
    };

    /**
     * Paso anterior al actual, saltando los no permitidos.
     * Desde SOAT vuelve al perfil; el formulario de vehículo vuelve al listado.
     * @param {string} currentKey
     * @param {string} vehicleUuid
     * @param {Object} permissionsStore
     * @returns {{path:string, query:Object}}
     */
    const prevStepRoute = (currentKey, vehicleUuid, permissionsStore, contexto = {}) => {
        const idx = WIZARD_STEPS.findIndex((s) => s.key === currentKey);
        for (let i = idx - 1; i >= 0; i--) {
            if (WIZARD_STEPS[i].key === 'vehiculo') return exitRoute(vehicleUuid);
            if (canRunStep(WIZARD_STEPS[i], permissionsStore, contexto)) {
                return stepRoute(WIZARD_STEPS[i].key, vehicleUuid);
            }
        }
        return exitRoute(vehicleUuid);
    };

    /**
     * Progreso de la sesión (inmediato, sin esperar al backend).
     * Garantiza checks secuenciales al avanzar entre pasos.
     */
    const sessionKey = (vehicleUuid) => `noa-wizard-done-${vehicleUuid}`;

    const getSessionDone = (vehicleUuid) => {
        try {
            const val = JSON.parse(sessionStorage.getItem(sessionKey(vehicleUuid)));
            return Array.isArray(val) ? val : [];
        } catch {
            return [];
        }
    };

    const markStepDone = (vehicleUuid, stepKey) => {
        try {
            const done = new Set([...getSessionDone(vehicleUuid), 'vehiculo', stepKey]);
            sessionStorage.setItem(sessionKey(vehicleUuid), JSON.stringify([...done]));
        } catch {
            // Almacenamiento no disponible: el fetch cubre el estado
        }
    };

    const clearSessionDone = (vehicleUuid) => {
        try {
            sessionStorage.removeItem(sessionKey(vehicleUuid));
        } catch {
            // Nada que limpiar
        }
    };

    /**
     * Consulta qué documentos ya existen para el vehículo.
     * @param {string} vehicleUuid
     * @param {{ strict?: boolean }} [options] Si `strict` es true, un fallo de la
     *   consulta principal se propaga en lugar de tratarse como "sin documentos".
     * @returns {Promise<{soat:Object|null, rce:Object|null, rcc:Object|null, rtm:Object|null, tarjeta:Object|null, convenio:Object|null}>}
     */
    const fetchExistingDocs = async (vehicleUuid, { strict = false } = {}) => {
        const found = { soat: null, rce: null, rcc: null, rtm: null, tarjeta: null, convenio: null };
        if (!vehicleUuid) return found;

        try {
            const docs = toList(await vehicleDocumentsService.getByVehicle(vehicleUuid));
            const deTipo = (tipo) => masReciente(docs, (d) => d.document_type === tipo);
            found.soat = deTipo('SOAT');
            found.rce = deTipo('RCE');
            found.rcc = deTipo('RCC');
            found.rtm = deTipo('RTM');
        } catch (error) {
            // Un fallo real no debe interpretarse como "documento inexistente".
            if (strict) throw error;
        }

        try {
            // El endpoint de tarjetas ignora el filtro vehicle_uuid: verificar en cliente
            const cards = toList(await operationCardsService.list({ vehicle_uuid: vehicleUuid }));
            found.tarjeta = masReciente(cards, (c) => c.vehicle_uuid === vehicleUuid || c.vehicle?.uuid === vehicleUuid, 'expiration_date');
        } catch {
            // Sin tarjeta aún
        }

        if (!found.tarjeta) {
            // Fallback: el perfil del vehículo trae operation_cards embebidas
            // (el listado paginado puede no incluir la tarjeta del vehículo)
            try {
                const resp = await vehiclesService.getProfile(vehicleUuid);
                const profile = resp?.data?.data ?? resp?.data ?? resp ?? {};
                const cards = Array.isArray(profile.operation_cards) ? profile.operation_cards : [];
                if (cards.length) {
                    const now = new Date();
                    const vigentes = cards.filter((c) => c.expiration_date && new Date(c.expiration_date) > now);
                    const pool = vigentes.length ? vigentes : cards;
                    pool.sort((a, b) => new Date(b.expiration_date ?? 0) - new Date(a.expiration_date ?? 0));
                    found.tarjeta = pool[0] ?? null;
                }
            } catch {
                // Sin tarjeta aún
            }
        }

        try {
            // Convenio del vehículo (el más reciente por vencimiento).
            const agreements = toList(await businessCollaborationAgreementsService.list({ vehicle_uuid: vehicleUuid }));
            const mine = agreements.filter((a) => a.vehicle_uuid === vehicleUuid);
            if (mine.length) {
                mine.sort((a, b) => new Date(b.expiry_date ?? 0) - new Date(a.expiry_date ?? 0));
                found.convenio = mine[0] ?? null;
            }
        } catch {
            // Sin convenio registrado
        }

        return found;
    };

    /**
     * Normaliza una fecha a YYYY-MM-DD para inputs type="date".
     * @param {*} value
     * @returns {string}
     */
    const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');

    return { WIZARD_STEPS, pasosAplicables, esVehiculoParticular, stepRoute, exitRoute, canRunStep, availableSteps, firstStep, nextStepRoute, prevStepRoute, fetchExistingDocs, getSessionDone, markStepDone, clearSessionDone, toDateInput };
}
