// @vitest-environment jsdom
// Edición de hojas de control (SPEC-009): el formulario es el mismo de la
// creación. Al editar precarga la hoja, bloquea el tipo, oculta el estado y
// envía solo los campos editables (sin `is_active`, sin `type_of_control_sheet`
// y sin los hijos que vienen en la respuesta del show).
import { describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ServiceDeliveryControlSheetFormView from '../views/ServiceDeliveryControlSheetFormView.vue';

const { mock } = vi.hoisted(() => ({
    mock: { route: { params: {}, query: {} }, store: null },
}));

vi.mock('vue-router', () => ({
    useRoute: () => mock.route,
    useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));
vi.mock('@/utils/logger.js', () => ({
    default: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/utils/confirm.js', () => ({
    showSwalModal: vi.fn(),
    closeSwal: vi.fn(),
    showLoadingModal: vi.fn(),
}));

const detalleProyecto = {
    uuid: 'proyecto-1',
    start_date: '2026-01-01',
    completion_date: '2026-12-31',
    assignments: [
        {
            uuid: 'asignacion-1',
            vehicle_uuid: 'vehiculo-1',
            third_party_uuid: 'conductor-1',
            is_active: 1,
            conductor: { first_name: 'JUAN', last_name: 'PEREZ', document_number: '900000001' },
            vehicle: { vehicle_license_plate: 'ABC123' },
        },
    ],
};

vi.mock('../store/serviceDeliveryControlSheet.store.js', async () => {
    const { reactive } = await import('vue');
    const catalogs = {
        vehicles: [{ uuid: 'vehiculo-1', vehicle_license_plate: 'ABC123' }],
        drivers: [{ uuid: 'conductor-1', first_name: 'JUAN', last_name: 'PEREZ' }],
        projects: [],
        fuecs: [],
        vehicleClasses: [],
    };
    const store = reactive({
        catalogs,
        projects: [{ uuid: 'proyecto-1', project_name: 'Proyecto Uno' }],
        projectDetail: null,
        items: [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
        loadFormOptions: vi.fn(async () => {}),
        loadProjects: vi.fn(async () => {}),
        fetchProfileById: vi.fn(async () => ({ ...mock.store.registro })),
        loadProjectDetail: vi.fn(async (uuid) => {
            store.projectDetail = uuid === detalleProyecto.uuid ? detalleProyecto : null;
            return store.projectDetail;
        }),
        updateItem: vi.fn(async () => ({})),
        createItem: vi.fn(async () => ({})),
        createBulk: vi.fn(async () => ({})),
        generateCoordinatorSignUrl: vi.fn(async () => ({ url: 'https://firma.test/abc' })),
        setSort: vi.fn(),
        setGlobalFilter: vi.fn(async () => {}),
        clearFilters: vi.fn(async () => {}),
        fetchItems: vi.fn(async () => {}),
        loadProjectsOverview: vi.fn(async () => {}),
        setViewMode: vi.fn(async () => {}),
        registro: null,
    });
    mock.store = store;

    return { useServiceDeliveryControlSheetStore: () => store };
});

vi.mock('@store', () => ({
    usePermissionsStore: () => ({
        hasRole: (rol) => rol === 'ADMIN_EMPRESA' || rol === 'administrador',
        can: () => true,
    }),
    useUserStore: () => ({ company_uuid: 'empresa-1' }),
}));

/** PrimeSelect como <select> real: refleja modelo y estado deshabilitado. */
const PrimeSelect = {
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'inputId', 'placeholder', 'invalid', 'disabled'],
    emits: ['update:modelValue'],
    computed: {
        normalizadas() {
            const opciones = (this.options ?? []).map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
            return opciones.map((o) => ({
                label: typeof this.optionLabel === 'function'
                    ? this.optionLabel(o)
                    : o[this.optionLabel ?? 'label'],
                value: o[this.optionValue ?? 'value'],
            }));
        },
    },
    template: `<select :id="inputId" :disabled="disabled || undefined" :value="modelValue ?? ''"
        @change="$emit('update:modelValue', $event.target.value)">
        <option v-for="o in normalizadas" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>`,
};

const DateInput = {
    props: ['modelValue', 'id'],
    emits: ['update:modelValue'],
    template: `<input :id="id" type="date" :value="modelValue ?? ''"
        @input="$emit('update:modelValue', $event.target.value)" />`,
};

const montarFormulario = () => mount(ServiceDeliveryControlSheetFormView, {
    global: {
        stubs: {
            BasePageHeader: true,
            BaseFormActions: true,
            PrimeSelect,
            DateInput,
        },
    },
});

const hojaEnEdicion = {
    uuid: 'hoja-1',
    company_uuid: 'empresa-1',
    project_uuid: 'proyecto-1',
    official_name_and_surname: 'RESPONSABLE HISTORICO',
    service_date: '2026-10-10',
    start_date: '2026-10-10',
    end_date: '2026-10-11',
    daily_route: 'Ruta norte',
    type_of_control_sheet: 'DIRECTO_CON_LA_EMPRESA',
    is_active: 1,
    // El show entrega los hijos y el control interno: no deben viajar de vuelta.
    children: [{ uuid: 'hija-1', service_date: '2026-10-11' }],
    internal_control: { vehicle_uuid: 'vehiculo-1', third_party_uuid: 'conductor-1' },
};

describe('formulario único de hoja de control (edición)', () => {
    it('precarga la hoja, bloquea el tipo y oculta el estado', async () => {
        mock.route.params = { id: 'hoja-1' };
        mock.store.registro = hojaEnEdicion;

        const wrapper = montarFormulario();
        await flushPromises();

        expect(wrapper.find('#f-start_date').element.value).toBe('2026-10-10');
        expect(wrapper.find('#f-end_date').element.value).toBe('2026-10-11');

        // El tipo queda fijo y se explica el motivo.
        const tipo = wrapper.find('#f-type_of_control_sheet');
        expect(tipo.exists()).toBe(true);
        expect(tipo.element.disabled).toBe(true);
        expect(tipo.element.value).toBe('DIRECTO_CON_LA_EMPRESA');
        expect(wrapper.text()).toContain('El tipo de hoja no se puede cambiar después de crearla.');

        // El estado se gestiona con el cierre: no se edita desde aquí.
        expect(wrapper.find('#f-is_active').exists()).toBe(false);
        expect(wrapper.text()).not.toContain('Estado');

        // Los selects de la pareja histórica están disponibles en edición.
        expect(wrapper.find('#f-vehicle_uuid').element.value).toBe('vehiculo-1');
        expect(wrapper.find('#f-third_party_uuid').element.value).toBe('conductor-1');
    });

    it('envía solo los campos editables y sincroniza la fecha de servicio con el inicio', async () => {
        mock.route.params = { id: 'hoja-1' };
        mock.store.registro = hojaEnEdicion;

        const wrapper = montarFormulario();
        await flushPromises();

        await wrapper.find('#f-start_date').setValue('2026-10-09');
        await wrapper.find('#f-end_date').setValue('2026-10-12');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(mock.store.updateItem).toHaveBeenCalledTimes(1);
        const [uuid, payload] = mock.store.updateItem.mock.calls[0];

        expect(uuid).toBe('hoja-1');
        expect(payload.project_uuid).toBe('proyecto-1');
        expect(payload.vehicle_uuid).toBe('vehiculo-1');
        expect(payload.third_party_uuid).toBe('conductor-1');
        expect(payload.start_date).toBe('2026-10-09');
        expect(payload.end_date).toBe('2026-10-12');
        // La hoja padre usa su primer día como fecha de servicio.
        expect(payload.service_date).toBe('2026-10-09');
        expect(payload.daily_route).toBe('Ruta norte');

        // Inmutables y datos derivados fuera del payload.
        expect(payload).not.toHaveProperty('is_active');
        expect(payload).not.toHaveProperty('type_of_control_sheet');
        expect(payload).not.toHaveProperty('children');
        expect(payload).not.toHaveProperty('internal_control');
        // En control directo el FUEC no se captura: no se pisa el histórico.
        expect(payload).not.toHaveProperty('fuec_uuid');
    });

    it('en creación mantiene el tipo editable, muestra el estado y lo envía', async () => {
        mock.route.params = {};
        mock.store.registro = null;

        const wrapper = montarFormulario();
        await flushPromises();

        const tipo = wrapper.find('#f-type_of_control_sheet');
        expect(tipo.element.disabled).toBe(false);
        expect(wrapper.find('#f-is_active').exists()).toBe(true);

        // Tipo externo: buildPayload (no el bulk) y validación sin proyecto.
        await wrapper.find('#f-project_uuid').setValue('proyecto-1');
        await flushPromises();
        await tipo.setValue('EXTERNO_PLATAFORMA');
        await wrapper.find('#f-start_date').setValue('2026-10-10');
        await wrapper.find('#f-vehicle_license_plate').setValue('ext001');
        await wrapper.find('#f-driver_name_and_surname').setValue('CONDUCTOR EXTERNO');
        await wrapper.find('#f-driver_license_number').setValue('111');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(mock.store.createItem).toHaveBeenCalledTimes(1);
        const payload = mock.store.createItem.mock.calls[0][0];

        expect(payload.type_of_control_sheet).toBe('EXTERNO_PLATAFORMA');
        expect(payload.is_active).toBe('1');
        expect(payload.service_date).toBe('2026-10-10');
        expect(payload.vehicle_license_plate).toBe('EXT001');
        expect(payload.driver_license_number).toBe('111');
    });
});
