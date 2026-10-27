export const serviceDeliveryControlSheetRoutes = [
    {
        path: '/planilla-de-control-de-prestacion-servicios',
        name: 'serviceDeliveryControlSheet.list',
        component: () => import('./views/ServiceDeliveryControlSheetListView.vue'),
        meta: {
            title: 'Listado',
            auth: true,
            layout: 'dashboard',
            permissions: ['service_delivery_control_sheets.index'],
        },
    },
    {
        path: '/planilla-de-control-de-prestacion-servicios/crear',
        redirect: '/planilla-de-control-de-prestacion-servicios/control-de-servicios',
    },
    {
        path: '/planilla-de-control-de-prestacion-servicios/editar/:id',
        redirect: '/planilla-de-control-de-prestacion-servicios',
    },
    {
        path: '/planilla-de-control-de-prestacion-servicios/control-de-servicios',
        name: 'serviceDeliveryControlSheet.internal-control',
        component: () => import('./views/ServiceTemplateView.vue'),
        meta: {
            title: 'Control en Ruta',
            auth: true,
            layout: 'dashboard',
            permissions: ['service_delivery_control_sheets.index'],
        },
    }
];
