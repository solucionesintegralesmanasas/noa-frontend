import { BaseService } from '@services/api/base.service.js';

/**
 * Extrae el motivo real de un rechazo del backend: los errores de validación
 * viajan en `error.details` (o en `errors`, según el manejador) y el `message`
 * genérico no sirve para saber qué campo corregir.
 */
export function mensajeDeError(error, porDefecto = 'Ocurrió un error') {
  const data = error?.response?.data;
  const details = data?.error?.details;
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    const campos = Object.entries(details)
      .filter(([, msgs]) => Array.isArray(msgs) ? msgs.length : Boolean(msgs))
      .map(([campo, msgs]) => `${campo.replace(/_/g, ' ')}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`);
    if (campos.length) return campos.join(' · ');
  }
  const errores = data?.errors;
  if (errores && typeof errores === 'object') {
    const campos = Object.entries(errores)
      .map(([campo, msgs]) => `${campo.replace(/_/g, ' ')}: ${(Array.isArray(msgs) ? msgs : [msgs]).join(' ')}`);
    if (campos.length) return campos.join(' · ');
  }
  return data?.message ?? error?.message ?? porDefecto;
}

class RadicacionService extends BaseService {
  constructor() {
    super({ resourcePath: 'procedure/radicacion', metadata: { module: 'radicacion', service: 'radicacion' } });
  }
  ruta(uuid) { return this._request('GET', `/${uuid}/ruta`); }
  validar(uuid) { return this._request('GET', `/${uuid}/validar`); }
  crearExpediente(data) { return this._request('POST', '/expediente', { data }); }
  expedientes(params = {}) { return this._request('GET', '/expedientes', { params }); }
  detalle(uuid) { return this._request('GET', `/${uuid}/detalle`); }
  avanzar(hijoUuid) { return this._request('POST', `/${hijoUuid}/avanzar`); }
  async listarCiudades() {
    try {
      const r = await this._getInstance().get('catalogs/cities/list');
      const items = r.data?.data ?? r.data ?? [];
      return (Array.isArray(items) ? items : []).map((x) => ({ label: x.name ?? x.nombre ?? 'Ciudad', value: x.uuid }));
    } catch { return []; }
  }
  async listarDirectores() {
    try {
      const r = await this._getInstance().get('procedure/territorial-directors/list');
      const items = r.data?.data ?? r.data ?? [];
      return (Array.isArray(items) ? items : []).map((x) => ({ label: [x.name, x.territorial_director].filter(Boolean).join(' — ') || 'Dirección', value: x.uuid }));
    } catch { return []; }
  }
  enlaceFirma(data) { return this._request('POST', '/enlace-firma', { data }); }
  generarTxt(uuid, origin) { return this._request('POST', `/${uuid}/txt`, { data: { origin } }); }

  /**
   * Descarga un documento del expediente (carta o contrato) ya generado en PDF
   * por el backend. Reutiliza el descargador de BaseService para que funcione
   * igual en web y en la app nativa.
   */
  async descargarDocumento(expedienteUuid, clave, nombreArchivo = null) {
    await this._downloadPdf(`/${expedienteUuid}/documento/${clave}`, nombreArchivo);
  }
}

export default new RadicacionService();
