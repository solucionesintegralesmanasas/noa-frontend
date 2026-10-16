/**
 * Composable de la licencia de uso.
 * Consulta la verificación y el detalle de la licencia guardada en el equipo y
 * los normaliza a las claves: estado, codigo, empresa_uuid, vence_en, modo,
 * verificaciones_online, verificaciones_offline, activada_en, ultima_verificacion,
 * titular, plan, limites, historial. Lo que la API no entrega queda en null.
 *
 * @author Darwin Montes
 */
import { computed, ref } from 'vue'
import axios from 'axios'

const URL_VERIFICAR = '/api/v1/license/verify/'
const URL_DETALLE = '/api/v1/license/detail/'

const licenciaVacia = () => ({
  estado: null,
  codigo: null,
  empresa_uuid: null,
  vence_en: null,
  modo: null,
  verificaciones_online: null,
  verificaciones_offline: null,
  activada_en: null,
  ultima_verificacion: null,
  titular: null,
  plan: null,
  limites: null,
  historial: []
})

export function useLicencia() {
  const licencia = ref(licenciaVacia())
  const cargando = ref(true)
  const error = ref('')

  const hayLicencia = computed(() => !!licencia.value.codigo)

  async function cargar() {
    cargando.value = true
    error.value = ''
    const clave = localStorage.getItem('stored_license_key')
    if (!clave) {
      error.value = 'No hay licencia guardada en este equipo.'
      cargando.value = false
      return
    }
    const codigo = encodeURIComponent(clave.trim())
    try {
      const [verificacion, ficha] = await Promise.all([
        axios.get(URL_VERIFICAR + codigo),
        axios.get(URL_DETALLE + codigo).catch(() => null)
      ])
      const v = verificacion.data?.data || {}
      const d = ficha?.data?.data || {}
      const estadoApi = v.status || d.status || null
      licencia.value = {
        ...licenciaVacia(),
        estado: estadoApi === 'valid' ? 'Activa' : estadoApi,
        codigo: clave.trim(),
        empresa_uuid: v.company_uuid || d.company_uuid || localStorage.getItem('company_uuid_from_license') || null,
        vence_en: v.expires_at || d.expiry_date || null,
        modo: v.mode || (d.offline_mode ? 'offline' : null),
        verificaciones_online: d.online_verifications ?? null,
        verificaciones_offline: v.offline_uses ?? d.offline_verifications ?? null,
        activada_en: d.created_at || null,
        ultima_verificacion: d.last_verified_at || v.verified_at || null,
        titular: d.company_name || d.holder || null,
        plan: d.plan_name ? { nombre: d.plan_name } : null,
        limites: d.limits || null,
        historial: Array.isArray(d.history) ? d.history : []
      }
    } catch {
      error.value = 'No se pudo obtener la información de la licencia.'
    } finally {
      cargando.value = false
    }
  }

  return { licencia, cargando, error, hayLicencia, cargar }
}
