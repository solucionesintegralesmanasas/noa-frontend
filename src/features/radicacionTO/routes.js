export const radicacionTORoutes = [
  {
    path: '/radicacion',
    name: 'radicacion.list',
    component: () => import('./views/RadicacionListView.vue'),
    meta: { title: 'Radicación de tarjeta de operación', auth: true, layout: 'dashboard', permissions: ['radicacion_to.index'] },
  },
  {
    path: '/radicacion/nuevo',
    name: 'radicacion.create',
    component: () => import('./views/RadicacionFormView.vue'),
    meta: { title: 'Nuevo trámite', auth: true, layout: 'dashboard', permissions: ['radicacion_to.create'] },
  },
  {
    path: '/radicacion/:uuid',
    name: 'radicacion.wizard',
    component: () => import('./views/RadicacionWizardView.vue'),
    meta: { title: 'Expediente TO', auth: true, layout: 'dashboard', permissions: ['radicacion_to.index'] },
  },
  {
    path: '/firmar-contrato/:token',
    name: 'radicacion.firmar',
    component: () => import('./views/FirmaContratoPublicView.vue'),
    meta: { title: 'Firma de contrato', public: true, layout: 'auth' },
  },
];
