export const vehicleClassesRoutes = [
    {
        path: '/configuracion/clases-vehiculos',
        name: 'vehicleClasses.list',
        component: () => import('./views/VehicleClassesListView.vue'),
        meta: {
            title: 'Clases de Vehículos',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['vehicle_classes.index'],
        },
    },
    {
        path: '/configuracion/clases-vehiculos/crear',
        name: 'vehicleClasses.create',
        component: () => import('./views/VehicleClassesFormView.vue'),
        meta: {
            title: 'Crear',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['vehicle_classes.create'],
        },
    },
    {
        path: '/configuracion/clases-vehiculos/editar/:id',
        name: 'vehicleClasses.edit',
        component: () => import('./views/VehicleClassesFormView.vue'),
        meta: {
            title: 'Editar',
            auth: true,
            roles: ['SUPERADMIN', 'ADMINISTRADOR', 'ADMIN_EMPRESA'],
            any: true,
            layout: 'dashboard',
            permissions: ['vehicle_classes.update'],
        },
    },
];
