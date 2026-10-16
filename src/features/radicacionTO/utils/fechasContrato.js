/**
 * Cálculo de vigencias de los contratos de radicación de tarjeta de operación.
 *
 * Vive aparte de la vista para poder probar la aritmética de fechas: el error
 * que veía el usuario ("Fecha de fin no es una fecha válida") venía de pasar
 * el objeto del formulario a `new Date()`, que devuelve Invalid Date y terminaba
 * enviando la cadena "NaN-NaN-NaN" al backend.
 */

/**
 * Suma días a una fecha ISO (yyyy-mm-dd) y devuelve la nueva fecha ISO.
 * Se opera sobre las partes de la cadena y con el constructor local
 * (año, mes, día), no con `new Date(iso)`, que interpreta la cadena como UTC y
 * desplazaba el día según la zona horaria del navegador.
 *
 * @param {string} iso Fecha de inicio en formato yyyy-mm-dd.
 * @param {number|string} dias Cantidad de días a sumar.
 * @returns {string} Fecha resultante en yyyy-mm-dd, o cadena vacía si la entrada no es válida.
 */
export function sumarDias(iso, dias) {
  if (!iso) return '';
  const partes = String(iso).split('-').map(Number);
  if (partes.length !== 3 || partes.some(Number.isNaN)) return '';
  const [yyyy, mm, dd] = partes;
  if (!yyyy || !mm || !dd) return '';
  const fecha = new Date(yyyy, mm - 1, dd);
  if (Number.isNaN(fecha.getTime())) return '';
  fecha.setDate(fecha.getDate() + Number(dias));
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Deja el formulario de contrato coherente: la fecha de emisión se alinea con
 * la de inicio cuando está vacía y la fecha de fin siempre se deriva de
 * inicio + duración. Si falta la fecha de inicio no se inventa nada: la fecha
 * de fin queda vacía para que el backend la reporte como campo obligatorio.
 *
 * @param {{start_date: string, issue_date: string, end_date: string, duration: number|string}} form Formulario reactivo del contrato.
 * @returns {object} El mismo formulario, ya normalizado.
 */
export function fechasAutomaticas(form) {
  if (!form.start_date) {
    form.end_date = '';
    return form;
  }
  if (!form.issue_date) form.issue_date = form.start_date;
  const dias = Number(form.duration);
  form.end_date = dias > 0 ? sumarDias(form.start_date, dias) : '';
  return form;
}

/**
 * Valida un formulario de contrato antes de enviarlo, sin consultar al backend.
 * Reutiliza las reglas del endpoint para no gastar un 422 en cada intento.
 *
 * @param {object} form Formulario del contrato.
 * @returns {object} Mapa de campo a mensaje; vacío si el formulario es válido.
 */
export function validarFechasContrato(form) {
  const errores = {};
  if (!form.contract_number?.trim()) errores.contract_number = 'El número de contrato es obligatorio.';
  if (!form.issue_date) errores.issue_date = 'La fecha de emisión es obligatoria.';
  if (!form.start_date) errores.start_date = 'La fecha de inicio es obligatoria.';
  const dias = Number(form.duration);
  if (!dias || dias < 1) errores.duration = 'Indique una duración de al menos 1 día.';
  if (!form.end_date) {
    errores.end_date = 'La fecha de fin no se pudo calcular: revise la fecha de inicio y la duración.';
  } else if (form.end_date < form.start_date) {
    errores.end_date = 'La fecha de fin no puede ser anterior a la fecha de inicio.';
  }
  return errores;
}
