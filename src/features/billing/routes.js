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
        path: '/facturacion/resoluciones',
        name: 'billing.resolutions',
        component: () => import('./views/BillingResolutionsView.vue'),
        meta: {
            title: 'Resoluciones de Facturación',
            auth: true,
            layout: 'dashboard',
            permissions: ['billing_resolutions.index'],
        },
    },
    {
        path: '/facturacion/proveedores',
        name: 'billing.providers',
        component: () => import('./views/BillingProvidersView.vue'),
        meta: {
            title: 'Proveedores de Facturación',
            auth: true,
            layout: 'dashboard',
            permissions: ['billing_providers.index'],
        },
    },
    {
        path: '/facturacion/documentos-electronicos',
        name: 'billing.electronic-documents',
        component: () => import('./views/ElectronicDocumentsView.vue'),
        meta: {
            title: 'Documentos Electrónicos',
            auth: true,
            layout: 'dashboard',
            permissions: ['electronic_documents.index'],
        },
    },
    {
        path: '/facturacion/configuracion',
        name: 'billing.config',
        component: () => import('./views/BillingProviderConfigView.vue'),
        meta: {
            title: 'Configuración ApiDian',
            auth: true,
            layout: 'dashboard',
            permissions: ['billing_providers.update'],
        },
    },
    {
        path: '/facturacion/proveedores/:uuid/configuracion',
        name: 'billing.provider.config',
        component: () => import('./views/BillingProviderConfigView.vue'),
        meta: {
            title: 'Configuración ApiDian',
            auth: true,
            layout: 'dashboard',
            permissions: ['billing_providers.update'],
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
