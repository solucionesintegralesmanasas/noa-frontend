/**
 * Reglas puras del relevo de conductor en planillas PCP.
 *
 * Sin dependencias de Vue: candidatos válidos, validación y armado del payload,
 * para poder probarlas de forma aislada.
 */

/** Etiqueta visible del turno cuando hay más de uno en el mismo día. */
export const etiquetaTurno = (planilla) => {
    const turno = Number(planilla?.turno);
    return turno > 1 ? `Turno ${turno}` : null;
};

/** ¿La planilla nació de un relevo (es el turno entrante de otro tramo)? */
export const esRelevo = (planilla) => Boolean(planilla?.relevo_de_uuid);

/** Nombre visible de un conductor, con degradación a documento o razón social. */
export const nombreConductor = (conductor) => {
    const nombre = `${conductor?.first_name || ''} ${conductor?.last_name || ''}`.trim();
    return nombre || conductor?.company_name || conductor?.document_number || 'Conductor';
};

/**
 * Conductores activos de la empresa (terceros con `is_driver`) aptos para
 * recibir el vehículo: excluye al conductor actual.
 *
 * @param {Array<object>} conductores Catálogo de terceros conductores de la empresa.
 * @param {string} conductorActual UUID del conductor del turno abierto.
 * @param {(c: object) => string} etiqueta Función para pintar el nombre del conductor.
 * @returns {Array<{uuid: string, label: string}>}
 */
export const candidatosDeRelevo = (conductores, conductorActual, etiqueta = nombreConductor) => {
    const porUuid = new Map();

    for (const conductor of conductores || []) {
        const uuid = conductor?.uuid;
        if (!uuid || conductor.is_active === false || uuid === conductorActual) continue;
        porUuid.set(uuid, { uuid, label: etiqueta(conductor) });
    }

    return [...porUuid.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
};

/**
 * Errores de validación del formulario de relevo.
 * @returns {Record<string, string>} Mapa campo → mensaje.
 */
export const validarRelevo = (form) => {
    const errores = {};

    if (!form.third_party_uuid) {
        errores.third_party_uuid = 'Selecciona el conductor que recibe el vehículo.';
    }

    return errores;
};

/**
 * Payload del endpoint de relevo: el backend reasigna el vehículo al conductor
 * entrante y retira al saliente. No cierra ni crea planillas.
 */
export const armarPayloadRelevo = ({ projectUuid, vehicleUuid, thirdPartyUuid }) => ({
    project_uuid: projectUuid,
    vehicle_uuid: vehicleUuid,
    third_party_uuid: thirdPartyUuid,
});
