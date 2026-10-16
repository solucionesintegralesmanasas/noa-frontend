export const inspectionItemsRoutes = [
    {
        path: '/configuracion/items-inspeccion',
        name: 'inspectionItems.list',
        component: () => import('./views/InspectionItemsListView.vue'),
        meta: {
            title: 'Listado',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['inspection_items.index'],
        },
    },
    {
        path: '/configuracion/items-inspeccion/crear',
        name: 'inspectionItems.create',
        component: () => import('./views/InspectionItemsFormView.vue'),
        meta: {
            title: 'Crear',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['inspection_items.create'],
        },
    },
    {
        path: '/configuracion/items-inspeccion/editar/:id',
        name: 'inspectionItems.edit',
        component: () => import('./views/InspectionItemsFormView.vue'),
        meta: {
            title: 'Editar',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['inspection_items.update'],
        },
    },
];
