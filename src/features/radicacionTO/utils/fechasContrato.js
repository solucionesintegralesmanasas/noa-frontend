/**
 * Cálculo de vigencias de los contratos de radicación de tarjeta de operación.
 *
 * Vive aparte de la vista para poder probar la aritmética de fechas: el error
 * que veía el usuario ("Fecha de fin no es una fecha válida") venía de pasar
 * el objeto del formulario a `new Date()`, que devuelve Invalid Date y terminaba
 * enviando la cadena "NaN-NaN-NaN" al backend.
 */

/**
 * Convierte un valor de entrada a cadena ISO segura sin lanzar errores ante
 * `Symbol`, `Object.create(null)` u objetos hostiles.
 *
 * @param {unknown} valor Entrada a normalizar.
 * @returns {string} Cadena o vacío si no es convertible de forma segura.
 */
function textoFechaSeguro(valor) {
  if (!valor || typeof valor === 'symbol') return '';
  try {
    const str = typeof valor === 'string' ? valor : String(valor);
    return str.length <= 64 ? str : '';
  } catch {
    return '';
  }
}

/**
 * Parte una fecha ISO (yyyy-mm-dd) en números, verificando que exista en el
 * calendario, sin pasar por `new Date(iso)` (que interpreta UTC y desplaza el día).
 *
 * @param {unknown} iso Fecha en formato yyyy-mm-dd.
 * @returns {[number, number, number]|null} [año, mes, día] o `null` si no es válida.
 */
function partesIso(iso) {
  const str = textoFechaSeguro(iso);
  if (!str) return null;
  const partes = str.split('-').map(Number);
  if (partes.length !== 3 || partes.some((n) => !Number.isInteger(n))) return null;
  const [yyyy, mm, dd] = partes;
  if (!yyyy || !mm || !dd || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const fecha = new Date(yyyy, mm - 1, dd);
  if (
    Number.isNaN(fecha.getTime())
    || fecha.getFullYear() !== yyyy
    || fecha.getMonth() !== mm - 1
    || fecha.getDate() !== dd
  ) {
    return null;
  }
  return [yyyy, mm, dd];
}

/**
 * Formatea una instancia Date local a `yyyy-mm-dd`.
 *
 * @param {Date} fecha Fecha válida.
 * @returns {string} Cadena ISO.
 */
function formatearIso(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Días entre dos fechas ISO (fin − inicio). Usa UTC para que los cambios de
 * horario no alteren el resultado.
 *
 * @param {string} desde Fecha inicial en yyyy-mm-dd.
 * @param {string} hasta Fecha final en yyyy-mm-dd.
 * @returns {number} Diferencia en días; 0 si alguna fecha no es válida.
 */
export function diasEntre(desde, hasta) {
  const a = partesIso(desde);
  const b = partesIso(hasta);
  if (!a || !b) return 0;
  const ms = Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2]);
  return Math.round(ms / 86400000);
}

/**
 * Meses completos entre dos fechas ISO. Ajusta el fin de mes igual que
 * `sumarMeses` (31/01 → 28/02 cuenta como un mes).
 *
 * @param {string} desde Fecha inicial en yyyy-mm-dd.
 * @param {string} hasta Fecha final en yyyy-mm-dd.
 * @returns {number} Meses completos; 0 si alguna fecha no es válida.
 */
export function mesesEntre(desde, hasta) {
  const a = partesIso(desde);
  const b = partesIso(hasta);
  if (!a || !b) return 0;
  const [anioA, mesA] = a;
  const [anioB, mesB] = b;
  let meses = (anioB - anioA) * 12 + (mesB - mesA);
  const hastaStr = textoFechaSeguro(hasta);
  if (sumarMeses(desde, meses) > hastaStr) meses -= 1;
  return Math.max(0, meses);
}

/**
 * Suma días a una fecha ISO sin desplazamientos de zona horaria.
 *
 * @param {string} iso Fecha de inicio en formato yyyy-mm-dd.
 * @param {number} dias Días a sumar.
 * @returns {string} Fecha resultante en yyyy-mm-dd, o cadena vacía si la entrada no es válida.
 */
export function sumarDias(iso, dias) {
  const partes = partesIso(iso);
  if (!partes) return '';
  let diasNum = NaN;
  try {
    if (typeof dias !== 'symbol') diasNum = Number(dias);
  } catch {
    return '';
  }
  if (!Number.isFinite(diasNum)) return '';
  const [yyyy, mm, dd] = partes;
  const fecha = new Date(yyyy, mm - 1, dd);
  fecha.setDate(fecha.getDate() + Math.trunc(diasNum));
  if (Number.isNaN(fecha.getTime())) return '';
  return formatearIso(fecha);
}

