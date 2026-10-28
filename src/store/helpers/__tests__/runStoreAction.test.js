import { describe, it, expect, vi } from "vitest";
import {
    runStoreAction,
    extractStoreErrorMessage,
    FALLBACK_ERROR_MESSAGE,
} from "../runStoreAction.js";

function estado() {
    return { loading: false, error: "previo" };
}

function deps() {
    return { notify: vi.fn(async () => {}), logger: { warn: vi.fn(), error: vi.fn() } };
}

describe("extractStoreErrorMessage", () => {
    it("prefiere el mensaje del backend al del error", () => {
        const error = new Error("Fallo genérico");
        error.response = { data: { message: "Vehículo no encontrado" } };
        expect(extractStoreErrorMessage(error, "Respaldo")).toBe("Vehículo no encontrado");
    });
    it("nunca queda vacío aunque falte todo", () => {
        expect(extractStoreErrorMessage(null, "")).toBe(FALLBACK_ERROR_MESSAGE);
    });
});

describe("runStoreAction", () => {
    it("en éxito devuelve el valor y limpia el estado sin avisar", async () => {
        const store = estado();
        const d = deps();
        const resultado = await runStoreAction(store, async () => 42, "Respaldo", d);
        expect(resultado).toBe(42);
        expect(store.loading).toBe(false);
        expect(store.error).toBe(null);
        expect(d.notify).not.toHaveBeenCalled();
    });

    it("ignora peticiones canceladas (ERR_CANCELED) sin mostrar aviso ni guardar error", async () => {
        const store = estado();
        const d = deps();
        const cancelado = new Error("canceled");
        cancelado.code = "ERR_CANCELED";
        const res = await runStoreAction(store, async () => { throw cancelado; }, "Respaldo", d);
        expect(res).toBeUndefined();
        expect(store.error).toBe(null);
        expect(store.loading).toBe(false);
        expect(d.notify).not.toHaveBeenCalled();
    });

    it("mantiene loading=true mientras haya otra petición activa en vuelo", async () => {
        const store = estado();
        const d = deps();
        let resolverSegunda;
        const segundaPromesa = new Promise((r) => { resolverSegunda = r; });

        const p1 = runStoreAction(store, async () => "primera", "Respaldo", d);
        const p2 = runStoreAction(store, () => segundaPromesa, "Respaldo", d);

        await p1;
        expect(store.loading).toBe(true);

        resolverSegunda("segunda");
        await p2;
        expect(store.loading).toBe(false);
    });
});
