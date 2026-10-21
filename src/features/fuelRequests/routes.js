export const fuelRequestsRoutes = [
    {
        path: '/flota/solicitudes-tanqueo',
        name: 'fuelRequests.list',
        component: () => import('./views/FuelRequestListView.vue'),
        meta: {
            title: 'Solicitudes de tanqueo',
            auth: true,
            layout: 'dashboard',
            permissions: ['fuel_requests.index'],
        },
    },
];
