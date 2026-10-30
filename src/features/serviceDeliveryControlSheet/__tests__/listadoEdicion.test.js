// @vitest-environment jsdom
// Acciones del listado de hojas de control (SPEC-009): la edición solo se
// ofrece con permiso y con la hoja abierta. El listado reutiliza el formulario
// único de creación, así que «Editar» navega al mismo formulario con el uuid.
import { describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ServiceDeliveryControlSheetListView from '../views/ServiceDeliveryControlSheetListView.vue';

const { mock } = vi.hoisted(() => ({
    mock: {
        route: { params: {}, query: {} },
        routerPush: null,
        store: null,
        permissions: { edit: true },
        hojaAbierta: {
            uuid: 'hoja-abierta',
            vehicle_license_plate: 'ABC123',
            project: { project_name: 'Proyecto Uno' },
            type_of_control_sheet: 'DIRECTO_CON_LA_EMPRESA',
            is_active: 1,
            daily_route: 'Ruta norte',
            driver_name: 'JUAN PEREZ',
        },
        hojaCerrada: {
            uuid: 'hoja-cerrada',
            vehicle_license_plate: 'XYZ987',
            project: { project_name: 'Proyecto Dos' },
            type_of_control_sheet: 'DIRECTO_CON_LA_EMPRESA',
            is_active: 0,
            daily_route: 'Ruta sur',
            driver_name: 'MARIA GOMEZ',
        },
    },
}));

vi.mock('vue-router', () => {
    mock.routerPush = vi.fn();
    return {
        useRoute: () => mock.route,
        useRouter: () => ({ push: mock.routerPush }),
    };
});

vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));
vi.mock('@/utils/logger.js', () => ({
    default: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/utils/confirm.js', () => ({
    showSwalModal: vi.fn(),
    closeSwal: vi.fn(),
    showLoadingModal: vi.fn(),
}));
vi.mock('@/hooks/useTable.js', () => ({
    useTable: () => ({ debouncedSearch: vi.fn() }),
}));
vi.mock('@/hooks/useTableActions.js', () => ({
    useTableActions: () => ({
        initTooltips: vi.fn(),
        destroyTooltips: vi.fn(),
        confirmDelete: vi.fn(),
    }),
}));

vi.mock('../store/serviceDeliveryControlSheet.store.js', async () => {
    const { reactive } = await import('vue');
    const store = reactive({
        viewMode: 'flat',
        projectFilter: '',
        statusFilter: 'abiertas',
        items: [mock.hojaAbierta, mock.hojaCerrada],
        projects: [],
        projectsOverview: [],
        catalogs: { vehicles: [], drivers: [], projects: [], fuecs: [], vehicleClasses: [] },
        pagination: { currentPage: 1, totalPages: 1, totalItems: 2, itemsPerPage: 10 },
        sortField: null,
        sortOrder: null,
        loading: false,
        loadFormOptions: vi.fn(async () => {}),
        loadProjectsOverview: vi.fn(async () => {}),
        fetchItems: vi.fn(async () => {}),
        setSort: vi.fn(),
        setGlobalFilter: vi.fn(async () => {}),
        setPage: vi.fn(async () => {}),
        setViewMode: vi.fn(async () => {}),
        setProjectFilter: vi.fn(async () => {}),
        setStatusFilter: vi.fn(async () => {}),
        clearFilters: vi.fn(async () => {}),
        downloadDailyPdf: vi.fn(async () => {}),
        generateCoordinatorSignUrl: vi.fn(async () => ({ url: 'https://firma.test/abc' })),
        updateBulk: vi.fn(async () => ({ updated: 2, daily_sheets: 4 })),
    });
    mock.store = store;

    return { useServiceDeliveryControlSheetStore: () => store };
});

vi.mock('@store', () => ({
    usePermissionsStore: () => ({
        hasRole: () => true,
        can: (permiso) => {
            if (permiso === 'service_delivery_control_sheets.update') return mock.permissions.edit;
            return true;
        },
    }),
    useUserStore: () => ({ company_uuid: 'empresa-1' }),
}));

