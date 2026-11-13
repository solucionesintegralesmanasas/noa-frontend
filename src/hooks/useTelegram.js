/**
 * Composable de prueba de las notificaciones por Telegram.
 *
 * El token del bot vive solo en el backend: aquí únicamente se pide el envío
 * de un mensaje de prueba a los chat_id configurados por la empresa.
 *
 * @author Darwin Montes
 */
import { ref } from 'vue'
import apiClient from '@services/api/client.js'

export function useTelegram() {
    const enviando = ref(false)
    const error = ref('')

    async function enviarPrueba(chatIds = '') {
        enviando.value = true
        error.value = ''

        try {
            const { data } = await apiClient.global.post('/telegram/test', { chat_ids: chatIds })
            return data?.data ?? data
        } catch (e) {
            error.value = e?.response?.data?.message || 'No se pudo enviar la prueba por Telegram.'
            return null
        } finally {
            enviando.value = false
        }
    }

    return { enviando, error, enviarPrueba }
}
