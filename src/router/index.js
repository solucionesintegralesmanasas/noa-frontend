import { createRouter, createWebHashHistory } from 'vue-router'
import axios from 'axios'
import { useConfigStore } from '@store/modules/config.js'
import LoginView from '@/features/auth/views/LoginView.vue'
import LicenseView from '@/views/LicenciaView.vue'
import NotFoundView from '@/views/NotFound.vue'
import { authRoutes } from '@/features/auth/routes.js'
import { dashboardRoutes } from '@/features/dashboard/routes.js'
import { affiliateAdminChargesRoutes } from '@/features/affiliateAdminCharges/routes.js'
import { bankDetailsRoutes } from '@/features/bankDetails/routes.js'
import { billingRoutes } from '@/features/billing/routes.js'
import { branchesRoutes } from '@/features/branches/routes.js'
import { brandsRoutes } from '@/features/brands/routes.js'
import { businessCollaborationAgreementsRoutes } from '@/features/businessCollaborationAgreements/routes.js'
import { companyRoutes } from '@/features/companies/routes.js'
import { controlSheetsRoutes } from '@/features/controlSheets/routes.js'
import { conveyorCapacityRoutes } from '@/features/conveyorCapacity/routes.js'
import { economicActivitiesRoutes } from '@/features/economicactivity/routes.js'
import { enablingResolutionsRoutes } from '@/features/enablingResolutions/routes.js'
import { experiencesRoutes } from '@/features/experiences/routes.js'
import { financialStatementsRoutes } from '@/features/financialStatements/routes.js'
import { fuecRoutes } from '@/features/fuec/routes.js'
import { employmentContractsRoutes } from '@/features/humanResources/routes.js'
import { inspectionItemsRoutes } from '@/features/inspectionItems/routes.js'
import { maintenanceRoutes } from '@/features/maintenance/routes.js'
import { notificationsRoutes } from '@/features/notifications/routes.js'
import { objectsContractsRoutes } from '@/features/objectsContracts/routes.js'
import { operationCardsRoutes } from '@/features/operationCards/routes.js'
import { projectsRoutes } from '@/features/projects/routes.js'
import { radicacionTORoutes } from '@/features/radicacionTO/routes.js'
import { rupRecordsRoutes } from '@/features/rupRecords/routes.js'
import { serviceDeliveryControlSheetRoutes } from '@/features/serviceDeliveryControlSheet/routes.js'
import { systemConfigurationRoutes } from '@/features/systemConfiguration/routes.js'
import { taxDeclarationsRoutes } from '@/features/taxDeclarations/routes.js'
import { taxInformationRoutes } from '@/features/taxInformation/routes.js'
import { thirdPartiesRoutes } from '@/features/thirdParties/routes.js'
import { trackingRoutes } from '@/features/tracking/routes.js'
import { vehicleDocumentsRoutes } from '@/features/vehicleDocuments/routes.js'
import { vehicleInspectionsRoutes } from '@/features/vehicleInspections/routes.js'
import { vehicleReportsRoutes } from '@/features/vehicleReports/routes.js'
import { vehiclesRoutes } from '@/features/vehicles/routes.js'
import { vehicleClassesRoutes } from '@/features/vehicleClasses/routes.js'
import { withholdingsRoutes } from '@/features/withholdings/routes.js'
import { authGuard } from './guards/auth.js'
import { twoFAGuard } from './guards/2fa.js'
import { permissionsGuard } from './guards/permissions.js'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { layout: 'auth', public: true, guestOnly: true, title: 'Iniciar Sesión' }
  },
  {
    path: '/licencia',
    name: 'licencia',
    component: LicenseView,
    meta: { layout: 'dashboard', title: 'Licencia', requiresAuth: true, roles: ['ADMIN_EMPRESA'] }
  },
  ...authRoutes.filter((r) => r.path !== '/login'),
  ...dashboardRoutes,
  ...affiliateAdminChargesRoutes,
  ...bankDetailsRoutes,
  ...billingRoutes,
  ...branchesRoutes,
  ...brandsRoutes,
  ...businessCollaborationAgreementsRoutes,
  ...companyRoutes,
  ...controlSheetsRoutes,
  ...conveyorCapacityRoutes,
  ...economicActivitiesRoutes,
  ...enablingResolutionsRoutes,
  ...experiencesRoutes,
  ...financialStatementsRoutes,
  ...fuecRoutes,
  ...employmentContractsRoutes,
  ...inspectionItemsRoutes,
  ...maintenanceRoutes,
  ...notificationsRoutes,
  ...objectsContractsRoutes,
  ...operationCardsRoutes,
  ...projectsRoutes,
  ...radicacionTORoutes,
  ...rupRecordsRoutes,
  ...serviceDeliveryControlSheetRoutes,
  ...systemConfigurationRoutes,
  ...taxDeclarationsRoutes,
  ...taxInformationRoutes,
  ...thirdPartiesRoutes,
  ...trackingRoutes,
  ...vehicleDocumentsRoutes,
  ...vehicleInspectionsRoutes,
  ...vehicleReportsRoutes,
  ...vehiclesRoutes,
  ...vehicleClassesRoutes,
  ...withholdingsRoutes,
  {
    path: '/401',
    name: 'unauthorized',
    component: () => import('@/pages/errors/Error401.vue'),
    meta: { title: 'No autorizado' }
  },
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('@/pages/errors/Error403.vue'),
    meta: { title: 'Prohibido' }
  },
  {
    path: '/404',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: 'Página No Encontrada' }
  },
  {
    path: '/500',
    name: 'server-error',
    component: () => import('@/pages/errors/Error500.vue'),
    meta: { title: 'Error del servidor' }
  },
  {
    path: '/firma-documentos/:uuid',
    name: 'public.signature',
    component: () => import('@/pages/public/PublicSignatureView.vue'),
    meta: { layout: 'minimal', public: true, title: 'Firma Digital de Inspección' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const CHUNK_RELOAD_KEY = 'noa_chunk_reload'

function tryReloadOnChunkError(error) {
  if (typeof window === 'undefined') return false
  const msg = String(error?.message || error || '')
  const isChunkError =
    msg.includes('Unable to preload CSS') ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module')

  if (!isChunkError) return false

  try {
    const targetPath = window.location.hash || window.location.pathname
    const lastReload = sessionStorage.getItem(CHUNK_RELOAD_KEY)
    if (lastReload !== targetPath) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, targetPath)
      window.location.reload()
      return true
    }
  } catch {
    // Ignorar errores de sessionStorage
  }
  return false
}

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    if (tryReloadOnChunkError(event?.payload || new Error('Unable to preload CSS'))) {
      event.preventDefault?.()
    }
  })
}