/** MobileCard mínimo: expone el contenido y el slot de acciones de cada hoja. */
const MobileCard = {
    props: ['title', 'subtitle', 'badge', 'variant', 'iconClass'],
    template: `<article>
        <h3>{{ title }}</h3>
        <slot />
        <div class="acciones"><slot name="actions" /></div>
    </article>`,
};

const DialogStub = {
    props: ['visible'],
    template: `<div v-if="visible" class="bulk-dialog"><slot name="header" /><slot /></div>`,
};

const DateInputStub = {
    props: ['modelValue', 'id'],
    emits: ['update:modelValue'],
    template: `<input :id="id" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`,
};

const montarListado = () => mount(ServiceDeliveryControlSheetListView, {
    global: {
        stubs: {
            BasePageHeader: true,
            NoaTableSpinner: true,
            ProjectSwitcherCards: true,
            ServiceReportsDialog: true,
            MobileSectionHeader: true,
            MobileEmptyState: true,
            ListPagination: true,
            PrimeSelect: true,
            RowActions: true,
            DataTable: true,
            Column: true,
            Dialog: DialogStub,
            DateInput: DateInputStub,
            MobileCard,
        },
    },
});

describe('listado de hojas de control (acción Editar)', () => {
    it('muestra Editar solo en la hoja abierta y navega al formulario único', async () => {
        mock.route.params = {};
        mock.route.query = {};
        mock.permissions.edit = true;

        const wrapper = montarListado();
        await flushPromises();

        const tarjetas = wrapper.findAll('article');
        expect(tarjetas).toHaveLength(2);

        const botonesEditar = wrapper.findAll('article button').filter((b) => b.text().includes('Editar'));
        expect(botonesEditar).toHaveLength(1);
        expect(tarjetas[0].text()).toContain('Editar');
        expect(tarjetas[1].text()).not.toContain('Editar');

        await botonesEditar[0].trigger('click');
        expect(mock.routerPush).toHaveBeenCalledWith(
            '/planilla-de-control-de-prestacion-servicios/editar/hoja-abierta'
        );
    });

    it('oculta Editar en todas las hojas sin permiso de actualización', async () => {
        mock.permissions.edit = false;

        const wrapper = montarListado();
        await flushPromises();

        const botonesEditar = wrapper.findAll('article button').filter((b) => b.text().includes('Editar'));
        expect(botonesEditar).toHaveLength(0);
    });

    it('permite actualización general desde el botón Editar de cada tarjeta en Proyectos Activos de la Flota', async () => {
        mock.permissions.edit = true;
        mock.store.viewMode = 'projects';
        mock.store.projectsOverview = [
            {
                uuid: 'proyecto-1',
                project_name: 'Proyecto Uno',
                start_date: '2026-10-10',
                completion_date: '2026-10-15',
                assignments_count: 2,
            },
        ];
        mock.store.projectFilter = 'proyecto-1';

        const wrapper = mount(ServiceDeliveryControlSheetListView, {
            global: {
                stubs: {
                    BasePageHeader: true,
                    NoaTableSpinner: true,
                    ServiceReportsDialog: true,
                    MobileSectionHeader: true,
                    MobileEmptyState: true,
                    ListPagination: true,
                    PrimeSelect: true,
                    RowActions: true,
                    DataTable: true,
                    Column: true,
                    Dialog: DialogStub,
                    DateInput: DateInputStub,
                    MobileCard,
                },
            },
        });
        await flushPromises();

        const btnEditarTarjeta = wrapper.find('.project-card button[aria-label="Editar hojas del proyecto Proyecto Uno"]');
        expect(btnEditarTarjeta.exists()).toBe(true);

        await btnEditarTarjeta.trigger('click');
        await flushPromises();

        const inputFin = wrapper.find('#bulk-end-date');
        expect(inputFin.exists()).toBe(true);
        await inputFin.setValue('2026-10-25');

        const btnGuardar = wrapper.findAll('.bulk-dialog button').find((b) => b.text().includes('Actualizar todas las hojas del proyecto'));
        await btnGuardar.trigger('click');
        await flushPromises();

        expect(mock.store.updateBulk).toHaveBeenCalledWith({
            company_uuid: 'empresa-1',
            project_uuid: 'proyecto-1',
            start_date: '2026-10-10',
            end_date: '2026-10-25',
        });
    });
});
