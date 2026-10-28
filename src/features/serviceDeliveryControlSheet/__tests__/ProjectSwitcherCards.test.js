// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ProjectSwitcherCards from '../components/ProjectSwitcherCards.vue';

const sampleProjects = [
    {
        uuid: 'p-1',
        project_name: 'PROYECTO PRUEBA',
        start_date: '2026-10-01',
        completion_date: '2026-10-31',
        assignments_count: 28,
        summary: {
            total_planillas: 56,
            total_dias: 28,
            cerrados: 20,
            en_curso: 4,
            evidencia_incompleta: 4,
            certificados: 18,
            excepciones: 0,
            porcentaje_al_dia: 75,
        }
    },
    {
        uuid: 'p-2',
        project_name: 'MINERA LOS ANDES',
        start_date: '2026-10-01',
        completion_date: '2026-10-31',
        assignments_count: 64,
        summary: {
            total_planillas: 128,
            total_dias: 64,
            cerrados: 58,
            en_curso: 6,
            evidencia_incompleta: 0,
            certificados: 58,
            excepciones: 0,
            porcentaje_al_dia: 100,
        }
    }
];

describe('ProjectSwitcherCards', () => {
    it('renderiza las tarjetas de proyectos con sus métricas y porcentajes', () => {
        const wrapper = mount(ProjectSwitcherCards, {
            props: {
                projects: sampleProjects,
                selectedProjectUuid: 'p-1',
                canCreateProject: true,
            }
        });

        expect(wrapper.text()).toContain('PROYECTO PRUEBA');
        expect(wrapper.text()).toContain('MINERA LOS ANDES');
        expect(wrapper.text()).toContain('28 veh.');
        expect(wrapper.text()).toContain('64 veh.');
        expect(wrapper.text()).toContain('75% al día');
        expect(wrapper.text()).toContain('100% al día');
    });

    it('marca la tarjeta seleccionada con la clase selected y borde primario', () => {
        const wrapper = mount(ProjectSwitcherCards, {
            props: {
                projects: sampleProjects,
                selectedProjectUuid: 'p-1',
            }
        });

        const cards = wrapper.findAll('.project-card');
        expect(cards[0].classes()).toContain('selected');
        expect(cards[1].classes()).not.toContain('selected');
    });

    it('emite el evento select al hacer clic en una tarjeta', async () => {
        const wrapper = mount(ProjectSwitcherCards, {
            props: {
                projects: sampleProjects,
                selectedProjectUuid: 'p-1',
            }
        });

        const cards = wrapper.findAll('.project-card');
        await cards[1].trigger('click');

        expect(wrapper.emitted('select')).toBeTruthy();
        expect(wrapper.emitted('select')[0]).toEqual(['p-2']);
    });

    it('emite create-project al pulsar el botón Agregar Proyecto', async () => {
        const wrapper = mount(ProjectSwitcherCards, {
            props: {
                projects: sampleProjects,
                canCreateProject: true,
            }
        });

        const btn = wrapper.find('button[title="Crear un nuevo proyecto"]');
        expect(btn.exists()).toBe(true);
        await btn.trigger('click');

        expect(wrapper.emitted('create-project')).toBeTruthy();
    });
});
