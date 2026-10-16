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
];
