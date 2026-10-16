import { defineStore } from 'pinia';
import service from '../services/radicacion.service.js';
import { logger } from '@/utils/logger.js';
import { normalizarLinea } from '../utils/pasosRadicacion.js';

/**
 * Store Pinia del listado de expedientes de radicación.
 * Paginación y búsqueda del lado del servidor.
 */
export const useRadicacionStore = defineStore('radicacion', {
  state: () => ({
    items: [],
    loading: false,
    search: '',
    pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 },
  }),

  actions: {
    async fetchItems() {
      this.loading = true;
      try {
        const r = await service.expedientes({
          per_page: this.pagination.itemsPerPage,
          page: this.pagination.currentPage,
          search: this.search,
        });
        // `_request` ya devuelve el cuerpo: { success, message, data: <paginador> }.
        const pag = r?.data ?? {};
        this.items = (pag.data ?? []).map((e) => ({ ...e, linea_tiempo: normalizarLinea(e.linea_tiempo ?? []) }));
        this.pagination.totalItems = pag.total ?? this.items.length;
        this.pagination.totalPages = pag.last_page ?? 1;
        this.pagination.currentPage = pag.current_page ?? this.pagination.currentPage;
      } catch (e) {
        logger.warn('No se cargaron expedientes');
        this.items = [];
      } finally {
        this.loading = false;
      }
    },

    async setPage(page) {
      this.pagination.currentPage = page;
      await this.fetchItems();
    },

    async setPerPage(filas) {
      this.pagination.itemsPerPage = filas;
      this.pagination.currentPage = 1;
      await this.fetchItems();
    },

    async setGlobalFilter(texto) {
      this.search = (texto ?? '').trim();
      this.pagination.currentPage = 1;
      await this.fetchItems();
    },

    async clearFilters() {
      await this.setGlobalFilter('');
    },
  },
});
