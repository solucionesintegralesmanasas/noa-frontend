export const rentalContractsRoutes = [
    {
        path: '/alquiler-vehiculos',
        name: 'rentalContracts.list',
        component: () => import('./views/RentalContractsListView.vue'),
        meta: {
            title: 'Control de Alquiler de Vehículos',
            auth: true,
            layout: 'dashboard',
            permissions: ['rental_contracts.index'],
        },
    },
    {
        path: '/alquiler-vehiculos/crear',
        name: 'rentalContracts.create',
        component: () => import('./views/RentalContractsFormView.vue'),
        meta: {
            title: 'Crear Contrato de Alquiler',
            auth: true,
            layout: 'dashboard',
            permissions: ['rental_contracts.create'],
        },
    },
    {
        path: '/alquiler-vehiculos/:id',
        name: 'rentalContracts.detail',
        component: () => import('./views/RentalContractsDetailView.vue'),
        meta: {
            title: 'Detalle de Contrato de Alquiler',
            auth: true,
            layout: 'dashboard',
            permissions: ['rental_contracts.show'],
        },
    },
];
