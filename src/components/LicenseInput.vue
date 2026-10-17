<template>
  <div v-if="!licenseAccepted" class="license-screen">
    <div class="container">
      <div class="card mx-auto" style="max-width: 450px; margin-top: 120px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
        <div class="card-header bg-primary text-white" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <h3 class="card-title mb-0">Licencia de Usuario Final</h3>
          <p class="card-text small">SOLUCIONES INTEGRALES MANA S.A.S - NIT 901-924-358-5</p>
        </div>
        <div class="card-body p-5">
          <p class="text-center mb-4">
            Ingrese su código de licencia para activar la API NOA en su instalación local
          </p>
          
          <div class="form-group mb-3">
            <label for="licenseCode" class="form-label small">Código de Licencia:</label>
            <input 
              type="text" 
              id="licenseCode" 
              v-model="licenseCode" 
              class="form-control form-control-lg"
              placeholder="Ej: NSA-LIC-2026-ABC123"
              autocomplete="off"
              :disabled="isActivating"
            >
            <div class="form-text">
              Reciba su código al adquirir la licencia de SOLUCIONES INTEGRALES MANA S.A.S
            </div>
          </div>
          
          <button 
            @click="activateLicense" 
            class="btn btn-primary w-100 mb-3"
            :disabled="!licenseCode || isActivating"
            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
          >
            <span v-if="isActivating">⏳ Activando...</span>
            <span v-else>✅ Activar Licencia</span>
          </button>
          
          <p v-if="errorMessage" class="text-danger mt-3 small text-center">
            {{ errorMessage }}
          </p>
          
          <p v-if="infoMessage" class="text-info mt-3 small text-center">
            {{ infoMessage }}
          </p>
          
          <div class="alert alert-light mt-3 p-3 small text-center" v-if="licenseExpired">
            <strong>⚠️ Licencia vencida.</strong> El código ha expirado el {{ expiryDate }}. Póngase en contacto con su administrador para renovar.
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div v-if="licenseAccepted" class="main-app">
    <div class="container-fluid">
      <router-view v-on:success="handleRouteSuccess" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const licenseCode = ref('')
const licenseAccepted = ref(false)
const isActivating = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')
const licenseExpired = ref(false)
const expiryDate = ref('')

// Servicios
const router = useRouter()

// Verificar si ya hay una licencia aceptada previamente en localStorage
const licenseAcceptedFromStorage = localStorage.getItem('license_accepted') === 'true'
const storedLicenseKey = localStorage.getItem('stored_license_key')
const storedCompanyUuid = localStorage.getItem('company_uuid_from_license')

// Si ya tiene licencia aceptada guardada, ir directamente al dashboard
if (licenseAcceptedFromStorage && storedLicenseKey) {
  // Verificar que la licencia aún sea válida (con tope: sin respuesta no se puede
  // dejar el formulario esperando para siempre).
  axios.get('/api/v1/license/verify/' + encodeURIComponent(storedLicenseKey.trim()), {
    timeout: 8000,
  })
    .then(response => {
      if (response.data.success && response.data.data.status === 'valid') {
        licenseAccepted.value = true
        // Configurar headers global de axios para futuras peticiones
        axios.defaults.headers.common['X-License-Key'] = storedLicenseKey
        axios.defaults.headers.common['X-License-Company-Uuid'] = storedCompanyUuid || ''
        
        // Obtener fecha de expiración para mostrar
        if (response.data.data.expires_at) {
          const date = new Date(response.data.data.expires_at)
          expiryDate.value = date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        }
        
        // Redirigir al dashboard después de un breve retraso
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        // Licencia inválida, limpiar y mostrar formulario
        localStorage.removeItem('license_accepted')
        localStorage.removeItem('stored_license_key')
        localStorage.removeItem('company_uuid_from_license')
      }
    })
    .catch(() => {
      // Error de conexión, mantener modo offline si hay datos guardados
      if (storedLicenseKey) {
        licenseAccepted.value = true
        axios.defaults.headers.common['X-License-Key'] = storedLicenseKey
        infoMessage.value = 'Modo offline activado - usando licencia guardada anteriormente'
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      }
    })
}

// Si NO hay licencia guardada, mostrar formulario de ingreso
// (El condicional v-if="!licenseAccepted" ya se encarga de esto)

