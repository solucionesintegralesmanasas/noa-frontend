// Elige qué licencia mostrar cuando un conductor tiene varias.
// El endpoint no ordena (orden de BD: la más vieja primero), así que:
// - estado tolerante (mayúsculas/espacios, 1/true heredados),
// - entre ACTIVAs, la de vencimiento más lejano (la renovación),
// - sin ninguna ACTIVA, la más reciente para que el mensaje refleje
//   la realidad en vez de una licencia vieja.
// Sin licencias: null.
export function elegirLicencia(licenses) {
    if (!Array.isArray(licenses) || licenses.length === 0) return null;

    const toSafeString = (v) => (v == null || typeof v === 'symbol' || (typeof v === 'object' && !(v instanceof Date)) ? '' : String(v));

    const esActiva = (l) => {
        if (!l || typeof l !== 'object') return false;
        if (l.status === 1 || l.status === true) return true;
        return toSafeString(l.status).trim().toUpperCase() === 'ACTIVA';
    };

    const vence = (l) => {
        if (!l || typeof l !== 'object') return -Infinity;
        const f = toSafeString(l.expiration_date).slice(0, 10);
        const t = Date.parse(f);
        return Number.isNaN(t) ? -Infinity : t;
    };

    const porRecencia = (a, b) => vence(b) - vence(a);

    const activas = licenses.filter(esActiva).sort(porRecencia);
    if (activas.length > 0) return activas[0];
    return [...licenses].sort(porRecencia)[0];
}

// Devuelve el uuid del afiliado propietario del conductor a partir de sus
// licencias, validándolo contra el catálogo de afiliados. Cuando la renovación
// no heredó el propietario, la licencia ACTIVA apunta al propio conductor y la
// vieja conserva al afiliado real: se busca entre todas, no solo en la elegida.
export function afiliadoDeLicencias(licenses, catalogoAfiliados = []) {
    if (!Array.isArray(licenses) || licenses.length === 0) return null;

    const listaAfiliados = Array.isArray(catalogoAfiliados)
        ? catalogoAfiliados
        : (Array.isArray(catalogoAfiliados?.data) ? catalogoAfiliados.data : []);

    const afiliados = new Set(listaAfiliados.map((a) => a?.uuid).filter(Boolean));
    const uuidDe = (owner) => owner?.third_party_uuid ?? owner?.thirdPartyUuid ?? null;

    const elegida = elegirLicencia(licenses);
    const uuidElegida = uuidDe(elegida?.owner_driver ?? elegida?.ownerDriver);
    if (uuidElegida && afiliados.has(uuidElegida)) return uuidElegida;

    for (const licencia of licenses) {
        if (!licencia || typeof licencia !== 'object') continue;
        const uuid = uuidDe(licencia.owner_driver ?? licencia.ownerDriver);
        if (uuid && afiliados.has(uuid)) return uuid;
    }

    // Respaldo: conserva el comportamiento previo aunque el propietario no
    // figure en el catálogo (p. ej. catálogo aún sin cargar).
    return uuidElegida;
}
