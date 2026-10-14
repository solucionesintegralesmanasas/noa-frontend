export const billingRoutes = [
    {
        path: '/facturacion',
        name: 'billing.list',
        component: () => import('./views/BillingListView.vue'),
        meta: {
            title: 'Facturación',
            auth: true,
            layout: 'dashboard',
            permissions: ['commercial_invoices.index'],
        },
    },
    {
        path: '/facturacion/cotizaciones/nueva',
        name: 'billing.quotation.create',
        component: () => import('./views/BillingFormView.vue'),
        meta: {
            title: 'Nueva Cotización',
            auth: true,
            layout: 'dashboard',
            permissions: ['commercial_invoices.create'],
        },
    },
    {
        path: '/facturacion/facturas/nueva',
        name: 'billing.invoice.create',
        component: () => import('./views/BillingFormView.vue'),
        meta: {
            title: 'Nueva Factura Interna',
            auth: true,
            layout: 'dashboard',
            permissions: ['commercial_invoices.create'],
        },
    },
    {
        path: '/facturacion/editar/:id',
        name: 'billing.edit',
        component: () => import('./views/BillingFormView.vue'),
        meta: {
            title: 'Editar Documento',
            auth: true,
            layout: 'dashboard',
            permissions: ['commercial_invoices.update'],
        },
    },
    {
        path: '/facturacion/:id',
        name: 'billing.profile',
        component: () => import('./views/BillingDetailView.vue'),
        meta: {
            title: 'Detalle del Documento',
            auth: true,
            layout: 'dashboard',
            permissions: ['commercial_invoices.profile'],
        },
    },
];
