/**
 * Cálculo de vigencias de los contratos de radicación de tarjeta de operación.
 *
 * Vive aparte de la vista para poder probar la aritmética de fechas: el error
 * que veía el usuario ("Fecha de fin no es una fecha válida") venía de pasar
 * el objeto del formulario a `new Date()`, que devuelve Invalid Date y terminaba
 * enviando la cadena "NaN-NaN-NaN" al backend.
 */

/**
 * Parte una fecha ISO (yyyy-mm-dd) en números, sin pasar por `new Date(iso)`,
 * que interpreta la cadena como UTC y desplaza el día según la zona horaria.
 *
 * @param {string} iso Fecha en formato yyyy-mm-dd.
 * @returns {[number, number, number]|null} [año, mes, día] o `null` si no es válida.
 */
function partesIso(iso) {
  const partes = String(iso).split('-').map(Number);
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
  const [yyyy, mm, dd] = partes;
  if (!yyyy || !mm || !dd) return null;
  return [yyyy, mm, dd];
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
  if (!partesIso(desde) || !partesIso(hasta)) return 0;
  const [anioA, mesA] = partesIso(desde);
  const [anioB, mesB] = partesIso(hasta);
  let meses = (anioB - anioA) * 12 + (mesB - mesA);
  if (sumarMeses(desde, meses) > hasta) meses -= 1;
  return Math.max(0, meses);
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
  const [yyyy, mm, dd] = partes;
  const fecha = new Date(yyyy, mm - 1 + Number(meses), 1);
  const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
  fecha.setDate(Math.min(dd, ultimoDia));
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
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
  if (!form.issue_date && form.start_date) form.issue_date = form.start_date;
  form.duration = form.start_date && form.end_date
    ? diasEntre(form.start_date, form.end_date)
    : 0;
  return form;
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
export function validarFechasContrato(form, { maxMeses = 0, exigirVigente = false } = {}) {
  const errores = {};
  // El número de contrato ya no se captura: lo asigna el consecutivo del backend.
  if (!form.issue_date) errores.issue_date = 'La fecha de emisión es obligatoria.';
  if (!form.start_date) errores.start_date = 'La fecha de inicio es obligatoria.';
  if (!form.end_date) {
    errores.end_date = 'La fecha de fin es obligatoria.';
  } else if (form.end_date <= form.start_date) {
    errores.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio.';
  } else if (maxMeses > 0) {
    const limite = sumarMeses(form.start_date, maxMeses);
    if (limite && form.end_date > limite) {
      errores.end_date = `El contrato no puede superar ${maxMeses} meses (${maxMeses / 12} años).`;
    }
  }

  if (exigirVigente && !errores.end_date && form.end_date) {
    const hoy = new Date();
    const hoyIso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    if (form.end_date < hoyIso) {
      errores.end_date = 'El contrato debe estar vigente: la fecha de fin no puede ser anterior a hoy.';
    }
  }

  return errores;
}
