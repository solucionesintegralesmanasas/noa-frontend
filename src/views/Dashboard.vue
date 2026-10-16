<template>
  <div class="dashboard-container">
    <div class="p-4">
      <h1 class="mb-4 text-primary">
        <i class="fas fa-tachometer-alt me-2"></i>Dashboard NOA
      </h1>
      
      <div class="row g-4">
        <!-- Tarjeta de Estado de Licencia -->
        <div class="col-md-6 col-lg-4">
          <div class="card license-status-card h-100">
            <div class="card-header bg-info text-white">
              <h5 class="mb-0"><i class="fas fa-key me-2"></i>Estado de Licencia</h5>
            </div>
            <div class="card-body">
              <p class="mb-1 small" v-if="licenseInfo.mode === 'online_verified'">
                <strong>Modo Online</strong> - Verificada con servidor
              </p>
              <p class="mb-1 small" v-if="licenseInfo.mode === 'offline'">
                <strong>Modo Offline</strong> - Usando licencia guardada
              </p>
              <p class="mb-1 small" v-if="licenseInfo.mode === 'expired'">
                <strong>Licencia Vencida</strong>
              </p>
              <p class="mb-0 small text-secondary">
                Empresa: {{ licenseInfo.companyName || 'N/A' }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Tarjeta de Información de Empresa -->
        <div class="col-md-6 col-lg-4">
          <div class="card company-info-card h-100">
            <div class="card-header bg-success text-white">
              <h5 class="mb-0"><i class="fas fa-building me-2"></i>Empresa</h5>
            </div>
            <div class="card-body">
              <p class="mb-1 small" v-if="licenseInfo.companyUuid">
                UUID: {{ licenseInfo.companyUuid.substring(0, 8) + '...' + licenseInfo.companyUuid.substring(-8) }}
              </p>
              <p class="mb-0 small text-secondary">
                Activada: {{ licenseInfo.activatedDate || 'N/A' }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Tarjeta de Usos Offline -->
        <div class="col-md-6 col-lg-4">
          <div class="card offline-usage-card h-100">
            <div class="card-header bg-warning text-white">
              <h5 class="mb-0"><i class="fas fa-off me-2"></i>Usos Offline</h5>
            </div>
            <div class="card-body">
              <p class="mb-1 small">Usos offline: {{ offlineUses || 0 }}</p>
              <p class="mb-0 small text-secondary">
                Límite típico: 50 usos antes de requerir renovación online
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sección de acciones rápidas -->
      <div class="mt-4">
        <h4 class="mb-3">Acciones Rápidas</h4>
        <div class="row">
          <div class="col-12">
            <button 
              class="btn btn-outline-primary w-100"
              @click="renovarLicencia"
            >
              <i class="fas fa-sync me-2"></i>Renovar Licencia
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

// Datos reactivos desde localStorage y headers de axios
const licenseInfo = ref({
  mode: 'checking',
  companyUuid: '',
  companyName: '',
  activatedDate: '',
  expiryDate: ''
})

const offlineUses = ref(0)

// Obtener información de la licencia desde localStorage y headers
const updateLicenseInfo = () => {
  const storedKey = localStorage.getItem('stored_license_key')
  const companyUuid = localStorage.getItem('company_uuid_from_license')
  
  if (storedKey) {
    // Consultar al backend para obtener info actualizada
    axios.get('/api/v1/license/verify/' + encodeURIComponent(storedKey.trim()))
      .then(response => {
        if (response.data.success && response.data.data) {
          const data = response.data.data
          licenseInfo.value = {
            mode: data.mode || 'offline',
            companyUuid: data.company_uuid || companyUuid || '',
            companyName: 'Transportes - ' + (companyUuid ? 'Empresa Registrada' : 'Sin Nombre'),
            activatedDate: data.activated_at || new Date().toLocaleDateString('es-CO'),
            expiryDate: data.expires_at ? new Date(data.expires_at).toLocaleDateString('es-CO') : ''
          }
          
          // Obtener contador de usos offline
          offlineUses.value = data.offline_uses || 0
        }
      })
      .catch(() => {
        // Si falla la consulta online, modo offline
        licenseInfo.value = {
          mode: 'offline',
          companyUuid: companyUuid || '',
          companyName: 'Transportes - Modo Offline',
          activatedDate: new Date().toLocaleDateString('es-CO'),
          expiryDate: 'Desconocido'
        }
        offlineUses.value = 999 // Valor alto para indicar modo offline puro
      })
  } else {
    licenseInfo.value = {
      mode: 'no-license',
      companyUuid: '',
      companyName: 'Sin Licencia',
      activatedDate: '',
      expiryDate: ''
    }
    offlineUses.value = 0
  }
}

// Actualizar info cada vez que cambien las rutas o datos
watch(() => localStorage.getItem('stored_license_key'), updateLicenseInfo)
watch(() => localStorage.getItem('company_uuid_from_license'), updateLicenseInfo)

// Método para renovar licencia (abriría un modal o iría al panel admin)
const renovarLicencia = () => {
  // En una implementación real, esto abriría un modal o redirigiría al panel de admin
  alert('Para renovar la licencia, acceda al panel de administración o contacte a SOLUCIONES INTEGRALES MANA S.A.S')
}
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
}

.license-status-card {
  transition: all 0.3s;
}

.license-status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.company-info-card {
  transition: all 0.3s;
}

.offline-usage-card {
  transition: all 0.3s;
}
</style>