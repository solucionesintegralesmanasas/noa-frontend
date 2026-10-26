// @vitest-environment jsdom
// Bug de precarga: al editar un conductor, el campo «Afiliado Asignado
// (Propietario)» llega vacío aunque la relación existe. El dato no es columna
// de third_parties: vive en owners_drivers, serializado en la licencia como
// owner_driver.third_party_uuid. El formulario debe precargarlo al cargar la
// licencia del conductor.
import { describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ThirdPartiesFormView from '../views/ThirdPartiesFormView.vue';

/** PrimeSelect devuelto como <select> nativo interactivo (arnés de datosPersonaForm). */
const PrimeSelect = {
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'inputId', 'placeholder'],
    emits: ['update:modelValue'],
    computed: {
        normalizadas() {
            return (this.options ?? []).map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
        },
    },
    template: `<select :id="inputId" :value="modelValue ?? ''" @change="$emit('update:modelValue', $event.target.value)">
        <option value="">—</option>
        <option v-for="o in normalizadas" :key="o.value ?? o.uuid" :value="o.value ?? o.uuid">{{ o.label ?? o.name }}</option>
    </select>`,
};

const DateInput = {
    props: ['modelValue', 'id', 'invalid'],
    emits: ['update:modelValue'],
    template: `<input :id="id" type="date" :value="modelValue ?? ''" @input="$emit('update:modelValue', $event.target.value)" />`,
};

const PrimeMultiSelect = {
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'inputId'],
    emits: ['update:modelValue'],
    template: `<select :id="inputId" @change="$emit('update:modelValue', [$event.target.value])">
        <option value="">—</option>
        <option v-for="o in (options ?? [])" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>`,
};

// Los mismos dobles usa la vista: perfil del conductor con is_driver y su
// licencia con el propietario (afiliado) dentro del owner_driver.
vi.mock('vue-router', () => ({
    useRouter: () => ({ push: vi.fn() }),
    useRoute: () => ({
        params: { id: 'conductor-1' },
        query: {},
        path: '/terceros/conductor/editar/conductor-1',
        fullPath: '/terceros/conductor/editar/conductor-1',
    }),
}));
vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));
vi.mock('@/utils/logger.js', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('../services/thirdParties.service.js', () => ({
    default: { checkEmail: vi.fn(async () => ({ data: { exists: false } })) },
}));

// Perfil como lo entrega el show del backend (SIN affiliate_uuid) y licencias
// como las entrega /driver-licenses/list (con owner_driver precargado).
const perfilConductor = {
    uuid: 'conductor-1',
    company_uuid: 'empresa-1',
    person_type: 'NATURAL',
    document_number: '1090555999',
    first_name: 'ANA',
    last_name: 'RESTREPO',
    email: 'ana.conductora@tercero.local',
    is_driver: 1,
    is_active: 1,
    branch: { uuid: 'sede-1', name: 'Sede Principal' },
};

const mockLicencias = [
    {
        uuid: 'licencia-1',
        third_party_uuid: 'conductor-1',
        number: 'LIB-019283746',
        category: 'C1',
        status: 'ACTIVA',
        owner_driver: { uuid: 'od-1', driver_license_uuid: 'licencia-1', third_party_uuid: 'afiliado-1' },
    },
];

vi.mock('../store/thirdParties.store.js', () => ({
    useThirdPartiesStore: () => ({
        loadFormOptions: vi.fn(async () => {}),
        loadBranches: vi.fn(async () => {}),
        fetchProfileById: vi.fn(async () => ({ ...perfilConductor })),
        fetchDriverLicenses: vi.fn(async () => mockLicencias),
        catalogs: {
            documentTypes: [{ uuid: 'doc-cc', name: 'CC' }],
            cities: [{ uuid: 'ciudad-1', name: 'Buenaventura' }],
            branches: [{ uuid: 'sede-1', name: 'Sede Principal', company_uuid: 'empresa-1', status: 1, is_primary: 1 }],
            taxResponsibilities: [],
            roles: [],
            affiliate: [
                { uuid: 'afiliado-1', document_number: '900123456', company_name: 'TRANSPORTES SIN BARRERAS AFILIADO' },
                { uuid: 'afiliado-2', document_number: '900654321', company_name: 'OTRO AFILIADO SAS' },
            ],
        },
    }),
}));
vi.mock('@store', () => ({
    usePermissionsStore: () => ({ roles: ['ADMIN_EMPRESA'], hasRole: (rol) => rol === 'ADMIN_EMPRESA' }),
    useUserStore: () => ({ company_uuid: 'empresa-1' }),
}));

const montarVista = () => mount(ThirdPartiesFormView, {
    attachTo: document.body,
    global: {
        stubs: {
            BasePageHeader: true,
            BaseFormActions: true,
            ProfilePhotoUploader: true,
            RuesLookupPanel: true,
            PrimeSelect,
            PrimeMultiSelect,
            DateInput,
        },
    },
});

describe('precarga del afiliado asignado al editar un conductor', () => {
    it('el select «Afiliado Asignado (Propietario)» trae el owner_driver de la licencia', async () => {
        const vista = montarVista();
        await flushPromises();

        const afiliadoSelect = vista.find('#affiliate_uuid');
        expect(afiliadoSelect.exists()).toBe(true);
        expect(afiliadoSelect.element.value).toBe('afiliado-1');
    });

    it('licencia sin owner_driver deja el campo vacío sin romper la carga', async () => {
        mockLicencias[0].owner_driver = undefined;
        const vista = montarVista();
        await flushPromises();

        const afiliadoSelect = vista.find('#affiliate_uuid');
        expect(afiliadoSelect.exists()).toBe(true);
        expect(afiliadoSelect.element.value).toBe('');
    });
});
