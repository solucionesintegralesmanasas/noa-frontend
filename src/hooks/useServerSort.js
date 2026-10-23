import { computed, ref } from 'vue';

/**
 * Ordenamiento server-side para un `DataTable` de PrimeVue en modo `lazy`.
 *
 * En `lazy` PrimeVue NO ordena el arreglo: solo mueve la flecha de la cabecera y
 * emite `sort`. Sin este puente el clic no hace nada. El contrato con la API es
 * `sort_by` (el campo visible de la columna) y `sort_order` (`asc`|`desc`), que
 * el backend valida contra la lista blanca de `BaseService::$sortableFields`.
 *
 * Uso en la vista:
 *   const { sortField, sortOrder, sortOrdenPrimeVue, onSort, restore } = useServerSort({
 *       onChange: ({ field, order }) => store.setSort(field, order),
 *   });
 *
 * @param {object} opciones
 * @param {string|null} opciones.field  Campo ordenado inicial.
 * @param {'asc'|'desc'|null} opciones.order  Dirección inicial.
 * @param {(orden: {field: string|null, order: 'asc'|'desc'|null}) => void} opciones.onChange
 *        Se invoca solo cuando el usuario cambia el orden (no al restaurar desde la URL).
 */
export function useServerSort({ field = null, order = null, onChange = null } = {}) {
    const sortField = ref(field);
    const sortOrder = ref(order === 'desc' ? 'desc' : order === 'asc' ? 'asc' : null);

    /** PrimeVue espera 1 (asc), -1 (desc) o null (sin orden). */
    const sortOrdenPrimeVue = computed(() => {
        if (!sortField.value || !sortOrder.value) return null;
        return sortOrder.value === 'desc' ? -1 : 1;
    });

    /** Normaliza el `sortOrder` numérico del evento `sort` al contrato de la API. */
    const normalizarDireccion = (valor) => {
        if (valor === 1 || valor === 'asc') return 'asc';
        if (valor === -1 || valor === 'desc') return 'desc';
        return null;
    };

    const aplicar = (campo, direccion) => {
        const campoValido = direccion ? (campo || null) : null;
        sortField.value = campoValido;
        sortOrder.value = campoValido ? direccion : null;
    };

    /** Manejador de `@sort` del DataTable. */
    const onSort = (event) => {
        const direccion = normalizarDireccion(event?.sortOrder);
        aplicar(event?.sortField ?? null, direccion);
        if (typeof onChange === 'function') {
            onChange({ field: sortField.value, order: sortOrder.value });
        }
    };

    /**
     * Fija el orden sin emitir `onChange`. Se usa al montar la vista para
     * recuperar `?sort=` y `?order=` de la URL antes de la primera carga.
     */
    const restore = (campo, direccion) => {
        aplicar(campo, normalizarDireccion(direccion));
    };

    const reset = () => {
        sortField.value = null;
        sortOrder.value = null;
    };

    return { sortField, sortOrder, sortOrdenPrimeVue, onSort, restore, reset };
}
