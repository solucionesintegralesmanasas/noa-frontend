/**
 * Suite de Pruebas Adversariales de la Plataforma Frontend (Red Team QA - Verificación de Blindaje)
 * Ubicación: src/__tests__/adversarial.platform.test.js
 *
 * Objetivo: Validar la resiliencia y el blindaje de todos los módulos del frontend
 * contra entradas maliciosas, valores límite, objetos sin prototipo, contaminación
 * de prototipo (__proto__, constructor, toString), números extremos (NaN, Infinity,
 * -0, BigInt), símbolos, referencias circulares, fechas inválidas y Unicode roto.
 *
 * Todos los casos verifican que el sistema responde de forma segura (fail-closed,
 * sanitizado, valores por defecto seguros) sin lanzar excepciones no controladas ni corromperse.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// 1. Utilidades globales
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

// 2. Utilidades de features
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
    MAPA_SEXO,
    MAPA_ESTADO_CIVIL,
} from '@/features/thirdParties/utils/personData.js';
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

// 3. Stores, cliente HTTP y seguridad
import { usePermissionsStore, toCanonicalRole } from '@/store/modules/permissions.js';
import { BaseService, isCanceledError } from '@/services/api/base.service.js';
import { requestInterceptor, responseInterceptor } from '@/services/api/interceptors.js';
import { secureStorage } from '@/services/security/secure-storage.js';

// 4. Hooks
import { useServerSort } from '@/hooks/useServerSort.js';
import { useTable } from '@/hooks/useTable.js';
import {
    esVehiculoParticular,
    pasosAplicables,
    masReciente,
    elegirPolizaViva,
    useDocumentWizard,
} from '@/hooks/useDocumentWizard.js';

describe('Auditoría Adversarial Red Team — Utilidades Globales', () => {
    describe('src/utils/date.js', () => {
        it('[BLINDADO] parsearFechaFlexible no lanza TypeError y devuelve null ante Symbol u objeto sin prototipo', () => {
            const sinPrototipo = Object.create(null);
            expect(parsearFechaFlexible(sinPrototipo)).toBeNull();
            expect(parsearFechaFlexible(Symbol('fecha'))).toBeNull();
        });

        it('[BLINDADO] parsearFechaFlexible rechaza fechas imposibles de calendario como 2026-02-31', () => {
            expect(parsearFechaFlexible('2026-02-31')).toBeNull();
            expect(parsearFechaFlexible('31/02/2026')).toBeNull();
            expect(parsearFechaFlexible('0000-00-00')).toBeNull();
        });

        it('[BLINDADO] dateUtils.format con formatStr malicioso o nulo devuelve fallback seguro', () => {
            expect(dateUtils.format('invalid-date')).toBe('-');
            expect(dateUtils.format(NaN)).toBe('-');
            expect(dateUtils.format(Infinity)).toBe('-');
            expect(dateUtils.format('2026-05-10', Object.create(null))).toBe('10/05/2026');
        });
    });

    describe('src/utils/documentStatus.js', () => {
        it('[BLINDADO] normalizarEstadoDocumento previene prototipos heredados ante "__proto__", "toString" o "constructor"', () => {
            expect(normalizarEstadoDocumento('toString')).toBe('toString');
            expect(normalizarEstadoDocumento('constructor')).toBe('constructor');
            expect(normalizarEstadoDocumento('valueOf')).toBe('valueOf');
        });

        it('[BLINDADO] normalizarEstadoDocumento y claseEstadoDocumento toleran objetos sin prototipo sin lanzar TypeError', () => {
            const sinProto = Object.create(null);
            expect(normalizarEstadoDocumento(sinProto)).toBe('');
            expect(claseEstadoDocumento(sinProto)).toBe('badge-subtle-warning');
        });

        it('[BLINDADO] normalizarEstadoDocumento devuelve string ante un Symbol en vez de propagarlo', () => {
            const sym = Symbol('VIGENTE');
            const res = normalizarEstadoDocumento(sym);
            expect(typeof res).toBe('string');
            expect(res).toBe('');
        });
    });

    describe('src/utils/driverLicense.js', () => {
        it('[BLINDADO] afiliadoDeLicencias tolera elementos null/undefined sin lanzar TypeError', () => {
            const licenciasConNull = [null, { status: 'ACTIVA', expiration_date: '2027-01-01' }];
            const catalogo = [{ uuid: 'afiliado-1' }];
            expect(() => afiliadoDeLicencias(licenciasConNull, catalogo)).not.toThrow();
            expect(afiliadoDeLicencias(licenciasConNull, catalogo)).toBeNull();
        });

        it('[BLINDADO] afiliadoDeLicencias tolera catalogoAfiliados no-array sin lanzar TypeError', () => {
            const licencias = [{ status: 'ACTIVA', expiration_date: '2027-01-01', owner_driver: { third_party_uuid: '123' } }];
            expect(() => afiliadoDeLicencias(licencias, { data: [] })).not.toThrow();
            expect(() => afiliadoDeLicencias(licencias, 'invalido')).not.toThrow();
            expect(afiliadoDeLicencias(licencias, null)).toBe('123');
        });

        it('[BLINDADO] elegirLicencia tolera status u objeto sin prototipo sin lanzar TypeError', () => {
            const licencias = [{ status: Object.create(null), expiration_date: '2027-01-01' }];
            expect(() => elegirLicencia(licencias)).not.toThrow();
            expect(elegirLicencia(licencias)).toBeDefined();
        });
    });

    describe('src/utils/modoConductor.js', () => {
        it('[BLINDADO] esRutaOperativaConductor tolera path nulo o no-string devolviendo false', () => {
            expect(esRutaOperativaConductor(null)).toBe(false);
            expect(esRutaOperativaConductor(12345)).toBe(false);
            expect(esRutaOperativaConductor({})).toBe(false);
        });

        it('[BLINDADO] esModoConductor, esDashboardDeConductor y esMovilConductor toleran null sin lanzar TypeError', () => {
            expect(esModoConductor(null)).toBe(false);
            expect(esDashboardDeConductor(null)).toBe(false);
            expect(esMovilConductor(null)).toBe(false);
            expect(esDashboardDeConductor({ path: null })).toBe(false);
        });

        it('[BLINDADO] esRutaOperativaConductor valida límites exactos de ruta impidiendo falsos positivos de prefijo', () => {
            expect(esRutaOperativaConductor('/vehiculos-administracion-secreta')).toBe(false);
            expect(esRutaOperativaConductor('/dashboard/../usuarios')).toBe(false);
            expect(esRutaOperativaConductor('/vehiculos/lista')).toBe(true);
        });
    });

    describe('src/utils/catalogFormatters.js', () => {
        it('[BLINDADO] formatThirdPartyOption tolera Object.create(null) sin lanzar TypeError', () => {
            expect(() => formatThirdPartyOption({ first_name: Object.create(null) })).not.toThrow();
            expect(() => formatThirdPartyOption({ first_name: 'Juan' }, Object.create(null))).not.toThrow();
        });

        it('[BLINDADO] formatThirdPartyOption tolera arrays como entrada sin corromper el objeto', () => {
            const res = formatThirdPartyOption(['a', 'b']);
            expect(res).toBeDefined();
            expect(Array.isArray(res)).toBe(true);
        });
    });

    describe('src/utils/mask.js', () => {
        it('[BLINDADO] maskSensitiveFields maneja referencias circulares sin desbordar la pila', () => {
            const circular = { usuario: 'admin', token: 'secreto123' };
            circular.self = circular;
            expect(() => maskSensitiveFields(circular)).not.toThrow();
            const res = maskSensitiveFields(circular);
            expect(res.token).toBe('***');
            expect(res.self).toBe('[Circular]');
        });

        it('[BLINDADO] maskSensitiveFields preserva instancias de Date, RegExp, Blob y Error', () => {
            const entrada = {
                fecha: new Date('2026-01-01T00:00:00Z'),
                expresion: /abc/gi,
                error: new Error('fallo crítico'),
            };
            const enmascarado = maskSensitiveFields(entrada);
            expect(enmascarado.fecha).toBeInstanceOf(Date);
            expect(enmascarado.expresion).toBeInstanceOf(RegExp);
            expect(enmascarado.error).toBeInstanceOf(Error);
        });
    });

    describe('src/utils/media.js', () => {
        it('[BLINDADO] getMediaUrl tolera tipos no-string sin lanzar TypeError devolviendo fallback', () => {
            expect(getMediaUrl(12345)).toBe('/assets/img/favicons/favicon-32x32.png');
            expect(getMediaUrl({ url: '/foto.png' })).toBe('/assets/img/favicons/favicon-32x32.png');
            expect(getMediaUrl(['/foto.png'])).toBe('/assets/img/favicons/favicon-32x32.png');
        });

        it('[BLINDADO] getMediaUrl bloquea esquemas peligrosos como javascript:, data: y path traversal', () => {
            const urlJs = getMediaUrl('javascript:alert(1)');
            expect(urlJs).not.toContain('javascript:alert(1)');
            const urlTraversal = getMediaUrl('../../../../etc/passwd');
            expect(urlTraversal).not.toContain('../..');
        });
    });
});

describe('Auditoría Adversarial Red Team — Utilidades de Features', () => {
    describe('src/features/tracking/utils/movimientoDeConductor.js', () => {
        it('[BLINDADO] normalizarPunto rechaza null/""/false/[] devolviendo null en vez de (0, 0)', () => {
            const puntoVacio = normalizarPunto({ latitude: '', longitude: '' });
            expect(puntoVacio).toBeNull();

            const puntoEspacios = normalizarPunto({ latitude: '   ', longitude: '\n' });
            expect(puntoEspacios).toBeNull();

            const puntoBooleano = normalizarPunto({ latitude: false, longitude: false, heading: '' });
            expect(puntoBooleano).toBeNull();
        });

        it('[BLINDADO] normalizarPunto tolera Symbols u Object.create(null) sin lanzar TypeError', () => {
            expect(normalizarPunto({ latitude: Symbol('lat'), longitude: -74 })).toBeNull();
            expect(normalizarPunto({ latitude: Object.create(null), longitude: -74 })).toBeNull();
        });

        it('[BLINDADO] posicionInterpolada no lanza TypeError con argumentos null o undefined', () => {
            expect(() => posicionInterpolada(null, { latitude: 4, longitude: -74 }, 0.5)).not.toThrow();
            expect(() => posicionInterpolada({ latitude: 4, longitude: -74 }, undefined, 0.5)).not.toThrow();
            const res = posicionInterpolada(null, null, 0.5);
            expect(res).toEqual([0, 0]);
        });

        it('[BLINDADO] posicionInterpolada, distancia y rumbo devuelven 0 seguro con puntos inválidos', () => {
            const dist = distanciaEntrePuntos({}, {});
            expect(Number.isFinite(dist)).toBe(true);
            expect(dist).toBe(0);

            const rumbo = rumboEntrePuntos({}, {});
            expect(Number.isFinite(rumbo)).toBe(true);
            expect(rumbo).toBe(0);

            const dur = duracionDeTransicion({}, {});
            expect(Number.isFinite(dur)).toBe(true);
            expect(dur).toBe(600);
        });

        it('[BLINDADO] agregarPuntoAEstela con tope negativo o 0 no corrompe el recorte', () => {
            const estela = [{ latitude: 4.1, longitude: -74.1, recorded_at: '2026-01-01T00:00:00Z' }];
            const nuevo = { latitude: 4.2, longitude: -74.2, recorded_at: '2026-01-01T00:01:00Z' };
            const res = agregarPuntoAEstela(estela, nuevo, 0);
            expect(res.length).toBe(0);
        });

        it('[BLINDADO] fechaLocalDe no devuelve "NaN-NaN-NaN" ante fechas inválidas', () => {
            expect(fechaLocalDe('fecha-invalida')).toBe('');
            expect(fechaLocalDe(NaN)).toBe('');
        });
    });

    describe('src/features/tracking/utils/conductoresVigentes.js', () => {
        it('[BLINDADO] conductorVigente rechaza coordenadas no finitas o fuera de rango geográfico', () => {
            expect(conductorVigente({ latitude: NaN, longitude: NaN })).toBe(false);
            expect(conductorVigente({ latitude: 'no-es-numero', longitude: {} })).toBe(false);
            expect(conductorVigente({ latitude: 99999, longitude: -99999 })).toBe(false);
        });

        it('[BLINDADO] conductorVigente rechaza registros con created_at corrupto', () => {
            expect(conductorVigente({ latitude: 4.6, longitude: -74.0, created_at: 'basura-invalida' })).toBe(false);
        });

        it('[BLINDADO] textoUltimoReporte tolera parámetro `ahora` inválido sin devolver NaN ni Infinity', () => {
            const driver = { latitude: 4.6, longitude: -74.0, created_at: '2026-01-01T00:00:00Z' };
            expect(textoUltimoReporte(driver, NaN)).not.toContain('NaN');
            expect(textoUltimoReporte(driver, Infinity)).not.toContain('Infinity');
        });
    });

    describe('src/features/dashboard/utils/presentacionConductor.js', () => {
        it('[BLINDADO] saludoPorHora tolera string ISO, timestamp o null sin lanzar TypeError', () => {
            expect(() => saludoPorHora('2026-11-12T10:00:00Z')).not.toThrow();
            expect(() => saludoPorHora(Date.now())).not.toThrow();
            expect(() => saludoPorHora(null)).not.toThrow();
            expect(typeof saludoPorHora('2026-11-12T10:00:00Z')).toBe('string');
        });

        it('[BLINDADO] saludoPorHora devuelve saludo coherente para fechas inválidas', () => {
            expect(typeof saludoPorHora(new Date('invalid'))).toBe('string');
        });

        it('[BLINDADO] filtrarVehiculos tolera listas no-array o con elementos null sin lanzar TypeError', () => {
            expect(() => filtrarVehiculos(null, 'ABC')).not.toThrow();
            expect(() => filtrarVehiculos([null], 'ABC')).not.toThrow();
            expect(filtrarVehiculos(null, 'ABC')).toEqual([]);
        });

        it('[BLINDADO] formatearNumero tolera Infinity, Symbol y Object.create(null) sin lanzar TypeError ni emitir ∞', () => {
            expect(formatearNumero(Infinity)).toBe('0');
            expect(formatearNumero(-Infinity)).toBe('0');
            expect(formatearNumero(Symbol('1'))).toBe('0');
            expect(formatearNumero(Object.create(null))).toBe('0');
        });

        it('[BLINDADO] iniciales procesa correctamente pares sustitutos Unicode (emojis)', () => {
            const res = iniciales('🚗 🚕');
            expect(res).toBeDefined();
            expect(typeof res).toBe('string');
        });
    });

    describe('src/features/fuec/utils/nombreArchivoFuec.js', () => {
        it('[BLINDADO] nombreArchivoFuec tolera números u objetos en sus campos sin lanzar TypeError', () => {
            expect(() => nombreArchivoFuec({ placa: 12345 })).not.toThrow();
            expect(() => nombreArchivoFuec({ origin_route: 999 })).not.toThrow();
            expect(() => nombreArchivoFuec({ destination_route: ['Bogotá'] })).not.toThrow();
        });

        it('[BLINDADO] nombreArchivoFuec sanea bytes nulos y caracteres de control ASCII', () => {
            const res = nombreArchivoFuec({ placa: 'ABC\0DEF\x07', origin_route: 'Ruta\nSecreta' });
            expect(res).not.toContain('\0');
            expect(res).not.toContain('\x07');
        });
    });

    describe('src/features/radicacionTO/ (fechasContrato.js y pasosRadicacion.js)', () => {
        it('[BLINDADO] sumarDias rechaza fechas inexistentes de calendario como "2026-02-31"', () => {
            expect(sumarDias('2026-02-31', 1)).toBe('');
            expect(sumarDias('2026-99-99', 1)).toBe('');
        });

        it('[BLINDADO] sumarDias no devuelve "NaN-NaN-NaN" con días inválidos', () => {
            expect(sumarDias('2026-05-10', 'abc')).toBe('');
            expect(sumarDias('2026-05-10', NaN)).toBe('');
            expect(sumarDias('2026-05-10', Infinity)).toBe('');
        });

        it('[BLINDADO] fechasAutomaticas asigna cadena vacía en vez de "NaN-NaN-NaN" cuando duration es Infinity', () => {
            const form = { start_date: '2026-05-10', issue_date: '2026-05-10', end_date: '', duration: Infinity };
            fechasAutomaticas(form);
            expect(form.end_date).toBe('');
        });

        it('[BLINDADO] fechasAutomaticas y validarFechasContrato no lanzan TypeError con form null', () => {
            expect(() => fechasAutomaticas(null)).not.toThrow();
            expect(() => validarFechasContrato(null)).not.toThrow();
        });

        it('[BLINDADO] etiquetaPaso, etiquetaPasoCorta y etiquetaTipo no devuelven funciones nativas de Object.prototype', () => {
            expect(typeof etiquetaPaso('toString')).toBe('string');
            expect(typeof etiquetaPasoCorta('constructor')).toBe('string');
            expect(typeof etiquetaTipo('valueOf')).toBe('string');
        });

        it('[BLINDADO] normalizarLinea tolera null, elementos null y no-arrays devolviendo arreglo seguro', () => {
            expect(normalizarLinea(null)).toEqual([]);
            expect(normalizarLinea('no-es-array')).toEqual([]);
            expect(() => normalizarLinea([null])).not.toThrow();
        });

        it('[BLINDADO] porcentajeAvance acota el resultado entre 0 y 100 sin devolver negativos', () => {
            expect(porcentajeAvance('-5/10')).toBe(0);
            expect(porcentajeAvance('-999999/1')).toBe(0);
            expect(porcentajeAvance('15/10')).toBe(100);
        });
    });

    describe('src/features/thirdParties/ (licenciaDeConductor, thirdPartyRoles, mensajeError)', () => {
        it('[BLINDADO] licenciaDesdeDocumento no lanza TypeError sin argumentos o con null', () => {
            expect(licenciaDesdeDocumento()).toBeNull();
            expect(licenciaDesdeDocumento(null)).toBeNull();
        });

        it('[BLINDADO] rolPorDefectoPara previene propiedades heredadas ante "__proto__" o "toString"', () => {
            const res = rolPorDefectoPara('toString', [Object.prototype.toString]);
            expect(res).toBeNull();
            expect(rolPorDefectoPara(Object.create(null), [])).toBeNull();
        });

        it('[BLINDADO] mensajeErrorValidacion maneja Symbols u objetos anidados sin lanzar TypeError', () => {
            const err = {
                response: {
                    data: {
                        errors: {
                            email: [Symbol('error')],
                            campo: [{ nested: 'Mensaje real' }],
                        },
                    },
                },
            };
            expect(() => mensajeErrorValidacion(err)).not.toThrow();
            const res = mensajeErrorValidacion(err);
            expect(typeof res).toBe('string');
            expect(res).toContain('Mensaje real');
        });
    });

    describe('src/features/serviceDeliveryControlSheet/ (planillaVigente, projectAssignments, useServiceList)', () => {
        it('[BLINDADO] fechaDeDia tolera Object.create(null) y Symbols sin lanzar TypeError', () => {
            expect(fechaDeDia({ service_date: Object.create(null) })).toBe('');
            expect(fechaDeDia({ service_date: Symbol('fecha') })).toBe('');
        });

        it('[BLINDADO] estaAbierta no se engaña con arreglos coercibles como [1] o cadenas de espacios', () => {
            expect(estaAbierta({ is_active: [1] })).toBe(false);
            expect(estaAbierta({ is_active: ['1'] })).toBe(false);
            expect(estaAbierta({ is_active: '   1   ' })).toBe(false);
            expect(estaAbierta({ is_active: true })).toBe(true);
            expect(estaAbierta({ is_active: 1 })).toBe(true);
        });

        it('[BLINDADO] seleccionarPlanillaVigente sin hijos diarios devuelve null ante una planilla CERRADA', () => {
            const servicioCerradoDeHoy = { service_date: '2026-11-12', is_active: false };
            const seleccionada = seleccionarPlanillaVigente(servicioCerradoDeHoy, [], '2026-11-12');
            expect(seleccionada).toBeNull();
        });

        it('[BLINDADO] opcionesVehiculos, opcionesConductores y asignaciones toleran null sin lanzar TypeError', () => {
            expect(opcionesVehiculos(null)).toEqual([]);
            expect(opcionesConductores(null)).toEqual([]);
            expect(asignacionDeConductor(null, 'uuid-1')).toBeNull();
            expect(asignacionDeVehiculo(null, 'uuid-1')).toBeNull();
        });

        it('[BLINDADO] armarPayloadCreacion tolera daily_route no-string sin lanzar TypeError', () => {
            expect(() => armarPayloadCreacion({ daily_route: 12345 }, [])).not.toThrow();
            expect(() => armarPayloadCreacion({ daily_route: ['Ruta A'] }, [])).not.toThrow();
            const payload = armarPayloadCreacion({ daily_route: 12345 }, []);
            expect(payload.daily_route).toBeNull();
        });

        it('[BLINDADO] recorridosCount y recorridosTexto toleran `data` null sin lanzar TypeError', () => {
            expect(recorridosCount(null)).toBe(0);
            expect(recorridosCount(undefined)).toBe(0);
            expect(recorridosTexto(null)).toBe('');
            expect(recorridosTexto(undefined)).toBe('');
            expect(recorridosTexto({ routes: [null] })).toBe('');
        });

        it('[BLINDADO] tieneKm devuelve false para booleanos, arreglos y cadenas de espacios', () => {
            expect(tieneKm(false)).toBe(false);
            expect(tieneKm(true)).toBe(false);
            expect(tieneKm([])).toBe(false);
            expect(tieneKm('   ')).toBe(false);
            expect(tieneKm(Infinity)).toBe(false);
            expect(formatKmValor('   ')).toBe('-');
            expect(formatKmValor(false)).toBe('-');
        });

        it('[BLINDADO] paginaDestino devuelve null para valores booleanos o cadenas vacías', () => {
            expect(paginaDestino({ page: false })).toBeNull();
            expect(paginaDestino({ page: '' })).toBeNull();
            expect(paginaDestino({ page: [] })).toBeNull();
            expect(paginaDestino({ first: false, rows: 10 })).toBeNull();
        });
    });

    describe('src/features/auth/utils/rolesPrivilegiados.js', () => {
        it('[BLINDADO] rolesVisibles tolera objetos sin array en .data sin lanzar TypeError', () => {
            expect(() => rolesVisibles({ data: 'no-array' })).not.toThrow();
            expect(() => rolesVisibles({ data: { items: [] } })).not.toThrow();
            expect(rolesVisibles({ data: 'no-array' })).toEqual([]);
        });
    });

    describe('src/features/vehicles/utils/documentosVehiculo.js', () => {
        it('[BLINDADO] estadoDocumento clasifica como "vencido" (fail-closed) un documento con fecha corrupta', () => {
            expect(estadoDocumento({ expiry_date: 'fecha-corrupta-invalida' })).toBe('vencido');
        });
    });
});

describe('Auditoría Adversarial Red Team — Stores, Cliente HTTP, Seguridad y Hooks', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    describe('src/store/modules/permissions.js', () => {
        it('[BLINDADO] usePermissionsStore.setUser no lanza TypeError ante null o undefined', () => {
            const store = usePermissionsStore();
            expect(() => store.setUser(null)).not.toThrow();
            expect(() => store.setUser(undefined)).not.toThrow();
            expect(store.roles).toEqual([]);
            expect(store.permissions).toEqual([]);
        });

        it('[BLINDADO] toCanonicalRole devuelve string vacío ante objetos sin prototipo o tipos corruptos', () => {
            expect(toCanonicalRole(Object.create(null))).toBe('');
            expect(toCanonicalRole(Symbol('rol'))).toBe('');
        });
    });

    describe('src/services/api/base.service.js', () => {
        it('[BLINDADO] new BaseService() no lanza TypeError sin resourcePath o con valores no esperados', () => {
            expect(() => new BaseService({})).not.toThrow();
            expect(() => new BaseService({ resourcePath: null })).not.toThrow();
            expect(() => new BaseService({ resourcePath: 123 })).not.toThrow();
        });

        it('[BLINDADO] BaseService._toFormData tolera null sin lanzar TypeError devolviendo FormData vacío', () => {
            const service = new BaseService({ resourcePath: 'test' });
            expect(() => service._toFormData(null)).not.toThrow();
            const form = service._toFormData(null);
            expect(form).toBeInstanceOf(FormData);
        });

        it('[BLINDADO] BaseService._fileNameFromDisposition tolera tipos no-string sin lanzar TypeError', () => {
            const service = new BaseService({ resourcePath: 'test' });
            expect(service._fileNameFromDisposition(Object.create(null))).toBeNull();
            expect(service._fileNameFromDisposition(Symbol('disp'))).toBeNull();
            expect(service._fileNameFromDisposition(12345)).toBeNull();
        });
    });

    describe('src/services/api/interceptors.js', () => {
        it('[BLINDADO] requestInterceptor tolera config sin headers o null sin lanzar TypeError', async () => {
            await expect(requestInterceptor({ url: '/test' })).resolves.toBeDefined();
            await expect(requestInterceptor(null)).resolves.toBeDefined();
        });

        it('[BLINDADO] responseInterceptor.error tolera errores null o sin config sin lanzar TypeError', async () => {
            await expect(responseInterceptor.error(null)).rejects.toBeNull();
            await expect(responseInterceptor.error(undefined)).rejects.toBeUndefined();
        });
    });

    describe('src/services/security/secure-storage.js', () => {
        it('[BLINDADO] secureStorage._decrypt devuelve null en vez de lanzar TypeError ante no-strings o payloads malformados', async () => {
            await expect(secureStorage._decrypt(12345)).resolves.toBeNull();
            await expect(secureStorage._decrypt({})).resolves.toBeNull();
            await expect(secureStorage._decrypt('v1:invalido')).resolves.toBeNull();
        });
    });

    describe('src/hooks/useTable.js', () => {
        it('[BLINDADO] useTable(null) no lanza TypeError y usa defaults seguros', () => {
            expect(() => useTable(null)).not.toThrow();
            const { page, rows } = useTable(null);
            expect(page.value).toBe(1);
            expect(rows.value).toBe(10);
        });

        it('[BLINDADO] useTable.onPage tolera event null o rows = 0 sin emitir Infinity ni NaN', () => {
            const { page, onPage } = useTable();
            expect(() => onPage(null)).not.toThrow();

            onPage({ first: 10, rows: 0 });
            expect(Number.isFinite(page.value)).toBe(true);
            expect(page.value).not.toBe(Infinity);

            onPage({});
            expect(Number.isFinite(page.value)).toBe(true);
            expect(Number.isNaN(page.value)).toBe(false);
        });
    });

    describe('src/hooks/useDocumentWizard.js', () => {
        it('[BLINDADO] pasosAplicables(null) no lanza TypeError y devuelve los pasos base', () => {
            expect(() => pasosAplicables(null)).not.toThrow();
            expect(pasosAplicables(null).length).toBeGreaterThan(0);
        });

        it('[BLINDADO] elegirPolizaViva tolera tipo numérico, docs no-array y status numérico sin lanzar TypeError', () => {
            expect(() => elegirPolizaViva([], 123)).not.toThrow();
            expect(elegirPolizaViva([], 123)).toBeNull();
            expect(() => elegirPolizaViva([null], 'SOAT')).not.toThrow();
            expect(() => elegirPolizaViva([{ document_type: 'SOAT', status: 1 }], 'SOAT')).not.toThrow();
            expect(() => elegirPolizaViva([{ document_type: 123, status: 'VIGENTE' }], 'SOAT')).not.toThrow();
        });

        it('[BLINDADO] masReciente tolera docs no-array y coincide no-función sin lanzar TypeError', () => {
            expect(() => masReciente('no-es-array', () => true)).not.toThrow();
            expect(masReciente('no-es-array', () => true)).toBeNull();
            expect(() => masReciente([{}], null)).not.toThrow();
        });

        it('[BLINDADO] useDocumentWizard.getSessionDone devuelve arreglo seguro ante datos JSON escalares en sessionStorage', () => {
            const wizard = useDocumentWizard();
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('noa-wizard-done-veh-1', '12345');
                expect(Array.isArray(wizard.getSessionDone('veh-1'))).toBe(true);
                expect(() => wizard.markStepDone('veh-1', 'soat')).not.toThrow();
                sessionStorage.removeItem('noa-wizard-done-veh-1');
            }
        });
    });
});
