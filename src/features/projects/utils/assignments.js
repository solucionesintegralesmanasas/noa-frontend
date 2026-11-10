/**
 * Payload de asignaciones para el API de proyectos.
 *
 * El backend sincroniza por conductor: las asignaciones que no llegan en el
 * payload se marcan como retiradas y, si un conductor aparece dos veces, gana
 * la última fila. Por eso se envían solo las asignaciones activas (una por
 * conductor) más la fila que se agrega o se alterna; así no se pierde una
 * asignación activa por culpa de un histórico retirado.
 */

const fila = (asignacion, isActive = true) => ({
    third_party_uuid: asignacion.third_party_uuid,
    vehicle_uuid: asignacion.vehicle_uuid,
    is_active: isActive,
});

const activas = (asignaciones = []) =>
    (asignaciones || [])
        .filter((asignacion) => asignacion?.is_active !== false)
        .map((asignacion) => fila(asignacion, true));

/**
 * Valida las filas del formulario y arma el payload.
 * Las filas retiradas son histórico: no se envían ni cuentan como duplicadas.
 */
export function validarAsignaciones(asignaciones = []) {
    const errores = [];
    const validAssignments = [];
    const driversSeen = {};
    const vehiclesSeen = {};

    (asignaciones || []).forEach((row, index) => {
        const label = `Fila ${index + 1}`;

        if (!row.third_party_uuid || !row.vehicle_uuid) {
            errores.push(`${label}: selecciona conductor y vehículo.`);
            return;
        }

        if (row.is_active === false) return;

        if (driversSeen[row.third_party_uuid]) {
            errores.push(`${label}: el conductor ya fue asignado a este proyecto.`);
            return;
        }
        driversSeen[row.third_party_uuid] = true;

        if (vehiclesSeen[row.vehicle_uuid]) {
            errores.push(`${label}: el vehículo ya fue asignado a este proyecto.`);
            return;
        }
        vehiclesSeen[row.vehicle_uuid] = true;

        validAssignments.push({
            third_party_uuid: row.third_party_uuid,
            vehicle_uuid: row.vehicle_uuid,
            is_active: true,
        });
    });

    return { errores, validAssignments };
}

/** Agrega una asignación nueva conservando las activas del proyecto. */
export function payloadConNuevaAsignacion(asignaciones, nueva) {
    return [...activas(asignaciones), fila(nueva, true)];
}

/** Retira o reactiva una asignación sin perder las demás activas. */
export function payloadConAlternancia(asignaciones, objetivo) {
    // is_active=false significa que la asignación estaba retirada y se reactiva.
    const nuevoEstado = objetivo.is_active === false;
    const resto = activas(asignaciones).filter(
        (asignacion) => asignacion.third_party_uuid !== objetivo.third_party_uuid
    );

    return [...resto, fila(objetivo, nuevoEstado)];
}