// Puerta de licencia desactivada: ninguna ruta exige licencia.
// Para reactivarla, poner LICENSE_REQUIRED en true.
const LICENSE_REQUIRED = false

async function licenseGuard(to, from, next) {
  if (!LICENSE_REQUIRED) return next()
  if (to.name === 'license' || to.meta?.public) return next()
  const hasLicense = localStorage.getItem('license_accepted') === 'true'
  if (hasLicense) return next()
  const storedLicenseKey = localStorage.getItem('stored_license_key')
  if (storedLicenseKey) {
    try {
      const response = await axios.get('/api/v1/license/verify/' + encodeURIComponent(storedLicenseKey.trim()), {
        timeout: 5000
      })
      if (response.data.success && response.data.data.status === 'valid') {
        localStorage.setItem('license_accepted', 'true')
        axios.defaults.headers.common['X-License-Key'] = storedLicenseKey
        if (response.data.data.company_uuid) {
          localStorage.setItem('company_uuid_from_license', response.data.data.company_uuid)
          axios.defaults.headers.common['X-License-Company-Uuid'] = response.data.data.company_uuid
        }
        return next()
      }
    } catch {
      // Sin verificación: se muestra el formulario de licencia.
    }
  }
  return next('/')
}

// Guard de ruta global para verificar licencia después de la aceptada
router.beforeEach(async (to, from, next) => {
  if (!LICENSE_REQUIRED) return next()
  const isLicensePage = to.name === 'license'
  const hasLicense = localStorage.getItem('license_accepted') === 'true'
  const storedLicenseKey = localStorage.getItem('stored_license_key')

  // Si ya tiene licencia y está en la pantalla de licencia, ir al dashboard
  if (hasLicense && isLicensePage) {
    if (storedLicenseKey) {
      try {
        const response = await axios.get('/api/v1/license/verify/' + encodeURIComponent(storedLicenseKey.trim()), {
          timeout: 3000
        })
        if (response.data.success && response.data.data.status === 'valid') {
          return next('/dashboard')
        }
      } catch {
        // Error de verificación, pero permitir el paso
      }
    }
    return next('/dashboard')
  }

  if (!isLicensePage) {
    let licenseOk = hasLicense
    if (!licenseOk && storedLicenseKey) {
      try {
        const response = await axios.get('/api/v1/license/verify/' + encodeURIComponent(storedLicenseKey.trim()), {
          timeout: 5000
        })
        if (response.data.success && response.data.data.status === 'valid') {
          localStorage.setItem('license_accepted', 'true')
          axios.defaults.headers.common['X-License-Key'] = storedLicenseKey
          if (response.data.data.company_uuid) {
            localStorage.setItem('company_uuid_from_license', response.data.data.company_uuid)
            axios.defaults.headers.common['X-License-Company-Uuid'] = response.data.data.company_uuid
          }
          licenseOk = true
        }
      } catch {
        // Se redirige al formulario de licencia abajo.
      }
    }
    if (!licenseOk) return next('/')
  }

  return next()
})

router.beforeEach((to, from, next) => authGuard(to, from, next))
router.beforeEach((to, from, next) => twoFAGuard(to, from, next))
router.beforeEach((to, from, next) => permissionsGuard(to, from, next))

router.afterEach((to) => {
  document.title = `${import.meta.env.VITE_APP_NAME || 'NOA Transportes'} - ${to.meta?.title || 'Inicio'}`
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
  } catch {
    // Ignorar
  }
  // Salvaguarda: ninguna vista queda con la barra de navegación al 85% si se le olvidó apagarla
  try {
    useConfigStore().endNavigation()
  } catch {
    // Ignorar si el store aún no está disponible
  }
})

router.onError((error) => {
  tryReloadOnChunkError(error)
  try {
    useConfigStore().endNavigation()
  } catch {
    // Ignorar si el store aún no está disponible
  }
})

export default router
export { licenseGuard }
