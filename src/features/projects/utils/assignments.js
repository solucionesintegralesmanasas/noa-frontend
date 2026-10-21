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
