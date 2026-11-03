// @vitest-environment jsdom
// Issue #9: los datos de nacimiento y cédula (lugar y fecha de nacimiento,
// lugar y fecha de expedición, sexo, estado civil y grupo sanguíneo) aparecen
// solo para personas NATURALES, son opcionales (solo se valida el rango de
// las fechas cuando se diligencian) y viajan en el payload al guardar.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ThirdPartiesFormView from '../views/ThirdPartiesFormView.vue';

/**
 * PrimeSelect devuelto como <select> nativo interactivo: permite cambiar el
 * tipo de persona y los datos de cédula con eventos reales del DOM.
 */
const PrimeSelect = {
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'inputId', 'placeholder'],
    emits: ['update:modelValue'],
    computed: {
        normalizadas() {
            return (this.options ?? []).map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
        },
        valorVisible() {
            return this.modelValue ?? '';
        },
    },
    template: `<select :id="inputId" @change="$emit('update:modelValue', $event.target.value)">
        <option value="">—</option>
        <option v-for="o in normalizadas" :key="o.value ?? o.uuid" :value="o.value ?? o.uuid">{{ o.label ?? o.name }}</option>
    </select>`,
};

const DateInput = {
    props: ['modelValue', 'id', 'invalid'],
    emits: ['update:modelValue'],
    template: `<input :id="id" type="date" :aria-invalid="invalid ? 'true' : undefined"
        :value="modelValue ?? ''" @input="$emit('update:modelValue', $event.target.value)" />`,
};

/** PrimeMultiSelect devuelto como <select> emisor de un array de valores. */
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

const createItem = vi.fn(async (payload) => ({ ...payload, uuid: 'nuevo-tercero' }));
const updateItem = vi.fn(async () => ({}));

