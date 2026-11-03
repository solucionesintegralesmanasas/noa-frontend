export const vehicleReportsRoutes = [
    {
        path: '/reportes/vehiculos',
        name: 'reports.vehicles',
        component: () => import('./views/VehicleReportView.vue'),
        meta: {
            title: 'Reporte de vehículos',
            auth: true,
            layout: 'dashboard',
            permissions: ['reports.vehicles.index'],
        },
    },
    {
        path: '/reportes/calendario',
        name: 'reports.calendar',
        component: () => import('./views/ExpirationCalendarView.vue'),
        meta: {
            title: 'Calendario de vencimientos',
            auth: true,
            layout: 'dashboard',
            permissions: ['reports.vehicles.index'],
        },
    },
];
