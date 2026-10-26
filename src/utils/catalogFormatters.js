/**
 * Formateadores y normalizadores reutilizables para catálogos de selectores (PrimeSelect).
 * Garantizan etiquetas legibles (nunca nulas) y campos de búsqueda completos
 * para terceros (afiliados, conductores, propietarios, proveedores, clientes) y vehículos.
 */

function toCleanString(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

export function toCatalogArray(value) {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.data)) return value.data;
    if (value && typeof value === 'object') {
        if (value.uuid || value.id || value.value) return [value];
    }
    return [];
}

/**
 * Normaliza un registro de tercero para selectores.
 * Construye `display_name` (nombre completo o razón social), `display_label` (incluyendo documento)
 * y `search_text` con todas las variantes (nombre, apellido, razón social, nombre comercial, NIT/CC).
 */
export function formatThirdPartyOption(item, labelField = 'company_name') {
    if (!item || typeof item !== 'object') return item;

    const firstName = toCleanString(item.first_name);
    const lastName = toCleanString(item.last_name);
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const companyName = toCleanString(item.raw_company_name ?? item.company_name);
    const tradeName = toCleanString(item.trade_name);
    const docNumber = toCleanString(item.document_number);
    const personType = toCleanString(item.person_type).toUpperCase();

        const fallbackName = companyName ||
        tradeName ||
        fullName ||
        toCleanString(item.full_name) ||
        toCleanString(item.display_name) ||
        toCleanString(item.name) ||
        toCleanString(item.label) ||
        docNumber ||
        'Sin nombre';
    const primaryName = (personType === 'NATURAL' && fullName) ? fullName : fallbackName;

    const displayLabel = docNumber && !primaryName.includes(docNumber)
        ? `${primaryName} — ${docNumber}`
        : primaryName;

    const searchText = [
        displayLabel,
        primaryName,
        fullName,
         `${lastName} ${firstName}`.trim(),
        companyName,
        tradeName,
        firstName,
        lastName,
        docNumber,
        toCleanString(item.email),
        toCleanString(item.phone),
    ]
        .filter(Boolean)
        .join(' ');

    return {
        ...item,
        raw_company_name: companyName || null,
        full_name: fullName || primaryName,
        display_name: primaryName,
        display_label: displayLabel,
        [labelField]: displayLabel,
        search_text: searchText,
    };
}

/**
 * Normaliza y deduplica un listado de terceros para un selector.
 */
export function formatThirdPartyList(items, labelField = 'company_name') {
    const seen = new Set();
    const result = [];
    for (const item of toCatalogArray(items)) {
        if (!item || typeof item !== 'object') continue;
        const key = item.uuid ?? item.id ?? item.value ?? null;
        if (key !== null) {
            if (seen.has(key)) continue;
            seen.add(key);
        }
        result.push(formatThirdPartyOption(item, labelField));
    }
    return result;
}

/**
 * Normaliza un registro de vehículo para selectores de placa/móvil.
 * Conserva `vehicle_license_plate` (solo la placa) y agrega `display_plate`
 * ("ABC123 — Móvil 045"): los selectores usan `option-label="display_plate"`.
 */
export function formatVehicleOption(item) {
    if (!item || typeof item !== 'object') return item;

    const plate = toCleanString(item.raw_license_plate ?? item.vehicle_license_plate ?? item.plate);
    const internalNumber = toCleanString(item.internal_number);
    const line = toCleanString(item.line);
    const model = toCleanString(item.model);

    const basePlate = plate || internalNumber || 'Sin placa';
    const displayPlate = plate && internalNumber && !plate.includes(internalNumber)
        ? `${plate} — Móvil ${internalNumber}`
        : basePlate;

    const searchText = [plate, internalNumber, line, model, displayPlate]
        .filter(Boolean)
        .join(' ');

    return {
        ...item,
        raw_license_plate: plate || null,
        vehicle_license_plate: basePlate,
        display_plate: displayPlate,
        search_text: searchText,
    };
}

/**
 * Normaliza y deduplica un listado de vehículos para un selector.
 */
export function formatVehicleList(items) {
    const seen = new Set();
    const result = [];
    for (const item of toCatalogArray(items)) {
        if (!item || typeof item !== 'object') continue;
        const key = item.uuid ?? item.id ?? item.vehicle_license_plate ?? null;
        if (key !== null) {
            if (seen.has(key)) continue;
            seen.add(key);
        }
        result.push(formatVehicleOption(item));
    }
    return result;
}