vi.mock('vue-router', () => ({
    useRouter: () => ({ push: vi.fn() }),
    useRoute: () => ({ params: {}, query: {}, path: '/terceros', fullPath: '/terceros' }),
}));
vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));
vi.mock('@/utils/logger.js', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('../services/thirdParties.service.js', () => ({
    default: { checkEmail: vi.fn(async () => ({ data: { exists: false } })) },
}));
vi.mock('../store/thirdParties.store.js', () => ({
    useThirdPartiesStore: vi.fn(() => ({
        loadFormOptions: vi.fn(async () => {}),
        loadBranches: vi.fn(async () => {}),
        createItem,
        updateItem,
        catalogs: {
            documentTypes: [{ uuid: 'doc-cc', name: 'CC' }],
            cities: [
                { uuid: 'ciudad-1', name: 'Buenaventura' },
                { uuid: 'ciudad-2', name: 'Pasto' },
            ],
            branches: [
                { uuid: 'sede-1', name: 'Sede Principal', company_uuid: 'empresa-1', status: 1, is_primary: 1 },
            ],
            taxResponsibilities: [{ uuid: 'resp-1', name: 'R-99-PN' }],
            roles: [],
        },
    })),
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

/** El selector de tipo de persona es el primer PrimeSelect del formulario. */
const selectorTipoPersona = (vista) => vista.findAll('select').find((s) => s.attributes('id') === 'person_type');

/** Identificador de error accesible por campo (f-<campo>-error). */
const errorDe = (vista, campo) => vista.find(`#f-${campo}-error`);

/** Los siete datos opcionales de nacimiento y cédula del formulario. */
const CAMPOS_DATOS_PERSONA = [
    'birth_place_uuid',
    'birth_date',
    'id_card_issue_place_uuid',
    'id_card_issue_date',
    'sex',
    'marital_status',
    'blood_type',
];

/** Cambia un PrimeSelect/prime nativo del formulario por su id. */
const setSelectValue = async (vista, id, value) => {
    const el = vista.findAll('select').find((s) => s.attributes('id') === id);
    if (!el) throw new Error(`no hay select con id ${id}`);
    await el.setValue(value);
};

/** Solo los campos obligatorios del flujo (sin datos de nacimiento ni cédula). */
const llenarBaseNatural = async (vista) => {
    await selectorTipoPersona(vista).setValue('NATURAL');
    await vista.find('#document_type_uuid').setValue('doc-cc');
    await vista.find('#document_number').setValue('1090555999');
    await vista.find('#first_name').setValue('ANA');
    await vista.find('#last_name').setValue('RESTREPO');
    await vista.find('#email').setValue('ana.test@tercero.local');

    const selects = vista.findAll('select');
    if (selects.some((s) => s.attributes('id') === 'municipality_uuid')) {
        await setSelectValue(vista, 'municipality_uuid', 'ciudad-1');
        await setSelectValue(vista, 'tax_responsibility_uuid', 'resp-1');
        await setSelectValue(vista, 'tax_regime', '48');
        await setSelectValue(vista, 'branch_uuid', 'sede-1');
        await setSelectValue(vista, 'f-partyTypes', 'is_customer');
    }
};

const llenarPersonaNatural = async (vista) => {
    await llenarBaseNatural(vista);
    await setSelectValue(vista, 'f-birth_place_uuid', 'ciudad-1');
    const fechaNacimiento = vista.find('#f-birth_date');
    await fechaNacimiento.setValue('1985-04-12');
    await setSelectValue(vista, 'f-id_card_issue_place_uuid', 'ciudad-1');
    await setSelectValue(vista, 'f-sex', 'F');
    await setSelectValue(vista, 'f-marital_status', 'SOLTERO');
    await setSelectValue(vista, 'f-blood_type', 'O+');

    const fecha = vista.find('#f-id_card_issue_date');
    await fecha.setValue('2005-06-15');
};

describe('datos de persona en el formulario de terceros (issue #9)', () => {
    beforeEach(() => {
        createItem.mockClear();
        updateItem.mockClear();
    });

    it('una persona natural ve los siete campos, todos opcionales y sin error al enviarlos vacíos', async () => {
        const vista = montarVista();
        await flushPromises();
        await selectorTipoPersona(vista).setValue('NATURAL');

        for (const campo of CAMPOS_DATOS_PERSONA) {
            const etiqueta = vista.find(`label[for="f-${campo}"]`);
            expect(etiqueta.exists()).toBe(true);
            // Ninguno va marcado como obligatorio.
            expect(etiqueta.classes()).not.toContain('required');
            expect(vista.find(`#f-${campo}`).exists()).toBe(true);
        }

        // Enviar sin diligenciarlos no genera errores en estos campos.
        await vista.find('#document_number').setValue('1090555999');
        await vista.find('#email').setValue('ana.test@tercero.local');
        await vista.find('form').trigger('submit');
        await flushPromises();

        for (const campo of CAMPOS_DATOS_PERSONA) {
            expect(errorDe(vista, campo).exists()).toBe(false);
        }
    });

    it('una persona natural puede guardarse sin los datos de nacimiento y cédula', async () => {
        const vista = montarVista();
        await flushPromises();
        await llenarBaseNatural(vista);

        await vista.find('form').trigger('submit');
        await flushPromises();

        expect(createItem).toHaveBeenCalledTimes(1);
        const payload = createItem.mock.calls[0][0];
        expect(payload.birth_place_uuid).toBeNull();
        expect(payload.birth_date).toBeNull();
        expect(payload.id_card_issue_place_uuid).toBeNull();
        expect(payload.id_card_issue_date).toBeNull();
        expect(payload.sex).toBeNull();
        expect(payload.marital_status).toBeNull();
        expect(payload.blood_type).toBeNull();
    });

    it('una persona juridica no ve los campos de cédula y guarda sin ellos', async () => {
        const vista = montarVista();
        await flushPromises();
        await selectorTipoPersona(vista).setValue('JURIDICA');

        expect(vista.find('label[for="f-birth_place_uuid"]').exists()).toBe(false);
        expect(vista.find('label[for="f-birth_date"]').exists()).toBe(false);
        expect(vista.find('label[for="f-id_card_issue_place_uuid"]').exists()).toBe(false);
        expect(vista.find('label[for="f-sex"]').exists()).toBe(false);
        expect(vista.find('label[for="f-marital_status"]').exists()).toBe(false);
        expect(vista.find('label[for="f-blood_type"]').exists()).toBe(false);
    });

    it('el payload de creación lleva los datos de persona', async () => {
        const vista = montarVista();
        await flushPromises();
        await llenarPersonaNatural(vista);

        await vista.find('form').trigger('submit');
        await flushPromises();

        expect(createItem).toHaveBeenCalledTimes(1);
        const payload = createItem.mock.calls[0][0];
        expect(payload.birth_place_uuid).toBe('ciudad-1');
        expect(payload.birth_date).toBe('1985-04-12');
        expect(payload.id_card_issue_place_uuid).toBe('ciudad-1');
        expect(payload.id_card_issue_date).toBe('2005-06-15');
        expect(payload.sex).toBe('F');
        expect(payload.marital_status).toBe('SOLTERO');
        expect(payload.blood_type).toBe('O+');
    });

    it('una fecha de expedición futura se rechaza en la validación local y pone foco en el error', async () => {
        const vista = montarVista();
        await flushPromises();
        await llenarPersonaNatural(vista);

                const futura = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        await vista.find('#f-id_card_issue_date').setValue(futura);

        await vista.find('form').trigger('submit');
        await flushPromises();

        expect(createItem).not.toHaveBeenCalled();
        const errorFecha = errorDe(vista, 'id_card_issue_date');
        expect(errorFecha.attributes('id')).toBe('f-id_card_issue_date-error');
        expect(errorFecha.attributes('role')).toBe('alert');
        expect(errorFecha.text()).toContain('no puede ser posterior a hoy');
        expect(document.activeElement?.id).toBe('f-id_card_issue_date');
    });

    it('conmutar a persona jurídica limpia los datos de cédula en el payload', async () => {
        const vista = montarVista();
        await flushPromises();
        await llenarPersonaNatural(vista);

        // Cambiar a persona jurídica y completar razón social
        await selectorTipoPersona(vista).setValue('JURIDICA');
        await vista.find('#company_name').setValue('TRANSPORTE Y LOGISTICA SAS');

        await vista.find('form').trigger('submit');
        await flushPromises();

        expect(createItem).toHaveBeenCalledTimes(1);
        const payload = createItem.mock.calls[0][0];
        expect(payload.birth_place_uuid).toBeNull();
        expect(payload.birth_date).toBeNull();
        expect(payload.id_card_issue_place_uuid).toBeNull();
        expect(payload.id_card_issue_date).toBeNull();
        expect(payload.sex).toBeNull();
        expect(payload.marital_status).toBeNull();
        expect(payload.blood_type).toBeNull();
    });
});
