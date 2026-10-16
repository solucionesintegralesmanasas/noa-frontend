export const withholdingsRoutes = [
    {
        path: '/configuracion/retenciones',
        name: 'withholdings.list',
        component: () => import('./views/WithholdingsListView.vue'),
        meta: {
            title: 'Listado',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['withholdings.index'],
        },
    },
    {
        path: '/configuracion/retenciones/crear',
        name: 'withholdings.create',
        component: () => import('./views/WithholdingsFormView.vue'),
        meta: {
            title: 'Crear',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['withholdings.create'],
        },
    },
    {
        path: '/configuracion/retenciones/editar/:id',
        name: 'withholdings.edit',
        component: () => import('./views/WithholdingsFormView.vue'),
        meta: {
            title: 'Editar',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['withholdings.update'],
        },
    },
];
