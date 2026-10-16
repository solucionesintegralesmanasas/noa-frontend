/** Etiquetas y ayudas compartidas para los estados administrativos PCP. */
const ESTADOS_ADMINISTRATIVOS = {
    BORRADOR: { etiqueta: 'Borrador', clase: 'badge-subtle-secondary' },
    EN_CURSO: { etiqueta: 'En curso', clase: 'badge-subtle-info' },
    PARCIAL: { etiqueta: 'Parcial', clase: 'badge-subtle-warning' },
    CERRADA_OPERATIVAMENTE: { etiqueta: 'Cerrada op.', clase: 'badge-subtle-primary' },
    CERTIFICADA: { etiqueta: 'Certificada', clase: 'badge-subtle-success' },
    CERRADA_CON_EXCEPCION: { etiqueta: 'Con excepción', clase: 'badge-subtle-danger' },
};

export const etiquetaEstadoServicio = (estado) => ESTADOS_ADMINISTRATIVOS[estado]?.etiqueta || estado;

export const claseEstadoServicio = (estado) =>
    ESTADOS_ADMINISTRATIVOS[estado]?.clase || 'badge-subtle-secondary';

/** El texto accesible explica los pendientes; el estado no depende solo del color. */
export const tituloEstadoServicio = (registro) => {
    const pendientes = registro?.firmas_pendientes || [];
    if (pendientes.length) {
        return `${registro.estado} — pendiente: ${pendientes.map((item) => item.etiqueta).join(' · ')}`;
    }

    return `Estado: ${registro?.estado || 'desconocido'}`;
};
