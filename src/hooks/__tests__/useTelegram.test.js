// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockPost = vi.fn()

vi.mock('@services/api/client.js', () => ({
    default: { global: { post: (...args) => mockPost(...args) } }
}))

const { useTelegram } = await import('../useTelegram.js')

describe('useTelegram', () => {
    beforeEach(() => {
        mockPost.mockReset()
    })

    it('envía la prueba y devuelve el detalle de la respuesta', async () => {
        mockPost.mockResolvedValue({ data: { data: { enviados: ['123456'], fallidos: [] } } })
        const { enviando, error, enviarPrueba } = useTelegram()

        const resultado = await enviarPrueba()

        expect(mockPost).toHaveBeenCalledWith('/telegram/test', { chat_ids: '' })
        expect(resultado).toEqual({ enviados: ['123456'], fallidos: [] })
        expect(enviando.value).toBe(false)
        expect(error.value).toBe('')
    })

    it('expone el mensaje del backend cuando el envío falla', async () => {
        mockPost.mockRejectedValue({
            response: { data: { message: 'Configure al menos un chat_id de Telegram en Configuración del sistema.' } }
        })
        const { enviando, error, enviarPrueba } = useTelegram()

        const resultado = await enviarPrueba()

        expect(resultado).toBeNull()
        expect(error.value).toContain('chat_id')
        expect(enviando.value).toBe(false)
    })
})
