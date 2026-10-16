/**
 * Etiquetas de la línea de tiempo y de los tipos de trámite del expediente de
 * radicación. Vivían duplicadas en la vista de expediente y en el listado; el
 * backend sigue siendo la fuente de verdad de los pasos (RadicacionService).
 */

export const pasos = {
  CAPACIDAD_TRANSPORTADORA: 'Capacidad transportadora',
  CARTA_DE_ACEPTACION: 'Carta de aceptación',
  INCLUSION_DE_POLIZAS: 'Inclusión de pólizas RCC y RCE',
  TARJETA_DE_OPERACION: 'Tarjeta de operación',
  RENOVACION_TARJETA: 'Renovación de tarjeta',
  DESVINCULACION: 'Desvinculación',
  DESVINCULACION_MUTUO: 'Desvinculación por mutuo acuerdo',
  DESVINCULACION_UNILATERAL: 'Desvinculación unilateral',
};

export const pasosCortos = {
  CAPACIDAD_TRANSPORTADORA: 'Capacidad',
  CARTA_DE_ACEPTACION: 'Carta',
  INCLUSION_DE_POLIZAS: 'Pólizas',
  TARJETA_DE_OPERACION: 'Tarjeta',
  RENOVACION_TARJETA: 'Renovación',
  DESVINCULACION: 'Desvinculación',
  DESVINCULACION_MUTUO: 'Mutuo acuerdo',
  DESVINCULACION_UNILATERAL: 'Unilateral',
};

export const tipos = {
  NUEVO_VEHICULO: 'Vehículo nuevo',
  CAMBIO_DE_EMPRESA: 'Cambio de empresa',
  RENOVACION: 'Renovación',
  DESVINCULACION_MUTUO: 'Desvinculación mutuo acuerdo',
  DESVINCULACION_UNILATERAL: 'Desvinculación unilateral',
};

export const etiquetaPaso = (valor) => pasos[valor] ?? valor;
export const etiquetaPasoCorta = (valor) => pasosCortos[valor] ?? valor;
export const etiquetaTipo = (valor) => tipos[valor] ?? valor;

export const colorEstado = (estado) =>
  estado === 'COMPLETADO' ? 'bg-success' : estado === 'EN_PROCESO' ? 'bg-primary' : 'bg-secondary';

/**
 * El expediente se considera completado cuando el backend cerró el último paso.
 * En ese estado la línea de tiempo deja de mostrarse.
 */
export const expedienteCompletado = (expediente) => expediente?.global_status === 'COMPLETADO';

/**
 * La línea de tiempo muestra un solo paso "en proceso": el primero que no está
 * completado. Los posteriores se muestran pendientes aunque el backend los
 * traiga como EN_PROCESO (expedientes creados antes de exigir el orden de pasos).
 */
export const normalizarLinea = (linea = []) => {
  const primero = linea.findIndex((p) => p.estado !== 'COMPLETADO');
  return linea.map((p, i) => {
    if (p.estado === 'COMPLETADO') return p;
    return { ...p, estado: i === primero ? 'EN_PROCESO' : 'PENDIENTE' };
  });
};


/** Opciones del selector "Tipo de trámite" del formulario de nuevo expediente. */
export const tiposDeTramite = [
  { label: 'Vehículo nuevo', value: 'NUEVO_VEHICULO' },
  { label: 'Cambio de empresa', value: 'CAMBIO_DE_EMPRESA' },
  { label: 'Renovación de tarjeta', value: 'RENOVACION' },
  { label: 'Desvinculación por mutuo acuerdo', value: 'DESVINCULACION_MUTUO' },
  { label: 'Desvinculación unilateral', value: 'DESVINCULACION_UNILATERAL' },
];


/**
 * Porcentaje de avance (0-100) a partir del texto "completados/total" que devuelve el backend.
 */
export const porcentajeAvance = (avance) => {
  const [hechos, total] = String(avance ?? '').split('/').map(Number);
  if (!Number.isFinite(hechos) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.round((hechos / total) * 100));
};
