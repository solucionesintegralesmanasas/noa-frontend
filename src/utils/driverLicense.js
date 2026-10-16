// Elige qué licencia mostrar cuando un conductor tiene varias.
// El endpoint no ordena (orden de BD: la más vieja primero), así que:
// - estado tolerante (mayúsculas/espacios, 1/true heredados),
// - entre ACTIVAs, la de vencimiento más lejano (la renovación),
// - sin ninguna ACTIVA, la más reciente para que el mensaje refleje
//   la realidad en vez de una licencia vieja.
// Sin licencias: null.
export function elegirLicencia(licenses) {
    if (!Array.isArray(licenses) || licenses.length === 0) return null;

    const esActiva = (l) => {
        if (l?.status === 1 || l?.status === true) return true;
        return String(l?.status ?? '').trim().toUpperCase() === 'ACTIVA';
    };

    const vence = (l) => {
        const f = String(l?.expiration_date ?? '').slice(0, 10);
        const t = Date.parse(f);
        return Number.isNaN(t) ? -Infinity : t;
    };

    const porRecencia = (a, b) => vence(b) - vence(a);

    const activas = licenses.filter(esActiva).sort(porRecencia);
    if (activas.length > 0) return activas[0];
    return [...licenses].sort(porRecencia)[0];
}
