export const vehicleActivityReportsRoutes = [
    {
        path: '/reportes/actividad-vehicular',
        name: 'reports.vehicleActivity',
        component: () => import('./views/VehicleActivityReportView.vue'),
        meta: {
            title: 'Reporte de actividad vehicular',
            auth: true,
            layout: 'dashboard',
            permissions: ['reports.vehicle_activity.index'],
        },
    },
];
