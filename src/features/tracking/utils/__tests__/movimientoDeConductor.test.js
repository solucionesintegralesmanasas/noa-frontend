// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
    agregarPuntoAEstela,
    debeAnimarSalto,
    distanciaEntrePuntos,
    duracionDeTransicion,
    DURACION_MAX_MS,
    DURACION_MIN_MS,
    fechaLocalDe,
    fusionarEstela,
    marcaDeTiempo,
    normalizarPunto,
    puntoDeConductor,
    posicionInterpolada,
    rumboEntrePuntos,
    UMBRAL_SALTO_M,
    UMBRAL_VIAJE_MS,
    viajeActual,
} from '../movimientoDeConductor';

const ORIGEN = { latitude: 4.65, longitude: -74.05 };

function punto(minuto, extra = {}) {
    return {
        latitude: 4.65,
        longitude: -74.05 + minuto * 0.001,
        speed: 30,
        recorded_at: `2026-10-26T10:${String(minuto).padStart(2, '0')}:00.000Z`,
        ...extra,
    };
}

describe('normalizarPunto', () => {
    it('acepta coordenadas válidas y convierte números', () => {
        const normalizado = normalizarPunto({ latitude: '4.65', longitude: '-74.05', speed: '42' });
        expect(normalizado.latitude).toBe(4.65);
        expect(normalizado.longitude).toBe(-74.05);
        expect(normalizado.speed).toBe(42);
    });

    it('rechaza coordenadas inválidas', () => {
        expect(normalizarPunto({ latitude: 'x', longitude: -74.05 })).toBeNull();
        expect(normalizarPunto({ latitude: 95, longitude: -74.05 })).toBeNull();
        expect(normalizarPunto(null)).toBeNull();
    });

    it('conserva el rumbo solo cuando viene como número', () => {
        expect(normalizarPunto({ latitude: 4.65, longitude: -74.05, heading: 180 }).heading).toBe(180);
        expect(normalizarPunto({ latitude: 4.65, longitude: -74.05 }).heading).toBeNull();
    });
});

describe('puntoDeConductor', () => {
    it('lee la forma plana del conductor', () => {
        const puntoPlano = puntoDeConductor({ latitude: 4.65, longitude: -74.05, is_moving: true, recorded_at: '2026-10-26T10:00:00.000Z' });
        expect(puntoPlano.is_moving).toBe(true);
        expect(puntoPlano.recorded_at).toBe('2026-10-26T10:00:00.000Z');
    });

    it('lee la forma anidada en last_location', () => {
        const anidado = puntoDeConductor({ third_party_uuid: 'drv-1', last_location: { latitude: 4.65, longitude: -74.05, speed: 12 } });
        expect(anidado.latitude).toBe(4.65);
        expect(anidado.speed).toBe(12);
    });
});

describe('distancia y rumbo', () => {
    it('la distancia del mismo punto es cero', () => {
        expect(distanciaEntrePuntos(ORIGEN, ORIGEN)).toBe(0);
    });

    it('0.001° de latitud son unos 111 metros', () => {
        const metros = distanciaEntrePuntos(ORIGEN, { latitude: 4.651, longitude: -74.05 });
        expect(metros).toBeGreaterThan(100);
        expect(metros).toBeLessThan(120);
    });

    it('el rumbo al norte es 0 y al este es 90', () => {
        expect(rumboEntrePuntos(ORIGEN, { latitude: 4.66, longitude: -74.05 })).toBeCloseTo(0, 0);
        expect(rumboEntrePuntos(ORIGEN, { latitude: 4.65, longitude: -74.04 })).toBeCloseTo(90, 0);
    });
});

describe('posicionInterpolada', () => {
    const desde = { latitude: 4.65, longitude: -74.05 };
    const hasta = { latitude: 4.67, longitude: -74.03 };

    it('en t=0 devuelve el origen y en t=1 el destino', () => {
        expect(posicionInterpolada(desde, hasta, 0)).toEqual([4.65, -74.05]);
        expect(posicionInterpolada(desde, hasta, 1)).toEqual([4.67, -74.03]);
    });

    it('en t=0.5 devuelve el punto medio', () => {
        const [lat, lng] = posicionInterpolada(desde, hasta, 0.5);
        expect(lat).toBeCloseTo(4.66, 6);
        expect(lng).toBeCloseTo(-74.04, 6);
    });

    it('acota t fuera de rango', () => {
        expect(posicionInterpolada(desde, hasta, 5)).toEqual([4.67, -74.03]);
        expect(posicionInterpolada(desde, hasta, -1)).toEqual([4.65, -74.05]);
    });
});

