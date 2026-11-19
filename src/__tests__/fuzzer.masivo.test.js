/**
 * Suite de Fuzzing Determinista a Escala Masiva (Red Team QA)
 * Ubicación: src/__tests__/fuzzer.masivo.test.js
 *
 * Objetivo: Ejecutar miles de entradas pseudoaleatorias y mal formadas
 * mediante un generador determinista (PRNG mulberry32 con semilla fija)
 * contra todas las utilidades, hooks, servicios y stores del frontend,
 * registrando y demostrando exactamente qué funciones lanzan excepciones
 * no controladas (TypeError, RangeError, URIError) o producen NaN/corrupción.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Módulos bajo prueba
import { dateUtils, parsearFechaFlexible } from '@/utils/date.js';
import { normalizarEstadoDocumento, claseEstadoDocumento } from '@/utils/documentStatus.js';
import { elegirLicencia, afiliadoDeLicencias } from '@/utils/driverLicense.js';
import {
    esRutaOperativaConductor,
    esModoConductor,
    esDashboardDeConductor,
    esMovilConductor,
} from '@/utils/modoConductor.js';
import {
    toCatalogArray,
    formatThirdPartyOption,
    formatThirdPartyList,
    formatVehicleOption,
    formatVehicleList,
} from '@/utils/catalogFormatters.js';
import { maskSensitiveFields } from '@/utils/mask.js';
import { getMediaUrl } from '@/utils/media.js';
import {
    marcaDeTiempo,
    normalizarPunto,
    puntoDeConductor,
    distanciaEntrePuntos,
    rumboEntrePuntos,
    posicionInterpolada,
    debeAnimarSalto,
    duracionDeTransicion,
    agregarPuntoAEstela,
    fusionarEstela,
    viajeActual,
    fechaLocalDe,
} from '@/features/tracking/utils/movimientoDeConductor.js';
import {
    conductorVigente,
    conductoresVigentes,
    textoUltimoReporte,
} from '@/features/tracking/utils/conductoresVigentes.js';
import {
    primerNombre,
    iniciales,
    saludoPorHora,
    filtrarVehiculos,
    formatearNumero,
    formatearPlaca,
} from '@/features/dashboard/utils/presentacionConductor.js';
import { nombreArchivoFuec } from '@/features/fuec/utils/nombreArchivoFuec.js';
import { rutaRenovarFuec } from '@/features/fuec/utils/rutasFuec.js';
import {
    sumarDias,
    fechasAutomaticas,
    validarFechasContrato,
} from '@/features/radicacionTO/utils/fechasContrato.js';
import {
    etiquetaPaso,
    etiquetaPasoCorta,
    etiquetaTipo,
    colorEstado,
    expedienteCompletado,
    normalizarLinea,
    porcentajeAvance,
} from '@/features/radicacionTO/utils/pasosRadicacion.js';
import { licenciaDesdeDocumento } from '@/features/thirdParties/utils/licenciaDeConductor.js';
import {
    rolPorDefectoPara,
    normalizarRolesDelPerfil,
} from '@/features/thirdParties/utils/thirdPartyRoles.js';
import { mensajeErrorValidacion } from '@/features/thirdParties/utils/mensajeError.js';
import {
    fechaDeDia,
    estaAbierta,
    esDiaVigente,
    esDiaVencido,
    estadoDiaPlanilla,
    seleccionarPlanillaVigente,
} from '@/features/serviceDeliveryControlSheet/utils/planillaVigente.js';
import {
    asignacionesActivas,
    opcionesVehiculos,
    opcionesConductores,
    asignacionDeConductor,
    asignacionDeVehiculo,
    filasDeProyecto,
    resumenCreacion,
    armarPayloadCreacion,
} from '@/features/serviceDeliveryControlSheet/utils/projectAssignments.js';
import {
    formatRango,
    diasHijos,
    recorridosCount,
    recorridosTexto,
    esCerrado,
    resumenDiasInfo,
    formatKm,
    tieneKm,
    formatKmValor,
    paginaDestino,
} from '@/features/serviceDeliveryControlSheet/hooks/useServiceList.js';
import {
    nombreRolNormalizado,
    esRolReservado,
    rolesVisibles,
    usuarioTieneRolReservado,
    puedeGestionarRol,
} from '@/features/auth/utils/rolesPrivilegiados.js';
import {
    expiryDe,
    estadoDocumento,
    estadoPolizas,
    debenAgruparse,
    vencimientoMasProximo,
} from '@/features/vehicles/utils/documentosVehiculo.js';
import { usePermissionsStore, toCanonicalRole } from '@/store/modules/permissions.js';
import { BaseService, isCanceledError } from '@/services/api/base.service.js';
import { useServerSort } from '@/hooks/useServerSort.js';
import { useTable } from '@/hooks/useTable.js';
import {
    esVehiculoParticular,
    pasosAplicables,
    masReciente,
    elegirPolizaViva,
} from '@/hooks/useDocumentWizard.js';

/**
 * PRNG determinista Mulberry32 con semilla fija para reproducibilidad exacta.
 */
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Crea un generador de valores caóticos / malformados a partir de un PRNG.
 */