/**
 * Suma meses a una fecha ISO ajustando al último día del mes cuando el día no
 * existe (31 de enero + 1 mes → 28/29 de febrero).
 *
 * @param {string} iso Fecha de inicio en formato yyyy-mm-dd.
 * @param {number} meses Meses a sumar.
 * @returns {string} Fecha resultante en yyyy-mm-dd, o cadena vacía si la entrada no es válida.
 */
export function sumarMeses(iso, meses) {
  const partes = partesIso(iso);
  if (!partes) return '';
  let mesesNum = NaN;
  try {
    if (typeof meses !== 'symbol') mesesNum = Number(meses);
  } catch {
    return '';
  }
  if (!Number.isFinite(mesesNum)) return '';
  const [yyyy, mm, dd] = partes;
  const fecha = new Date(yyyy, mm - 1 + Math.trunc(mesesNum), 1);
  if (Number.isNaN(fecha.getTime())) return '';
  const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
  fecha.setDate(Math.min(dd, ultimoDia));
  return formatearIso(fecha);
}

/**
 * Deja el formulario de contrato coherente: la fecha de emisión se alinea con
 * la de inicio cuando está vacía y la duración en días se calcula sola a partir
 * de las fechas de inicio y fin.
 *
 * @param {{start_date: string, issue_date: string, end_date: string, duration: number|string}} form Formulario reactivo del contrato.
 * @returns {object} El mismo formulario, ya normalizado.
 */
export function fechasAutomaticas(form) {
  if (!form || typeof form !== 'object') return form;
  try {
    const start = textoFechaSeguro(form.start_date);
    const end = textoFechaSeguro(form.end_date);
    if (!form.issue_date && start) {
      try { form.issue_date = start; } catch { /* objeto congelado */ }
    }
    try {
      form.duration = start && end ? diasEntre(start, end) : 0;
    } catch { /* objeto congelado */ }
    return form;
  } catch {
    return form;
  }
}

/**
 * Valida un formulario de contrato antes de enviarlo, sin consultar al backend.
 * Reutiliza las reglas del endpoint para no gastar un 422 en cada intento.
 *
 * @param {object} form Formulario del contrato.
 * @param {object} [opciones] Reglas extra del contrato de vinculación.
 * @param {number} [opciones.maxMeses] Vigencia máxima en meses (RUNT: 24 para vinculación).
 * @param {boolean} [opciones.exigirVigente] Exige que la fecha de fin no esté vencida.
 * @returns {object} Mapa de campo a mensaje; vacío si el formulario es válido.
 */
export function validarFechasContrato(form, opciones = {}) {
  if (!form || typeof form !== 'object') return { general: 'Formulario inválido.' };
  const opts = opciones && typeof opciones === 'object' ? opciones : {};
  const maxMeses = typeof opts.maxMeses === 'number' && Number.isFinite(opts.maxMeses) ? opts.maxMeses : 0;
  const exigirVigente = Boolean(opts.exigirVigente);

  const errores = {};
  try {
    const issueDate = textoFechaSeguro(form.issue_date);
    const startDate = textoFechaSeguro(form.start_date);
    const endDate = textoFechaSeguro(form.end_date);

    // El número de contrato ya no se captura: lo asigna el consecutivo del backend.
    if (!issueDate) errores.issue_date = 'La fecha de emisión es obligatoria.';
    if (!startDate) errores.start_date = 'La fecha de inicio es obligatoria.';
    if (!endDate) {
      errores.end_date = 'La fecha de fin es obligatoria.';
    } else if (startDate && endDate <= startDate) {
      errores.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio.';
    } else if (maxMeses > 0 && startDate) {
      const limite = sumarMeses(startDate, maxMeses);
      if (limite && endDate > limite) {
        errores.end_date = `El contrato no puede superar ${maxMeses} meses (${maxMeses / 12} años).`;
      }
    }

    if (exigirVigente && !errores.end_date && endDate) {
      const hoy = new Date();
      const hoyIso = formatearIso(hoy);
      if (endDate < hoyIso) {
        errores.end_date = 'El contrato debe estar vigente: la fecha de fin no puede ser anterior a hoy.';
      }
    }
  } catch {
    return { general: 'Formulario inválido.' };
  }

  return errores;
}