describe('debeAnimarSalto y duracionDeTransicion', () => {
    it('anima un desplazamiento corto pero no el mismo punto', () => {
        const cerca = { latitude: 4.6505, longitude: -74.05 };
        expect(debeAnimarSalto(ORIGEN, cerca)).toBe(true);
        expect(debeAnimarSalto(ORIGEN, ORIGEN)).toBe(false);
    });

    it('no anima un teletransporte mayor que el umbral', () => {
        const lejos = { latitude: 4.75, longitude: -74.05 };
        expect(debeAnimarSalto(ORIGEN, lejos)).toBe(false);
        expect(distanciaEntrePuntos(ORIGEN, lejos)).toBeGreaterThan(UMBRAL_SALTO_M);
    });

    it('la duración queda entre los límites', () => {
        const corto = duracionDeTransicion(ORIGEN, { latitude: 4.6501, longitude: -74.05 });
        const largo = duracionDeTransicion(ORIGEN, { latitude: 4.69, longitude: -74.05 });
        expect(corto).toBeGreaterThanOrEqual(DURACION_MIN_MS);
        expect(largo).toBeLessThanOrEqual(DURACION_MAX_MS);
        expect(largo).toBeGreaterThan(corto);
    });
});

describe('agregarPuntoAEstela', () => {
    it('descarta el duplicado con la misma hora', () => {
        const lista = agregarPuntoAEstela(agregarPuntoAEstela([], punto(0)), punto(0));
        expect(lista).toHaveLength(1);
    });

    it('inserta ordenado aunque llegue un punto atrasado', () => {
        let estela = agregarPuntoAEstela([], punto(2));
        estela = agregarPuntoAEstela(estela, punto(1));
        estela = agregarPuntoAEstela(estela, punto(3));
        expect(estela.map((p) => marcaDeTiempo(p))).toEqual([
            marcaDeTiempo(punto(1)),
            marcaDeTiempo(punto(2)),
            marcaDeTiempo(punto(3)),
        ]);
    });

    it('recorta los más viejos al pasar el tope', () => {
        let estela = [];
        for (let i = 0; i < 6; i += 1) estela = agregarPuntoAEstela(estela, punto(i), 3);
        expect(estela).toHaveLength(3);
        expect(marcaDeTiempo(estela[0])).toBe(marcaDeTiempo(punto(3)));
        expect(marcaDeTiempo(estela[2])).toBe(marcaDeTiempo(punto(5)));
    });

    it('ignora un punto sin coordenadas usables', () => {
        const estela = agregarPuntoAEstela([punto(0)], { latitude: 'x', longitude: 'y' });
        expect(estela).toHaveLength(1);
    });

    it('no repite un punto sin hora con las mismas coordenadas del último', () => {
        const sinHora = { latitude: 4.65, longitude: -74.06 };
        let estela = agregarPuntoAEstela([], sinHora);
        estela = agregarPuntoAEstela(estela, { ...sinHora });
        expect(estela).toHaveLength(1);
    });
});

describe('fusionarEstela', () => {
    it('une semilla y puntos en vivo sin duplicados, en orden', () => {
        const fusion = fusionarEstela([punto(0), punto(2)], [punto(1), punto(2)]);
        expect(fusion.map((p) => marcaDeTiempo(p))).toEqual([
            marcaDeTiempo(punto(0)),
            marcaDeTiempo(punto(1)),
            marcaDeTiempo(punto(2)),
        ]);
    });
});

describe('viajeActual', () => {
    it('devuelve la lista entera cuando no hay silencios', () => {
        const puntos = [punto(0), punto(1), punto(2)];
        expect(viajeActual(puntos)).toHaveLength(3);
    });

    it('corta en el silencio largo y conserva el punto de arranque', () => {
        const viejo = { ...punto(0), recorded_at: '2026-10-26T08:00:00.000Z' };
        const reciente = { ...punto(0), recorded_at: '2026-10-26T10:00:00.000Z' };
        const tramo = viajeActual([viejo, reciente, { ...punto(0), recorded_at: '2026-10-26T10:10:00.000Z' }]);
        expect(tramo).toHaveLength(2);
        expect(marcaDeTiempo(tramo[0])).toBe(marcaDeTiempo(reciente));
    });

    it('el umbral separa silencio de pausa corta', () => {
        const pausa = { ...punto(0), recorded_at: '2026-10-26T10:00:00.000Z' };
        const luego = { ...punto(0), recorded_at: new Date(pausa.recorded_at).getTime() + UMBRAL_VIAJE_MS / 2 };
        expect(viajeActual([pausa, { ...punto(0), recorded_at: luego }])).toHaveLength(2);
    });
});

describe('fechaLocalDe', () => {
    it('formatea la fecha local como YYYY-MM-DD', () => {
        expect(fechaLocalDe(new Date(2026, 9, 26))).toBe('2026-10-26');
        expect(fechaLocalDe(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
});
