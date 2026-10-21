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

/**
 * Filas de la tabla de creación masiva (SPEC-009): una por coche, con su
 * conductor de la asignación vigente. Una fila sin conductor o sin vehículo
 * no puede crear hoja y se excluye; si un coche aparece en más de una
 * asignación activa, gana la primera llegada.
 *
 * @param {Array<Object>} asignaciones - Asignaciones activas del proyecto.
 * @returns {Array<{asignacion_uuid: string|null, vehicle_uuid: string, conductor_uuid: string, placa: string, internal_number: string, conductor_nombre: string, document_number: string}>}
 */
export function filasDeProyecto(asignaciones) {
    const filas = [];
    const vistos = new Set();

    for (const asignacion of Array.isArray(asignaciones) ? asignaciones : []) {
        const vehiculoUuid = asignacion?.vehicle_uuid;
        const conductorUuid = asignacion?.third_party_uuid;
        // Fila inservible: no hay par conductor ↔ vehículo completo.
        if (!vehiculoUuid || !conductorUuid || vistos.has(vehiculoUuid)) continue;
        vistos.add(vehiculoUuid);

        const conductor = asignacion.conductor ?? {};
        const vehicle = asignacion.vehicle ?? {};
        filas.push({
            asignacion_uuid: asignacion.uuid ?? null,
            vehicle_uuid: vehiculoUuid,
            conductor_uuid: conductorUuid,
            placa: vehicle.vehicle_license_plate ?? '',
            internal_number: vehicle.internal_number ?? '',
            conductor_nombre: `${conductor.first_name || ''} ${conductor.last_name || ''
            }`.trim() || conductor.company_name || '',
            document_number: conductor.document_number ?? '',
        });
    }

    return filas;
}

/**
 * Resumen vivo del bulk: cuántas hojas y cuántas planillas diarias se crearán
 * con los coches marcados. El backend crea una planilla diaria por cada día
 * de cada hoja (con un solo día, la hoja es su propia planilla diaria).
 *
 * @param {Array<Object>} filas - Filas marcadas de filasDeProyecto.
 * @param {number} diasServicio - Días entre fecha de inicio y fin (inclusivos).
 * @returns {{hojas: number, planillasDiarias: number}}
 */
export function resumenCreacion(filas, diasServicio = 1) {
    const hojas = Array.isArray(filas) ? filas.length : 0;
    const dias = Number(diasServicio);
    const diasValidos = Number.isFinite(dias) && dias > 0 ? Math.floor(dias) : 1;

    return { hojas, planillasDiarias: hojas * diasValidos };
}

/**
 * Payload del endpoint bulk: solo los campos comunes y la lista de coches.
 * Conceptualmente NO envía `vehicle_uuid`, `third_party_uuid`,
 * `official_name_and_surname` ni `fuec_uuid`: el backend los resuelve desde
 * la asignación vigente del proyecto y los descarta si llegaran.
 *
 * @param {Object} formData - Campos comunes del formulario.
 * @param {string[]} cochesSeleccionados - UUIDs de vehículos marcados.
 * @returns {Object} Payload para POST /bulk.
 */
export function armarPayloadCreacion(formData, cochesSeleccionados) {
    return {
        company_uuid: formData?.company_uuid || null,
        project_uuid: formData?.project_uuid || null,
        service_date: formData?.service_date || formData?.start_date || null,
        start_date: formData?.start_date || null,
        end_date: formData?.end_date || null,
        daily_route: formData?.daily_route?.trim() || null,
        type_of_control_sheet: 'DIRECTO_CON_LA_EMPRESA',
        is_active: formData?.is_active === '0' ? false : true,
        vehicle_uuids: (Array.isArray(cochesSeleccionados) ? cochesSeleccionados : []).filter(Boolean),
    };
}
