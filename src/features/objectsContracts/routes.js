export const objectsContractsRoutes = [
    {
        path: '/configuracion/objetos-contrato',
        name: 'objectsContracts.list',
        component: () => import('./views/ObjectsContractsListView.vue'),
        meta: {
            title: 'Listado',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['objects_contracts.index'],
        },
    },
    {
        path: '/configuracion/objetos-contrato/crear',
        name: 'objectsContracts.create',
        component: () => import('./views/ObjectsContractsFormView.vue'),
        meta: {
            title: 'Crear',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['objects_contracts.create'],
        },
    },
    {
        path: '/configuracion/objetos-contrato/editar/:id',
        name: 'objectsContracts.edit',
        component: () => import('./views/ObjectsContractsFormView.vue'),
        meta: {
            title: 'Editar',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['objects_contracts.update'],
        },
    },
];
