// @vitest-environment jsdom
// Un conductor que ya existe en la empresa no se vuelve a crear: al salir del
// documento se detecta y el formulario pasa a modo vínculo. Al guardar solo se
// llama al endpoint de vínculo, nunca a createItem.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ThirdPartiesFormView from '../views/ThirdPartiesFormView.vue';

const mocks = vi.hoisted(() => ({
    linkDriver: vi.fn(async () => ({ data: { data: { uuid: 'conductor-1' } } })),
    createItem: vi.fn(async () => ({ uuid: 'nuevo' })),
    driverLookup: vi.fn(async () => ({
        data: {
            encontrado: true,
            es_conductor: true,
            uuid: 'conductor-1',
            document_number: '1090555999',
            first_name: 'ANA',
            last_name: 'PEREZ',
            is_active: true,
            vinculado_al_afiliado: false,
            licencia: { number: '1090555999', category: 'C1', expiration_date: '2030-01-01', status: 'ACTIVA' },
        },
    })),
}));

const PrimeMultiSelect = {
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'inputId'],
    emits: ['update:modelValue'],
    computed: {
        normalizadas() {
            return (this.options ?? []).map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
        },
    },
    template: `<select :id="inputId" @change="$emit('update:modelValue', [$event.target.value])">
        <option value="">—</option>
        <option v-for="o in normalizadas" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>`,
};

const PrimeSelect = {
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'inputId', 'placeholder'],
    emits: ['update:modelValue'],
    computed: {
        normalizadas() {
            return (this.options ?? []).map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
        },
        valorVisible() { return this.modelValue ?? ''; },
    },
    template: `<select :id="inputId" @change="$emit('update:modelValue', $event.target.value)">
        <option value="">—</option>
        <option v-for="o in normalizadas" :key="o.value ?? o.uuid" :value="o.value ?? o.uuid">{{ o.label ?? o.name }}</option>
    </select>`,
};

vi.mock('vue-router', () => ({
    useRouter: () => ({ push: vi.fn() }),
    useRoute: () => ({ params: {}, query: {}, path: '/terceros/conductor/crear', fullPath: '/terceros/conductor/crear' }),
}));
vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));
vi.mock('@/utils/logger.js', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('../services/thirdParties.service.js', () => ({
    default: { checkEmail: vi.fn(async () => ({ data: { en_uso: false } })), driverLookup: mocks.driverLookup, linkDriver: mocks.linkDriver },
}));
vi.mock('../store/thirdParties.store.js', () => ({
    useThirdPartiesStore: vi.fn(() => ({
        loadFormOptions: vi.fn(async () => {}),
        loadBranches: vi.fn(async () => {}),
        createItem: mocks.createItem,
        linkDriver: mocks.linkDriver,
        updateItem: vi.fn(async () => ({})),
        catalogs: {
            documentTypes: [{ uuid: 'doc-cc', name: 'CC' }],
            cities: [{ uuid: 'ciudad-1', name: 'Cali' }],
            branches: [{ uuid: 'sede-1', name: 'Sede Principal', company_uuid: 'empresa-1', status: 1, is_primary: 1 }],
            taxResponsibilities: [{ uuid: 'resp-1', name: 'R-99-PN' }],
            roles: [],
        },
    })),
}));
vi.mock('@store', () => ({
    usePermissionsStore: () => ({ roles: ['AFILIADO'], hasRole: (rol) => rol === 'AFILIADO' }),
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
            DateInput: true,
        },
    },
});

describe('vinculación de un conductor existente', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('muestra el panel de vínculo y guarda solo el vínculo', async () => {
        const vista = montarVista();
        await flushPromises();

        await vista.find('#f-partyTypes').setValue('is_driver');
        await vista.find('#document_number').setValue('1090555999');
        await vista.find('#document_number').trigger('blur');
        await flushPromises();

        expect(mocks.driverLookup).toHaveBeenCalledWith('1090555999', null);
        expect(vista.text()).toContain('Este conductor ya está registrado en la empresa');
        expect(vista.find('#document_number').exists()).toBe(false);

        await vista.find('form').trigger('submit');
        await flushPromises();

        expect(mocks.linkDriver).toHaveBeenCalledWith('conductor-1', null);
        expect(mocks.createItem).not.toHaveBeenCalled();
    });
});
