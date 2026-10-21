// El filtro por tercero de los GET solo debe inyectarse con el rol AFILIADO:
// un empleado con tercero vinculado (coordinador de sede) dejaba sus listados en 0
// porque los GET viajaban con su propio third_party_uuid (humo por roles 2026-10-20).
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BaseService } from '../base.service.js';

const { rolesRef } = vi.hoisted(() => ({ rolesRef: { valor: [] } }));

vi.mock('@store/modules/permissions.js', () => ({
    usePermissionsStore: () => ({ roles: rolesRef.valor, can: () => true }),
}));
vi.mock('@store/modules/user.js', () => ({
    useUserStore: () => ({
        third_party_uuid: 'tercero-vinculado',
        uuid_driver: '',
        company_uuid: 'empresa-1',
    }),
}));

const servicio = new BaseService({ resourcePath: 'fleet-management/vehicles' });

describe('BaseService.parametrosDeLectura (filtro de afiliado)', () => {
    beforeEach(() => {
        rolesRef.valor = [];
    });

    it('con rol AFILIADO inyecta su third_party_uuid', () => {
        rolesRef.valor = ['AFILIADO'];
        expect(servicio.parametrosDeLectura({ page: 1 })).toEqual({
            page: 1,
            third_party_uuid: 'tercero-vinculado',
        });
    });

    it('con roles combinados AFILIADO+CONDUCTOR también lo inyecta', () => {
        rolesRef.valor = ['AFILIADO', 'CONDUCTOR'];
        expect(servicio.parametrosDeLectura()).toEqual({ third_party_uuid: 'tercero-vinculado' });
    });

    it('un EMPLEADO (aun con tercero vinculado) NO inyecta el filtro', () => {
        rolesRef.valor = ['EMPLEADO', 'COORDINADOR_CALI'];
        expect(servicio.parametrosDeLectura({ page: 1 })).toEqual({ page: 1 });
    });

    it('un CONDUCTOR no lo inyecta: el backend ya impone su alcance', () => {
        rolesRef.valor = ['CONDUCTOR'];
        expect(servicio.parametrosDeLectura()).toEqual({});
    });
});
