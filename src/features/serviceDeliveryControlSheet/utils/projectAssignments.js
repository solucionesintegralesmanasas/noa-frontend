/**
 * Utilidades para leer las asignaciones conductor → vehículo de un proyecto
 * y armar las opciones de los selects de la hoja de control (PCP).
 *
 * La fuente de verdad es el detalle del proyecto (`GET /projects/{uuid}`),
 * no los catálogos generales: así el formulario refleja los vehículos y
 * conductores que entran y salen del proyecto.
 */

/**
 * Devuelve solo las asignaciones activas del proyecto indicado.
 * Si el detalle no corresponde al proyecto, devuelve una lista vacía
 * (nunca cae a los catálogos generales).
 *
 * @param {Object|null} detalle - Detalle del proyecto.
 * @param {string} projectUuid - UUID del proyecto seleccionado.
 * @returns {Array<Object>} Asignaciones activas.
 */
export function asignacionesActivas(detalle, projectUuid) {
    if (!detalle || !projectUuid || detalle.uuid !== projectUuid) return [];

    const todas = detalle.assignments
        ?? detalle.driverVehicleAssignments
        ?? detalle.driver_vehicle_assignments
        ?? [];

    if (!Array.isArray(todas)) return [];

    return todas.filter((asignacion) => asignacion
        && asignacion.is_active !== false
        && asignacion.is_active !== 0);
}

/**
 * Recorre las asignaciones y arma una opción por UUID, sin duplicados.
 *
 * @param {Array<Object>} asignaciones - Asignaciones activas.
 * @param {string} campo - Campo que identifica el recurso.
 * @param {Function} armar - Constructor de la opción.
 * @returns {Array<Object>} Opciones únicas.
 */
function opcionesUnicas(asignaciones, campo, armar) {
    const vistos = new Set();
    const opciones = [];

    for (const asignacion of asignaciones) {
        const uuid = asignacion?.[campo];
        if (!uuid || vistos.has(uuid)) continue;
        vistos.add(uuid);
        opciones.push(armar(asignacion));
    }

    return opciones;
}

/**
 * Opciones de vehículos del proyecto.
 *
 * @param {Array<Object>} asignaciones - Asignaciones activas.
 * @returns {Array<{uuid: string, vehicle_license_plate: string, internal_number: string|null}>}
 */
export function opcionesVehiculos(asignaciones = []) {
    return opcionesUnicas(asignaciones, 'vehicle_uuid', (asignacion) => ({
        uuid: asignacion.vehicle_uuid,
        vehicle_license_plate: asignacion.vehicle?.vehicle_license_plate ?? asignacion.vehicle_uuid,
        internal_number: asignacion.vehicle?.internal_number ?? null,
    }));
}

/**
 * Opciones de conductores del proyecto.
 *
 * @param {Array<Object>} asignaciones - Asignaciones activas.
 * @returns {Array<{uuid: string, first_name: string, last_name: string, company_name: string|null, document_number: string|null}>}
 */
export function opcionesConductores(asignaciones = []) {
    return opcionesUnicas(asignaciones, 'third_party_uuid', (asignacion) => ({
        uuid: asignacion.third_party_uuid,
        first_name: asignacion.conductor?.first_name ?? '',
        last_name: asignacion.conductor?.last_name ?? '',
        company_name: asignacion.conductor?.company_name ?? null,
        document_number: asignacion.conductor?.document_number ?? null,
    }));
}

/**
 * Busca la asignación de un conductor dentro del proyecto.
 *
 * @param {Array<Object>} asignaciones - Asignaciones activas.
 * @param {string} uuid - UUID del conductor.
 * @returns {Object|null}
 */
export function asignacionDeConductor(asignaciones = [], uuid) {
    if (!uuid) return null;
    return asignaciones.find((asignacion) => asignacion?.third_party_uuid === uuid) ?? null;
}

/**
 * Busca la asignación de un vehículo dentro del proyecto.
 *
 * @param {Array<Object>} asignaciones - Asignaciones activas.
 * @param {string} uuid - UUID del vehículo.
 * @returns {Object|null}
 */
export function asignacionDeVehiculo(asignaciones = [], uuid) {
    if (!uuid) return null;
    return asignaciones.find((asignacion) => asignacion?.vehicle_uuid === uuid) ?? null;
}
