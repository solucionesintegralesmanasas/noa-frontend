// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ServiceReportsDialog from '../components/ServiceReportsDialog.vue';

const mockLoadProjectDetail = vi.fn();
const mockDownloadReport = vi.fn();

vi.mock('../store/serviceDeliveryControlSheet.store.js', () => ({
    useServiceDeliveryControlSheetStore: () => ({
        projects: [
            { uuid: 'proj-1', project_name: 'PROYECTO NORTE', start_date: '2026-10-01', completion_date: '2026-10-31' },
            { uuid: 'proj-2', project_name: 'PROYECTO SUR', start_date: '2026-11-01', completion_date: '2026-11-30' },
        ],
        projectsOverview: [],
        loadProjectDetail: mockLoadProjectDetail,
        downloadReport: mockDownloadReport,
    }),
}));

describe('ServiceReportsDialog - Reporte por Proyecto', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createWrapper = (props = {}) => mount(ServiceReportsDialog, {
        props: {
            visible: true,
            vehicles: [
                { uuid: 'v-general-1', vehicle_license_plate: 'GEN111' },
                { uuid: 'v-general-2', vehicle_license_plate: 'GEN222' },
            ],
            drivers: [
                { uuid: 'd-1', first_name: 'Carlos', last_name: 'Pérez' },
            ],
            ...props,
        },
        global: {
            stubs: {
                Dialog: {
                    template: '<div class="dialog-stub"><slot name="header"></slot><slot></slot></div>',
                },
                PrimeSelect: {
                    name: 'PrimeSelect',
                    props: ['modelValue', 'options'],
                    emits: ['update:modelValue'],
                    template: '<select class="prime-select-stub" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option></select>',
                },
                DateInput: {
                    name: 'DateInput',
                    props: ['modelValue'],
                    template: '<input type="text" class="date-input-stub" :value="modelValue" />',
                },
            },
        },
    });

    it('incluye el tipo de reporte "Por proyecto" entre las opciones disponibles', () => {
        const wrapper = createWrapper();
        const selectTipo = wrapper.find('.prime-select-stub');
        const options = selectTipo.findAll('option');
        const labels = options.map((o) => o.text());

        expect(labels.some((l) => l.includes('Por proyecto'))).toBe(true);
    });

    it('al seleccionar tipo "proyecto", muestra el selector de proyecto y carga solo los vehículos de ese proyecto', async () => {
        mockLoadProjectDetail.mockResolvedValue({
            uuid: 'proj-1',
            assignments: [
                {
                    vehicle_uuid: 'v-proj-1',
                    is_active: true,
                    vehicle: { uuid: 'v-proj-1', vehicle_license_plate: 'PRJ100', internal_number: '10' },
                },
                {
                    vehicle_uuid: 'v-proj-2',
                    is_active: true,
                    vehicle: { uuid: 'v-proj-2', vehicle_license_plate: 'PRJ200', internal_number: '20' },
                },
            ],
        });

        const wrapper = createWrapper();

        // 1. Cambiar tipo a "proyecto"
        await wrapper.find('.prime-select-stub').setValue('proyecto');
        await flushPromises();

        // 2. Verificar que el selector de proyecto aparece
        const selectProyecto = wrapper.find('#rep-proyecto');
        expect(selectProyecto.exists()).toBe(true);

        // 3. Seleccionar "proj-1"
        await selectProyecto.setValue('proj-1');
        await flushPromises();

        // 4. Verificar que se llamó a loadProjectDetail con 'proj-1'
        expect(mockLoadProjectDetail).toHaveBeenCalledWith('proj-1');

        // 5. Verificar que el selector de vehículos contiene ÚNICAMENTE los vehículos de proj-1
        const selectVeh = wrapper.find('#rep-veh');
        const vehOptions = selectVeh.findAll('option').map((o) => o.text());

        expect(vehOptions).toContain('Todos los vehículos del proyecto');
        expect(vehOptions.some((o) => o.includes('PRJ100 (10)'))).toBe(true);
        expect(vehOptions.some((o) => o.includes('PRJ200 (20)'))).toBe(true);
        expect(vehOptions.some((o) => o.includes('GEN111'))).toBe(false);
        expect(vehOptions.some((o) => o.includes('GEN222'))).toBe(false);
    });

    it('al descargar el reporte por proyecto, envía project_uuid y vehicle_uuid si fue seleccionado', async () => {
        mockLoadProjectDetail.mockResolvedValue({
            uuid: 'proj-1',
            assignments: [
                {
                    vehicle_uuid: 'v-proj-1',
                    is_active: true,
                    vehicle: { uuid: 'v-proj-1', vehicle_license_plate: 'PRJ100' },
                },
            ],
        });

        const wrapper = createWrapper();
        await wrapper.find('.prime-select-stub').setValue('proyecto');
        await flushPromises();

        const selectProyecto = wrapper.find('#rep-proyecto');
        await selectProyecto.setValue('proj-1');
        await flushPromises();

        const selectVeh = wrapper.find('#rep-veh');
        await selectVeh.setValue('v-proj-1');
        await flushPromises();

        // Clic en botón PDF
        const btnPdf = wrapper.findAll('button').find((b) => b.text().includes('PDF'));
        await btnPdf.trigger('click');

        expect(mockDownloadReport).toHaveBeenCalledWith(
            'proyecto',
            expect.objectContaining({
                project_uuid: 'proj-1',
                vehicle_uuid: 'v-proj-1',
            }),
            'pdf'
        );
    });
});
