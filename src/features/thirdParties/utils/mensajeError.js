// Extrae el motivo real de un rechazo del backend para mostrarlo en un toast.
// Los errores de validación viajan en `error.details` (formato del manejador)
// o en `errors` (formato Laravel); el `message` genérico no dice qué corregir.
// (Separador ASCII a propósito: el punto medio rompe la codificación.)
export function mensajeErrorValidacion(error, porDefecto = 'No se pudo guardar') {
    const unir = (campo, msgs) => {
        const lista = Array.isArray(msgs) ? msgs : [msgs];
        const formateados = lista.map((m) => {
            if (typeof m === "string") return m;
            if (m && typeof m === "object") return m.message || m.error || m.nested || JSON.stringify(m);
            try { return String(m); } catch { return ""; }
        }).filter(Boolean);
        let nombreCampo = "campo";
        try { nombreCampo = String(campo).replace(/_/g, " "); } catch {}
        return `${nombreCampo}: ${formateados.join(" ")}`;
    };
    const data = error?.response?.data;
    const detalles = data?.error?.details;
    if (detalles && typeof detalles === 'object' && !Array.isArray(detalles)) {
        const campos = Object.entries(detalles)
            .filter(([, msgs]) => (Array.isArray(msgs) ? msgs.length > 0 : Boolean(msgs)))
            .map(([campo, msgs]) => unir(campo, msgs));
        if (campos.length > 0) return campos.join(' - ');
    }
    const errores = data?.errors;
    if (errores && typeof errores === 'object') {
        const campos = Object.entries(errores).map(([campo, msgs]) => unir(campo, msgs));
        if (campos.length > 0) return campos.join(' - ');
    }
    return data?.message ?? error?.message ?? porDefecto;
}