// Escuchar eventos del router para manejar la redirección después de aceptar
watch(() => licenseAccepted, (newValue) => {
  if (newValue) {
    // Pequeño retraso para asegurar que el localStorage se haya actualizado
    setTimeout(() => {
      router.push('/dashboard')
    }, 500)
  }
})

// Método para activar la licencia
const activateLicense = async () => {
  isActivating.value = true
  errorMessage.value = ''
  infoMessage.value = ''
  licenseExpired.value = false
  
  try {
    // Verificar la licencia con el backend
    const response = await axios.get('/api/v1/license/verify/' + encodeURIComponent(licenseCode.value.trim()))
    
    if (response.data.success) {
      const data = response.data.data
      const cleanCode = licenseCode.value.trim()
      // Guardar licencia localmente para modo offline
      localStorage.setItem('stored_license_key', cleanCode)
      localStorage.setItem('company_uuid_from_license', data.company_uuid || '')
      localStorage.setItem('license_accepted', 'true')
      
      // Agregar header a todas las futuras peticiones axios
      axios.defaults.headers.common['X-License-Key'] = cleanCode
      if (data.company_uuid) {
        axios.defaults.headers.common['X-License-Company-Uuid'] = data.company_uuid
      }
      
      // Marcar como aceptado
      licenseAccepted.value = true
      
      // Guardar información de expiración
      if (data.expires_at) {
        expiryDate.value = new Date(data.expires_at).toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      
      // Mensaje informativo según el modo
      if (data.mode === 'offline') {
        infoMessage.value = 'Licencia activada en modo offline. Algunas funciones pueden tener limitaciones según el uso previo.'
      } else if (data.mode === 'online_verified') {
        infoMessage.value = 'Licencia verificada exitosamente con conexión a servidor. Todos los funcionalidades disponibles.'
      } else {
        infoMessage.value = 'Licencia activada correctamente.'
      }
    } else {
      // Manejo de errores específicos
      if (response.data.error === 'expired') {
        licenseExpired.value = true
        errorMessage.value = ''
        infoMessage.value = 'La licencia ha expirado el ' + (expiryDate.value || 'fecha desconocida') + '. Es necesario renovar.'
      } else if (response.data.error === 'invalid') {
        errorMessage.value = 'Código de licencia inválido. Por favor verifique el código e intente nuevamente.'
        // Limpiar cualquier dato stale
        localStorage.removeItem('stored_license_key')
        localStorage.removeItem('company_uuid_from_license')
        localStorage.removeItem('license_accepted')
      } else {
        errorMessage.value = response.data.message || 'Error desconocido al verificar la licencia.'
      }
    }
  } catch (error) {
    const backendError = error?.response?.data?.error
    const backendMessage = error?.response?.data?.message
    const status = error?.response?.status
    if (backendError === 'expired') {
      licenseExpired.value = true
      infoMessage.value = backendMessage || 'La licencia ha expirado. Es necesario renovar.'
    } else if (backendError === 'invalid' || status === 403) {
      errorMessage.value = backendMessage || 'Código de licencia inválido. Por favor verifique el código e intente nuevamente.'
      localStorage.removeItem('stored_license_key')
      localStorage.removeItem('company_uuid_from_license')
      localStorage.removeItem('license_accepted')
    } else if (status === 404) {
      errorMessage.value = 'Ruta de verificación no encontrada (404). Revise el proxy Vite y que el backend tenga la ruta api/v1/license/verify.'
    } else if (localStorage.getItem('stored_license_key')) {
      // Si no hay conexión a internet, intentar modo offline con datos guardados previamente
      licenseAccepted.value = true
      axios.defaults.headers.common['X-License-Key'] = localStorage.getItem('stored_license_key')
      infoMessage.value = 'Sin conexión a internet. Modo offline activado con licencia guardada anteriormente.'
      // Redirigir después de un retraso
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } else {
      errorMessage.value = backendMessage || 'No hay conexión con el backend. Verifique que Apache y el proxy Vite estén activos e ingrese el código de licencia.'
    }
  } finally {
    isActivating.value = false
  }
}
</script>

<style scoped>
.license-screen {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.license-screen .card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.license-screen .card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #dee2e6;
}

.license-screen .form-control {
  border-radius: 8px;
  border: 1px solid #ced4da;
  font-size: 1.05rem;
}

.license-screen .form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.license-screen .btn-primary {
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.2s;
}

.license-screen .btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.main-app {
  min-height: 100vh;
  width: 100%;
}
</style>