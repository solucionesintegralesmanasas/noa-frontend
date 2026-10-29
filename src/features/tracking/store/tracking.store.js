import { defineStore } from 'pinia';
import trackingService from '../services/tracking.service';
import { isCancelError } from '@/utils/error-handler.js';
import { logger } from '@/utils/logger.js';
import {
    agregarPuntoAEstela,
    fechaLocalDe,
    fusionarEstela,
    viajeActual,
} from '../utils/movimientoDeConductor';

export const useTrackingStore = defineStore('tracking', {
    state: () => ({
        activeDrivers: [],
        selectedDriver: null,
        driverHistory: [],
        geofences: [],
        alerts: [],
        alertCount: 0,
        stats: null,
        isTracking: false,
        currentSession: null,
        loading: false,
        error: null,
        sortField: null,
        sortOrder: null,
        // Estela del viaje actual por conductor (uuid → puntos GPS en orden).
        trailByDriver: {},
        // Sello que los mapas observan para re-dibujar las estelas (ARQ-009:
        // los componentes no crean temporizadores ni sondeos propios).
        trailRevision: 0,
        trailLoading: false,
    }),

    getters: {
        unreadAlertCount: (state) => state.alerts.filter((a) => !a.is_read).length,
    },

    actions: {
        async fetchActiveDrivers(signal) {
            this.loading = true;
            this.error = null;
            try {
                const response = await trackingService.getActiveDrivers({ signal });
                this.activeDrivers = response.data?.data || response.data || [];
            } catch (err) {
                // Cancelación por AbortController (pestaña oculta o desmontaje): silencio.
                if (isCancelError(err)) return;
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },

        async fetchDriverHistory(uuid, startDate, endDate, extra = {}) {
            this.loading = true;
            this.error = null;
            try {
                const response = await trackingService.getDriverHistory(uuid, {
                    start_date: startDate,
                    end_date: endDate,
                    ...extra,
                });
                this.driverHistory = response.data?.data || response.data || [];
            } catch (err) {
                // Sin datos obsoletos: ante un error (p. ej. 422) se vacía.
                this.driverHistory = [];
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Siembra la estela del viaje actual de un conductor con el recorrido
         * de hoy (historial decimado). Sin el permiso locations.history el
         * backend responde 403 y la estela degrada a la que se acumule en vivo.
         */
        async fetchDriverTrail(uuid, signal) {
            if (!uuid) return;
            this.trailLoading = true;
            try {
                const response = await trackingService.getTodayTrail(uuid, fechaLocalDe(), { signal });
                const puntos = response.data?.data || response.data || [];
                this.setTrail(uuid, viajeActual(Array.isArray(puntos) ? puntos : []));
            } catch (err) {
                if (isCancelError(err)) return;
                logger.warn('[tracking] Sin recorrido del día para la estela:', err?.message || err);
            } finally {
                this.trailLoading = false;
            }
        },

        /** Fusiona la estela sembrada (historial) con los puntos ya acumulados. */
        setTrail(uuid, puntos) {
            if (!uuid) return;
            this.trailByDriver = {
                ...this.trailByDriver,
                [uuid]: fusionarEstela(puntos, this.trailByDriver[uuid] || []),
            };
            this.trailRevision += 1;
        },

        /** Agrega un punto en vivo a la estela del conductor. */
        appendTrailPoint(uuid, punto) {
            if (!uuid || !punto) return;
            const actual = this.trailByDriver[uuid] || [];
            const lista = agregarPuntoAEstela(actual, punto);
            if (lista === actual) return;
            this.trailByDriver = { ...this.trailByDriver, [uuid]: lista };
            this.trailRevision += 1;
        },

        clearTrail(uuid) {
            if (!uuid || !this.trailByDriver[uuid]) return;
            const restantes = { ...this.trailByDriver };
            delete restantes[uuid];
            this.trailByDriver = restantes;
            this.trailRevision += 1;
        },

        async fetchDriverStats(uuid, startDate = null, endDate = null) {
            try {
                const params = {};
                if (startDate && endDate) {
                    params.start_date = startDate;
                    params.end_date = endDate;
                }
                const response = await trackingService.getDriverStats(uuid, params);
                this.stats = response.data?.data || response.data || null;
            } catch (err) {
                // Sin datos obsoletos: ante un error se limpia.
                this.stats = null;
                this.error = err.message;
            }
        },

        async attachRouteMap(driverUuid, serviceDate, imageBase64) {
            const response = await trackingService.saveRouteMapCapture({
                third_party_uuid: driverUuid,
                service_date: serviceDate,
                image_base64: imageBase64,
            });
            return response.data?.data || response.data;
        },

        async fetchGeofences(params = {}, signal) {
            this.loading = true;
            try {
                const isSignal = params instanceof AbortSignal || params?.aborted !== undefined;
                const actualSignal = signal || (isSignal ? params : undefined);
                const actualParams = isSignal ? {} : params;
                const response = await trackingService.getGeofences({
                    per_page: 100,
                    sort_by: this.sortField || undefined,
                    sort_order: (this.sortOrder === 1 || this.sortOrder === 'asc') ? 'asc' : (this.sortOrder === -1 || this.sortOrder === 'desc') ? 'desc' : undefined,
                    ...actualParams,
                }, { signal: actualSignal });
                this.geofences = response.data?.data || response.data || [];
            } catch (err) {
                // Cancelación por AbortController (pestaña oculta o desmontaje): silencio.
                if (isCancelError(err)) return;
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },

        setSort(field, order) {
            this.sortField = field;
            this.sortOrder = order === 'desc' || order === -1 ? -1 : order === 'asc' || order === 1 ? 1 : null;
            return this.fetchGeofences();
        },

        async createGeofence(data) {
            const response = await trackingService.createGeofence(data);
            const newGeofence = response.data?.data || response.data;
            this.geofences.push(newGeofence);
            return newGeofence;
        },

        async updateGeofence(uuid, data) {
            const response = await trackingService.updateGeofence(uuid, data);
            const updated = response.data?.data || response.data;
            const index = this.geofences.findIndex((g) => g.uuid === uuid);
            if (index !== -1) {
                this.geofences[index] = updated;
            }
            return updated;
        },

        async deleteGeofence(uuid) {
            await trackingService.deleteGeofence(uuid);
            this.geofences = this.geofences.filter((g) => g.uuid !== uuid);
        },

        async fetchAlerts(params = {}) {
            try {
                const response = await trackingService.getAlerts(params);
                this.alerts = response.data?.data || [];
            } catch (err) {
                this.error = err.message;
            }
        },

        async markAlertRead(uuid) {
            await trackingService.markAlertRead(uuid);
            const alert = this.alerts.find((a) => a.uuid === uuid);
            if (alert) {
                alert.is_read = true;
            }
        },

        async sendMyLocation(data) {
            try {
                await trackingService.sendLocation(data);
            } catch (err) {
                logger.error('Error sending location:', err);
            }
        },

        async startTracking(data) {
            try {
                const response = await trackingService.startSession(data);
                this.currentSession = response.data?.data || response.data;
                this.isTracking = true;
                return this.currentSession;
            } catch (err) {
                this.error = err.message;
                return null;
            }
        },

        async stopTracking() {
            if (this.currentSession) {
                try {
                    await trackingService.stopSession(this.currentSession.uuid);
                } catch (err) {
                    logger.error('Error stopping session:', err);
                }
            }
            this.currentSession = null;
            this.isTracking = false;
        },

        selectDriver(driver) {
            this.selectedDriver = driver;
        },

        clearSelection() {
            this.selectedDriver = null;
            this.driverHistory = [];
            this.stats = null;
        },
    },
});
