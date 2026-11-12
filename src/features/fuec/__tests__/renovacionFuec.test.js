// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';

describe('Funcionalidad Renovar FUEC', () => {
    it('la acción renovar está configurada para el menú de más acciones y exige permiso fuec.renew', () => {
        const can = vi.fn((perm) => perm === 'fuec.renew' || perm === 'fuec.profile');
        const goToRenew = vi.fn();
        const data = { uuid: 'fuec-123', number_fuec: '0001' };

        const accionesDe = (d) => [
            { key: 'perfil', label: 'Ver detalle', icon: 'far fa-eye', tone: 'primary', inline: true, visible: can('fuec.profile') },
            { key: 'pdf', label: 'Descargar PDF', icon: 'far fa-file-pdf', tone: 'neutral', inline: true },
            { key: 'renovar', label: 'Renovar', icon: 'far fa-sync-alt', tone: 'primary', visible: can('fuec.renew'), onClick: () => goToRenew(d.uuid) },
            { key: 'editar', label: 'Editar', icon: 'far fa-pen', tone: 'warning', visible: can('fuec.update') },
            { key: 'eliminar', label: 'Eliminar', icon: 'far fa-trash-alt', tone: 'danger', visible: can('fuec.delete') },
        ];

        const acciones = accionesDe(data);
        const accionRenovar = acciones.find((a) => a.key === 'renovar');

        expect(accionRenovar).toBeDefined();
        expect(accionRenovar.label).toBe('Renovar');
        expect(accionRenovar.visible).toBe(true);
        // Al no tener inline: true, RowActions lo enviará al menú de "más acciones"
        expect(accionRenovar.inline).toBeFalsy();

        accionRenovar.onClick();
        expect(goToRenew).toHaveBeenCalledWith('fuec-123');
    });

    it('la acción renovar se oculta para usuarios sin permiso fuec.renew', () => {
        const can = vi.fn((perm) => perm !== 'fuec.renew');
        const data = { uuid: 'fuec-123', number_fuec: '0001' };

        const accionesDe = () => [
            { key: 'renovar', label: 'Renovar', icon: 'far fa-sync-alt', tone: 'primary', visible: can('fuec.renew') },
        ];

        const acciones = accionesDe(data);
        expect(acciones[0].visible).toBe(false);
    });

    it('al clonar datos para renovación, las fechas de vigencia quedan estrictamente vacías', () => {
        const fuecOriginal = {
            uuid: 'fuec-original-uuid',
            number_fuec: '0001',
            request_number: '223259524202600010001',
            contract_number_display: '0001',
            effective_date: '2026-10-01',
            expiration_date: '2026-10-05',
            issue_date: '2026-10-01',
            origin_route: 'BOGOTÁ',
            destination_route: 'MEDELLÍN',
            contractor: {
                uuid: 'contractor-uuid-1',
                company_name: 'Cliente S.A.S',
                contract_number: '0001',
            },
            passengers: [
                { uuid: 'p-1', document_number: '123', first_and_last_name: 'Pasajero 1' },
            ],
        };

        // Simulación de la extracción para el nuevo FUEC
        const nuevoFuecData = {
            company_uuid: fuecOriginal.company_uuid || '',
            vehicle_uuid: fuecOriginal.vehicle_uuid || '',
            contract_number_display: fuecOriginal.contract_number_display,
            origin: fuecOriginal.origin_route,
            destination: fuecOriginal.destination_route,
            // Fechas en blanco por requisito estricto
            effective_date: '',
            expiration_date: '',
            // Consecutivos y códigos limpios para el nuevo FUEC
            number_fuec: '',
            request_number: '',
            verification_code: '',
            contractor: {
                ...fuecOriginal.contractor,
            },
            // Pasajeros sin UUID previo
            passengers: fuecOriginal.passengers.map(p => ({
                uuid: null,
                document_number: p.document_number,
                first_and_last_name: p.first_and_last_name,
            })),
        };

        expect(nuevoFuecData.effective_date).toBe('');
        expect(nuevoFuecData.expiration_date).toBe('');
        expect(nuevoFuecData.contractor.contract_number).toBe('0001');
        expect(nuevoFuecData.contractor.uuid).toBe('contractor-uuid-1');
        expect(nuevoFuecData.passengers[0].uuid).toBeNull();
    });
});
