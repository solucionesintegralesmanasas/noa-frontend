<template>
    <div class="noa-row-actions" role="group" :aria-label="ariaLabel">
        <button v-for="accion in enLinea" :key="accion.key" type="button" class="noa-row-action"
            :class="`noa-row-action--${accion.tone || 'neutral'}`" :title="accion.label"
            :aria-label="accion.ariaLabel || accion.label" :disabled="accion.disabled" @click="accion.onClick?.()">
            <i :class="accion.icon" aria-hidden="true" />
        </button>

        <template v-if="enMenu.length">
            <button type="button" class="noa-row-action noa-row-action--more" title="Más acciones"
                :aria-label="`Más acciones${rowLabel ? ' de ' + rowLabel : ''}`" aria-haspopup="menu"
                :aria-expanded="menuAbierto" :aria-controls="menuId" @click="alternarMenu">
                <i class="fas fa-ellipsis-v" aria-hidden="true" />
            </button>
            <Menu :id="menuId" ref="menu" :model="modeloMenu" popup class="noa-row-menu" @show="menuAbierto = true"
                @hide="menuAbierto = false">
                <template #item="{ item, props }">
                    <a v-bind="props.action" class="noa-row-menu__item"
                        :class="[`noa-row-menu__item--${item.tone || 'neutral'}`, { 'is-disabled': item.disabled }]">
                        <i :class="item.icon" class="noa-row-menu__icon" aria-hidden="true" />
                        <span class="noa-row-menu__text">
                            {{ item.label }}
                            <small v-if="item.description" class="noa-row-menu__hint">{{ item.description }}</small>
                        </span>
                    </a>
                </template>
            </Menu>
        </template>
        <span v-else class="noa-row-action noa-row-action--placeholder" aria-hidden="true" />
    </div>
</template>

<script setup>
// Estilos de listados: viajan con el componente (chunk del listado), no con main.js (SPEC-008).
import '@/assets/styles/components/_data-list.css';
/**
 * Acciones de una fila de listado.
 *
 * Regla de diseño (rediseño de listados genéricos): la columna "Acciones" tiene siempre la
 * misma estructura y ancho: [acción en línea] [acción en línea] [⋮]. Solo quedan en línea
 * las acciones marcadas `inline: true` (máx. `maxLinea`, por defecto 2); todo lo demás va
 * al menú "⋮". Las destructivas (`tone: 'danger'`) van siempre al final del menú, separadas.
 * Si una fila no tiene acciones de menú se reserva el hueco del "⋮" para que los iconos
 * de todas las filas queden alineados en la misma columna.
 *
 * Cada acción: { key, label, icon, onClick, tone?, inline?, visible?, disabled?,
 *                description?, ariaLabel? }
 */
import { computed, ref, useId } from 'vue';
import Menu from 'primevue/menu';

const props = defineProps({
    actions: { type: Array, required: true },
    /** Nombre del registro, para los aria-label ("Más acciones de X"). */
    rowLabel: { type: String, default: '' },
    /** Cuántas acciones quedan en línea; el resto va al menú. */
    maxLinea: { type: Number, default: 2 },
});

const menu = ref(null);
const menuAbierto = ref(false);
const menuId = `noa-row-menu-${useId()}`;

const visibles = computed(() => props.actions.filter((a) => a && a.visible !== false));

const reparto = computed(() => {
    const todas = visibles.value;
    const marcadas = todas.filter((a) => a.inline);
    const noDestructivas = todas.filter((a) => a.tone !== 'danger');
    const enLinea = (marcadas.length ? marcadas : noDestructivas).slice(0, props.maxLinea);
    return { enLinea, enMenu: todas.filter((a) => !enLinea.includes(a)) };
});

const enLinea = computed(() => reparto.value.enLinea);
const enMenu = computed(() => reparto.value.enMenu);

const modeloMenu = computed(() => {
    const normales = enMenu.value.filter((a) => a.tone !== 'danger');
    const destructivas = enMenu.value.filter((a) => a.tone === 'danger');
    const toItem = (a) => ({
        label: a.label,
        icon: a.icon,
        tone: a.tone,
        description: a.description,
        disabled: a.disabled,
        command: () => a.onClick?.(),
    });
    const items = normales.map(toItem);
    if (normales.length && destructivas.length) items.push({ separator: true });
    return items.concat(destructivas.map(toItem));
});

function alternarMenu(evento) {
    menu.value?.toggle(evento);
}

const ariaLabel = computed(() => (props.rowLabel ? `Acciones de ${props.rowLabel}` : 'Acciones'));
</script>
