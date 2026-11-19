/**
 * Hook unificado para gestionar tablas con paginación server-side,
 * filtros y búsqueda con debounce.
 *
 * Ubicación: src/hooks/useTable.js
 */
import { ref, reactive } from 'vue';

/**
 * @param {object}   initialParams  - Parámetros iniciales: { page, rows, filters }
 * @param {Function} fetchCallback  - Función a ejecutar al cambiar página / filtro
 */
export function useTable(initialParams = {}, fetchCallback = null) {
    const params = initialParams || {};
    const page    = ref(params.page ?? 1);
    const rows    = ref(params.rows ?? 10);
    const filters = reactive(params.filters ?? { globalFilter: '' });
    const loading = ref(false);

    let _debounceTimer = null;
    const defaultDelay = typeof params.debounceDelay === 'number' && Number.isFinite(params.debounceDelay)
        ? params.debounceDelay
        : 400;

    /**
     * Búsqueda con retraso para no sobrecargar la API.
     * Ignora argumentos no numéricos (como InputEvent al usar @input="debouncedSearch").
     */
    const debouncedSearch = (customDelay) => {
        const effectiveDelay = typeof customDelay === 'number' && Number.isFinite(customDelay) && customDelay >= 0
            ? customDelay
            : defaultDelay;
        clearTimeout(_debounceTimer);
        _debounceTimer = setTimeout(() => {
            _debounceTimer = null;
            page.value = 1;
            if (fetchCallback) fetchCallback();
        }, effectiveDelay);
    };

    /** Limpia filtros y recarga */
    const clearFilters = () => {
        clearTimeout(_debounceTimer);
        _debounceTimer = null;
        Object.keys(filters).forEach(key => {
            filters[key] = key === 'globalFilter' ? '' : null;
        });
        page.value = 1;
        if (fetchCallback) fetchCallback();
    };

    /**
     * Manejador de cambio de página compatible con PrimeVue lazy DataTable.
     * PrimeVue emite { first, rows } → convertimos a número de página (1-indexed).
     */
    const onPage = (event = {}) => {
        if (!event || typeof event !== 'object') return;
        clearTimeout(_debounceTimer);
        _debounceTimer = null;
        try {
            const filasEvent = typeof event.rows !== 'boolean' && !Array.isArray(event.rows) && event.rows !== '' && typeof event.rows !== 'symbol' ? Number(event.rows) : NaN;
            const filasBase = typeof rows.value !== 'boolean' && !Array.isArray(rows.value) && rows.value !== '' && typeof rows.value !== 'symbol' ? Number(rows.value) : 10;
            const eventRows = Number.isFinite(filasEvent) && filasEvent > 0 ? filasEvent : (Number.isFinite(filasBase) && filasBase > 0 ? filasBase : 10);

            if (event.page !== undefined && event.page !== null && !Array.isArray(event.page) && typeof event.page !== 'boolean' && event.page !== '' && typeof event.page !== 'symbol') {
                const destino = Number(event.page);
                if (Number.isFinite(destino) && destino >= 0) {
                    page.value = Math.floor(destino) + 1;
                }
            } else if (event.first !== undefined && event.first !== null && !Array.isArray(event.first) && typeof event.first !== 'boolean' && event.first !== '' && typeof event.first !== 'symbol') {
                const first = Number(event.first);
                if (Number.isFinite(first) && first >= 0) {
                    page.value = Math.floor(first / eventRows) + 1;
                }
            }
            rows.value = eventRows;
            if (fetchCallback && typeof fetchCallback === 'function') fetchCallback();
        } catch {}
    };

    return { page, rows, filters, loading, onPage, debouncedSearch, clearFilters };
}