<template>
    <nav class="noa-pager" aria-label="Paginación del listado">
        <div class="noa-pager__info">
            <span v-if="total > 0">
                Mostrando <strong>{{ desde }}</strong> a <strong>{{ hasta }}</strong> de <strong>{{ total }}</strong>
                registros
            </span>
            <span v-else>Sin registros</span>

            <label class="noa-pager__rows">
                <span>Filas:</span>
                <select class="noa-pager__select" :value="perPage" aria-label="Filas por página"
                    @change="cambiarFilas(Number($event.target.value))">
                    <option v-for="opcion in rowsOptions" :key="opcion" :value="opcion">{{ opcion }}</option>
                </select>
            </label>
        </div>

        <div class="noa-pager__pages">
            <button type="button" class="noa-pager__btn" title="Primera página" aria-label="Primera página"
                :disabled="page <= 1" @click="irA(1)">
                <i class="fas fa-angle-double-left" aria-hidden="true" />
            </button>
            <button type="button" class="noa-pager__btn" title="Página anterior" aria-label="Página anterior"
                :disabled="page <= 1" @click="irA(page - 1)">
                <i class="fas fa-angle-left" aria-hidden="true" />
            </button>

            <template v-for="(item, i) in paginasVisibles" :key="`${item}-${i}`">
                <span v-if="item === '…'" class="noa-pager__gap" aria-hidden="true">…</span>
                <button v-else type="button" class="noa-pager__btn noa-pager__btn--page"
                    :class="{ 'is-active': item === page }" :aria-current="item === page ? 'page' : undefined"
                    :aria-label="`Página ${item}`" @click="irA(item)">
                    {{ item }}
                </button>
            </template>

            <button type="button" class="noa-pager__btn" title="Página siguiente" aria-label="Página siguiente"
                :disabled="page >= totalPaginas" @click="irA(page + 1)">
                <i class="fas fa-angle-right" aria-hidden="true" />
            </button>
            <button type="button" class="noa-pager__btn" title="Última página" aria-label="Última página"
                :disabled="page >= totalPaginas" @click="irA(totalPaginas)">
                <i class="fas fa-angle-double-right" aria-hidden="true" />
            </button>
        </div>
    </nav>
</template>

<script setup>
/**
 * Paginador de los listados (rediseño Stitch). Reemplaza el paginador integrado de PrimeVue
 * (`:paginator="false"` en el DataTable) para controlar el diseño: a la izquierda
 * "Mostrando X a Y de Z registros | Filas: [N]" y a la derecha « ‹ 1 2 3 … 6 › ».
 *
 * Emite `change` con `{ first, rows, page }`, compatible con el handler `@page` de PrimeVue
 * (que usa `first` y `rows`).
 */
import { computed } from 'vue';

const props = defineProps({
    page: { type: Number, required: true },
    perPage: { type: Number, required: true },
    total: { type: Number, required: true },
    rowsOptions: { type: Array, default: () => [10, 25, 50, 100] },
});

const emit = defineEmits(['change']);

const totalPaginas = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)));
const desde = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.perPage + 1));
const hasta = computed(() => Math.min(props.page * props.perPage, props.total));

/** Hasta 7 elementos: 1 … (actual-1) actual (actual+1) … última. */
const paginasVisibles = computed(() => {
    const n = totalPaginas.value;
    const actual = props.page;
    if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1);

    const ventana = new Set([1, n, actual - 1, actual, actual + 1]);
    if (actual <= 3) [2, 3, 4].forEach((p) => ventana.add(p));
    if (actual >= n - 2) [n - 1, n - 2, n - 3].forEach((p) => ventana.add(p));

    const orden = [...ventana].filter((p) => p >= 1 && p <= n).sort((a, b) => a - b);
    const resultado = [];
    orden.forEach((p, i) => {
        if (i > 0 && p - orden[i - 1] > 1) resultado.push('…');
        resultado.push(p);
    });
    return resultado;
});

function irA(destino) {
    const pagina = Math.min(Math.max(1, destino), totalPaginas.value);
    if (pagina === props.page) return;
    emit('change', { page: pagina, rows: props.perPage, first: (pagina - 1) * props.perPage });
}

function cambiarFilas(filas) {
    if (filas === props.perPage) return;
    emit('change', { page: 1, rows: filas, first: 0 });
}
</script>
