export const fuelManagementRoutes = [
    {
        path: '/flota/combustible',
        name: 'fuelManagement.list',
        component: () => import('./views/FuelLogListView.vue'),
        meta: {
            title: 'Control de Combustible',
            auth: true,
            layout: 'dashboard',
            permissions: ['fuel_logs.index'],
        },
    },
    {
        path: '/flota/combustible/crear',
        name: 'fuelManagement.create',
        component: () => import('./views/FuelLogFormView.vue'),
        meta: {
            title: 'Nuevo Registro de Combustible',
            auth: true,
            layout: 'dashboard',
            permissions: ['fuel_logs.create'],
        },
    },
    {
        path: '/flota/combustible/editar/:id',
        name: 'fuelManagement.edit',
        component: () => import('./views/FuelLogFormView.vue'),
        meta: {
            title: 'Editar Registro de Combustible',
            auth: true,
            layout: 'dashboard',
            permissions: ['fuel_logs.update'],
        },
    },
];