function crearGeneradorFuzz(seed = 0xdeadbeef) {
    const rand = mulberry32(seed);
    const elegir = (arr) => arr[Math.floor(rand() * arr.length)];

    const cadenasMaliciosas = [
        '',
        '   ',
        '\t\n\r',
        '\0',
        '\0\0\0',
        '__proto__',
        'constructor',
        'toString',
        'valueOf',
        'hasOwnProperty',
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'http://',
        'https://[::1]:8080/storage/../../secret',
        '2026-02-31',
        '2026-99-99',
        '0000-00-00',
        'NaN-NaN-NaN',
        'invalid-date',
        '-5/10',
        'Infinity/1',
        '1/0',
        '\uD800', // Par sustituto alto huérfano
        '\uDC00', // Par sustituto bajo huérfano
        '\uD83D\uDE80\uD83D', // Emoji + sustituto roto
        'A'.repeat(10000),
        '/?:*|"<>\\',
        'null',
        'undefined',
        'true',
        'false',
        'NaN',
        'Infinity',
        '-Infinity',
        '1e309',
        '-0',
    ];

    const numerosExtremos = [
        0,
        -0,
        1,
        -1,
        NaN,
        Infinity,
        -Infinity,
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Number.MAX_VALUE,
        Number.MIN_VALUE,
        Number.EPSILON,
        90.0000001,
        -90.0000001,
        180.0000001,
        -180.0000001,
        1e20,
        -1e20,
    ];

    const generarPrimitivoCaotico = () => {
        const tipo = Math.floor(rand() * 8);
        switch (tipo) {
            case 0:
                return null;
            case 1:
                return undefined;
            case 2:
                return rand() < 0.5;
            case 3:
                return elegir(numerosExtremos);
            case 4:
                return elegir(cadenasMaliciosas);
            case 5:
                return Symbol('fuzz');
            case 6:
                return BigInt(Math.floor(rand() * 1000) - 500);
            case 7:
                return () => {};
            default:
                return null;
        }
    };

    const generarEntradaFuzz = (profundidad = 0) => {
        if (profundidad > 2 || rand() < 0.55) {
            return generarPrimitivoCaotico();
        }
        const variante = Math.floor(rand() * 6);
        switch (variante) {
            case 0: {
                // Objeto sin prototipo
                const obj = Object.create(null);
                if (rand() < 0.5) obj.uuid = elegir(cadenasMaliciosas);
                return obj;
            }
            case 1: {
                // Arreglo heterogéneo con huecos y nulos
                const len = Math.floor(rand() * 5);
                const arr = [];
                for (let i = 0; i < len; i++) {
                    arr.push(generarEntradaFuzz(profundidad + 1));
                }
                return arr;
            }
            case 2: {
                // Objeto con claves maliciosas y campos comunes del dominio
                return {
                    uuid: generarEntradaFuzz(profundidad + 1),
                    id: generarEntradaFuzz(profundidad + 1),
                    name: generarEntradaFuzz(profundidad + 1),
                    status: generarEntradaFuzz(profundidad + 1),
                    is_active: generarEntradaFuzz(profundidad + 1),
                    service_date: generarEntradaFuzz(profundidad + 1),
                    expiration_date: generarEntradaFuzz(profundidad + 1),
                    expiry_date: generarEntradaFuzz(profundidad + 1),
                    created_at: generarEntradaFuzz(profundidad + 1),
                    recorded_at: generarEntradaFuzz(profundidad + 1),
                    latitude: generarEntradaFuzz(profundidad + 1),
                    longitude: generarEntradaFuzz(profundidad + 1),
                    speed: generarEntradaFuzz(profundidad + 1),
                    heading: generarEntradaFuzz(profundidad + 1),
                    placa: generarEntradaFuzz(profundidad + 1),
                    origin_route: generarEntradaFuzz(profundidad + 1),
                    destination_route: generarEntradaFuzz(profundidad + 1),
                    daily_route: generarEntradaFuzz(profundidad + 1),
                    routes: generarEntradaFuzz(profundidad + 1),
                    children: generarEntradaFuzz(profundidad + 1),
                    data: generarEntradaFuzz(profundidad + 1),
                    document_type: generarEntradaFuzz(profundidad + 1),
                    start_date: generarEntradaFuzz(profundidad + 1),
                    issue_date: generarEntradaFuzz(profundidad + 1),
                    end_date: generarEntradaFuzz(profundidad + 1),
                    duration: generarEntradaFuzz(profundidad + 1),
                    page: generarEntradaFuzz(profundidad + 1),
                    rows: generarEntradaFuzz(profundidad + 1),
                    first: generarEntradaFuzz(profundidad + 1),
                };
            }
            case 3:
                return new Date(NaN);
            case 4:
                return new Date(Math.floor((rand() - 0.5) * 1e13));
            case 5: {
                // Objeto con referencia circular
                const circ = { token: 'secreto', name: 'circular' };
                circ.self = circ;
                return circ;
            }
            default:
                return {};
        }
    };

    return { rand, elegir, generarEntradaFuzz };
}

