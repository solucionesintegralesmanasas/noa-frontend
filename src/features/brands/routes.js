export const brandsRoutes = [
    {
        path: '/configuracion/marcas',
        name: 'brands.list',
        component: () => import('./views/BrandsListView.vue'),
        meta: {
            title: 'Marcas',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['brands.index'],
        },
    },
    {
        path: '/configuracion/marcas/crear',
        name: 'brands.create',
        component: () => import('./views/BrandsFormView.vue'),
        meta: {
            title: 'Crear marca',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['brands.create'],
        },
    },
    {
        path: '/configuracion/marcas/editar/:id',
        name: 'brands.edit',
        component: () => import('./views/BrandsFormView.vue'),
        meta: {
            title: 'Editar marca',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['brands.update'],
        },
    },
];