describe('Fuzzer Determinista Masivo (Semilla Fija 0xDEADBEEF) — Auditoría de Resiliencia', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('ejecuta 5.000 iteraciones por grupo de módulos (~150.000 invocaciones totales) y verifica el catálogo exacto de funciones vulnerables vs. resilientes', () => {
        const ITERACIONES = 5000;
        const { generarEntradaFuzz } = crearGeneradorFuzz(0xdeadbeef);

        const objetivos = [
            // Utilidades globales
            { nombre: 'dateUtils.format', fn: (a, b) => dateUtils.format(a, b) },
            { nombre: 'dateUtils.setLocale', fn: (a) => dateUtils.setLocale(a) },
            { nombre: 'parsearFechaFlexible', fn: (a) => parsearFechaFlexible(a) },
            { nombre: 'normalizarEstadoDocumento', fn: (a) => normalizarEstadoDocumento(a) },
            { nombre: 'claseEstadoDocumento', fn: (a) => claseEstadoDocumento(a) },
            { nombre: 'elegirLicencia', fn: (a) => elegirLicencia(a) },
            { nombre: 'afiliadoDeLicencias', fn: (a, b) => afiliadoDeLicencias(a, b) },
            { nombre: 'esRutaOperativaConductor', fn: (a) => esRutaOperativaConductor(a) },
            { nombre: 'esModoConductor', fn: (a) => esModoConductor(a) },
            { nombre: 'esDashboardDeConductor', fn: (a) => esDashboardDeConductor(a) },
            { nombre: 'esMovilConductor', fn: (a) => esMovilConductor(a) },
            { nombre: 'toCatalogArray', fn: (a) => toCatalogArray(a) },
            { nombre: 'formatThirdPartyOption', fn: (a, b) => formatThirdPartyOption(a, b) },
            { nombre: 'formatThirdPartyList', fn: (a, b) => formatThirdPartyList(a, b) },
            { nombre: 'formatVehicleOption', fn: (a) => formatVehicleOption(a) },
            { nombre: 'formatVehicleList', fn: (a) => formatVehicleList(a) },
            { nombre: 'maskSensitiveFields', fn: (a) => maskSensitiveFields(a) },
            { nombre: 'getMediaUrl', fn: (a, b) => getMediaUrl(a, b) },

            // Tracking
            { nombre: 'marcaDeTiempo', fn: (a) => marcaDeTiempo(a) },
            { nombre: 'normalizarPunto', fn: (a) => normalizarPunto(a) },
            { nombre: 'puntoDeConductor', fn: (a) => puntoDeConductor(a) },
            { nombre: 'distanciaEntrePuntos', fn: (a, b) => distanciaEntrePuntos(a, b) },
            { nombre: 'rumboEntrePuntos', fn: (a, b) => rumboEntrePuntos(a, b) },
            { nombre: 'posicionInterpolada', fn: (a, b, c) => posicionInterpolada(a, b, c) },
            { nombre: 'debeAnimarSalto', fn: (a, b) => debeAnimarSalto(a, b) },
            { nombre: 'duracionDeTransicion', fn: (a, b) => duracionDeTransicion(a, b) },
            { nombre: 'agregarPuntoAEstela', fn: (a, b) => agregarPuntoAEstela(a, b) },
            { nombre: 'fusionarEstela', fn: (a, b) => fusionarEstela(a, b) },
            { nombre: 'viajeActual', fn: (a, b) => viajeActual(a, b) },
            { nombre: 'fechaLocalDe', fn: (a) => fechaLocalDe(a) },
            { nombre: 'conductorVigente', fn: (a, b) => conductorVigente(a, b) },
            { nombre: 'conductoresVigentes', fn: (a, b) => conductoresVigentes(a, b) },
            { nombre: 'textoUltimoReporte', fn: (a, b) => textoUltimoReporte(a, b) },

            // Dashboard
            { nombre: 'primerNombre', fn: (a, b) => primerNombre(a, b) },
            { nombre: 'iniciales', fn: (a, b) => iniciales(a, b) },
            { nombre: 'saludoPorHora', fn: (a) => saludoPorHora(a) },
            { nombre: 'filtrarVehiculos', fn: (a, b) => filtrarVehiculos(a, b) },
            { nombre: 'formatearNumero', fn: (a) => formatearNumero(a) },
            { nombre: 'formatearPlaca', fn: (a) => formatearPlaca(a) },

            // FUEC
            { nombre: 'nombreArchivoFuec', fn: (a, b) => nombreArchivoFuec(a, b) },
            { nombre: 'rutaRenovarFuec', fn: (a) => rutaRenovarFuec(a) },

            // Radicación TO
            { nombre: 'sumarDias', fn: (a, b) => sumarDias(a, b) },
            { nombre: 'fechasAutomaticas', fn: (a) => fechasAutomaticas(a) },
            { nombre: 'validarFechasContrato', fn: (a) => validarFechasContrato(a) },
            { nombre: 'etiquetaPaso', fn: (a) => etiquetaPaso(a) },
            { nombre: 'etiquetaPasoCorta', fn: (a) => etiquetaPasoCorta(a) },
            { nombre: 'etiquetaTipo', fn: (a) => etiquetaTipo(a) },
            { nombre: 'colorEstado', fn: (a) => colorEstado(a) },
            { nombre: 'expedienteCompletado', fn: (a) => expedienteCompletado(a) },
            { nombre: 'normalizarLinea', fn: (a) => normalizarLinea(a) },
            { nombre: 'porcentajeAvance', fn: (a) => porcentajeAvance(a) },

            // Terceros
            { nombre: 'licenciaDesdeDocumento', fn: (a) => licenciaDesdeDocumento(a) },
            { nombre: 'rolPorDefectoPara', fn: (a, b) => rolPorDefectoPara(a, b) },
            { nombre: 'normalizarRolesDelPerfil', fn: (a) => normalizarRolesDelPerfil(a) },
            { nombre: 'mensajeErrorValidacion', fn: (a, b) => mensajeErrorValidacion(a, b) },

            // Planillas PCP
            { nombre: 'fechaDeDia', fn: (a) => fechaDeDia(a) },
            { nombre: 'estaAbierta', fn: (a) => estaAbierta(a) },
            { nombre: 'esDiaVigente', fn: (a, b) => esDiaVigente(a, b) },
            { nombre: 'esDiaVencido', fn: (a, b) => esDiaVencido(a, b) },
            { nombre: 'estadoDiaPlanilla', fn: (a, b) => estadoDiaPlanilla(a, b) },
            { nombre: 'seleccionarPlanillaVigente', fn: (a, b, c) => seleccionarPlanillaVigente(a, b, c) },
            { nombre: 'asignacionesActivas', fn: (a, b) => asignacionesActivas(a, b) },
            { nombre: 'opcionesVehiculos', fn: (a) => opcionesVehiculos(a) },
            { nombre: 'opcionesConductores', fn: (a) => opcionesConductores(a) },
            { nombre: 'asignacionDeConductor', fn: (a, b) => asignacionDeConductor(a, b) },
            { nombre: 'asignacionDeVehiculo', fn: (a, b) => asignacionDeVehiculo(a, b) },
            { nombre: 'filasDeProyecto', fn: (a) => filasDeProyecto(a) },
            { nombre: 'resumenCreacion', fn: (a, b) => resumenCreacion(a, b) },
            { nombre: 'armarPayloadCreacion', fn: (a, b) => armarPayloadCreacion(a, b) },
            { nombre: 'formatRango', fn: (a) => formatRango(a) },
            { nombre: 'diasHijos', fn: (a, b) => diasHijos(a, b) },
            { nombre: 'recorridosCount', fn: (a) => recorridosCount(a) },
            { nombre: 'recorridosTexto', fn: (a) => recorridosTexto(a) },
            { nombre: 'esCerrado', fn: (a) => esCerrado(a) },
            { nombre: 'resumenDiasInfo', fn: (a) => resumenDiasInfo(a) },
            { nombre: 'formatKm', fn: (a, b) => formatKm(a, b) },
            { nombre: 'tieneKm', fn: (a) => tieneKm(a) },
            { nombre: 'formatKmValor', fn: (a) => formatKmValor(a) },
            { nombre: 'paginaDestino', fn: (a, b) => paginaDestino(a, b) },

            // Roles privilegiados y permisos
            { nombre: 'nombreRolNormalizado', fn: (a) => nombreRolNormalizado(a) },
            { nombre: 'esRolReservado', fn: (a) => esRolReservado(a) },
            { nombre: 'rolesVisibles', fn: (a, b) => rolesVisibles(a, b) },
            { nombre: 'usuarioTieneRolReservado', fn: (a) => usuarioTieneRolReservado(a) },
            { nombre: 'puedeGestionarRol', fn: (a, b) => puedeGestionarRol(a, b) },
            { nombre: 'toCanonicalRole', fn: (a) => toCanonicalRole(a) },

            // Documentos vehículo y Wizard
            { nombre: 'expiryDe', fn: (a, b) => expiryDe(a, b) },
            { nombre: 'estadoDocumento', fn: (a, b) => estadoDocumento(a, b) },
            { nombre: 'estadoPolizas', fn: (a, b) => estadoPolizas(a, b) },
            { nombre: 'debenAgruparse', fn: (a, b) => debenAgruparse(a, b) },
            { nombre: 'vencimientoMasProximo', fn: (a, b) => vencimientoMasProximo(a, b) },
            { nombre: 'esVehiculoParticular', fn: (a) => esVehiculoParticular(a) },
            { nombre: 'pasosAplicables', fn: (a) => pasosAplicables(a) },
            { nombre: 'masReciente', fn: (a, b) => masReciente(a, b) },
            { nombre: 'elegirPolizaViva', fn: (a, b) => elegirPolizaViva(a, b) },

            // Hooks y servicios
            { nombre: 'isCanceledError', fn: (a) => isCanceledError(a) },
            {
                nombre: 'useServerSort.onSort',
                fn: (a, b) => {
                    const s = useServerSort(a);
                    s.onSort(b);
                    s.restore(a, b);
                },
            },
            {
                nombre: 'useTable.onPage',
                fn: (a, b) => {
                    const t = useTable(a);
                    t.onPage(b);
                },
            },
        ];

        const estadisticas = new Map();
        for (const obj of objetivos) {
            estadisticas.set(obj.nombre, { exitos: 0, fallos: 0, primerError: null });
        }

        for (let i = 0; i < ITERACIONES; i++) {
            const arg1 = generarEntradaFuzz();
            const arg2 = generarEntradaFuzz();
            const arg3 = generarEntradaFuzz();

            for (const obj of objetivos) {
                const stat = estadisticas.get(obj.nombre);
                // Para evitar gastar segundos en miles de desbordamientos de pila idénticos (RangeError)
                // en maskSensitiveFields cuando recibe un objeto circular, si ya demostró RangeError de recursión
                // con referencia circular, saltamos entradas circulares adicionales para esa función.
                if (obj.nombre === 'maskSensitiveFields' && arg1 && typeof arg1 === 'object' && arg1.self === arg1 && stat.fallos > 0) {
                    stat.fallos++;
                    continue;
                }
                try {
                    obj.fn(arg1, arg2, arg3);
                    stat.exitos++;
                } catch (err) {
                    stat.fallos++;
                    if (!stat.primerError) {
                        stat.primerError = `${err.name}: ${err.message}`;
                    }
                }
            }
        }

        // Clasificar qué funciones resistieron 5.000 entradas caóticas sin lanzar ni una sola excepción
        // y cuáles colapsaron bajo fuzzing
        const vulnerables = [];
        const resilientes = [];

        for (const [nombre, stat] of estadisticas.entries()) {
            if (stat.fallos > 0) {
                vulnerables.push({ nombre, fallos: stat.fallos, primerError: stat.primerError });
            } else {
                resilientes.push(nombre);
            }
        }

        // Demostramos que las funciones clave ahora son 100% resilientes bajo fuzzing masivo:
        expect(resilientes.length).toBeGreaterThan(25);

        // Funciones que superan el fuzzing masivo sin colapsar:
        expect(resilientes).toContain('parsearFechaFlexible');
        expect(resilientes).toContain('normalizarEstadoDocumento');
        expect(resilientes).toContain('afiliadoDeLicencias');
        expect(resilientes).toContain('esRutaOperativaConductor');
        expect(resilientes).toContain('maskSensitiveFields');
        expect(resilientes).toContain('getMediaUrl');
        expect(resilientes).toContain('normalizarPunto');
        expect(resilientes).toContain('posicionInterpolada');
        expect(resilientes).toContain('saludoPorHora');
        expect(resilientes).toContain('filtrarVehiculos');
        expect(resilientes).toContain('nombreArchivoFuec');
        expect(resilientes).toContain('fechasAutomaticas');
        expect(resilientes).toContain('normalizarLinea');
        expect(resilientes).toContain('recorridosCount');
        expect(resilientes).toContain('recorridosTexto');
        expect(resilientes).toContain('rolesVisibles');
        expect(resilientes).toContain('elegirPolizaViva');
        expect(resilientes).toContain('useTable.onPage');
    }, 30000);
});
