import { defineStore } from 'pinia';
import { toast } from '@/utils/toast.js';
import inspectionItemsService from '../services/inspectionItems.service.js';

export const useInspectionItemsStore = defineStore('inspectionItems', {
    state: () => ({
        items: [],
        categories: [],
        selectedItem: null,
        loading: false,
        categoriesLoading: false,
        error: null,
        catalogs: {},
        pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 },
        search: '',
        categoryFilter: '',
        sortField: null,
        sortOrder: null,
    }),

    getters: {
        filteredItems: (state) => state.items,
        paginatedItems: (state) => state.items,
        categoryOptions: (state) => state.categories.map((cat) => ({
            label: cat.name,
            value: cat.code,
            uuid: cat.uuid,
            description: cat.description ?? '',
            items_count: cat.items_count ?? 0,
        })),
        categoryLabelsMap: (state) => {
            const map = {};
            for (const cat of state.categories) {
                map[cat.code] = cat.name;
            }
            return map;
        },
    },

    actions: {
        async _run(action, errorMsg) {
            this.loading = true;
            this.error = null;
            try { return await action(); }
            catch (error) {
                this.error = error.message || errorMsg;
                await toast('Error', this.error, 'error');
                throw error;
            } finally { this.loading = false; }
        },

        async fetchItems() {
            return this._run(async () => {
                const response = await inspectionItemsService.list({
                    page: this.pagination.currentPage,
                    per_page: this.pagination.itemsPerPage,
                    search: this.search || undefined,
                    category: this.categoryFilter || undefined,
                    sort_by: this.sortField || undefined,
                    sort_order: (this.sortOrder === 1 || this.sortOrder === 'asc') ? 'asc' : (this.sortOrder === -1 || this.sortOrder === 'desc') ? 'desc' : undefined,
                });
                const p = response?.data ?? response;
                this.items = p.data ?? [];
                this.pagination.currentPage = p.current_page ?? 1;
                this.pagination.totalItems = p.total ?? 0;
                this.pagination.totalPages = p.last_page ?? 1;
                this.pagination.itemsPerPage = p.per_page ?? this.pagination.itemsPerPage;
            }, 'Error al cargar los datos');
        },

        async fetchCategories() {
            this.categoriesLoading = true;
            try {
                const response = await inspectionItemsService.listCategories();
                const list = response?.data ?? response;
                this.categories = Array.isArray(list) ? list : [];
                return this.categories;
            } catch (error) {
                this.error = error.message || 'Error al cargar las categorías';
                await toast('Error', this.error, 'error');
                throw error;
            } finally {
                this.categoriesLoading = false;
            }
        },

        async createCategory(data) {
            return this._run(async () => {
                const response = await inspectionItemsService.createCategory(data);
                const category = response?.data?.data ?? response?.data ?? response;
                await this.fetchCategories();
                await toast('¡Éxito!', 'Categoría creada correctamente', 'success');
                return category;
            }, 'Error al crear la categoría');
        },

        async updateCategory(uuid, data) {
            return this._run(async () => {
                const response = await inspectionItemsService.updateCategory(uuid, data);
                const updated = response?.data?.data ?? response?.data ?? response;
                await Promise.all([this.fetchCategories(), this.fetchItems()]);
                await toast('¡Éxito!', 'Categoría actualizada correctamente', 'success');
                return updated;
            }, 'Error al actualizar la categoría');
        },

        async deleteCategory(uuid) {
            return this._run(async () => {
                await inspectionItemsService.deleteCategory(uuid);
                await this.fetchCategories();
                await toast('¡Eliminado!', 'Categoría eliminada correctamente', 'success');
            }, 'Error al eliminar la categoría');
        },

        _patchLocal(uuid, patch) {
            const i = this.items.findIndex(item => (item.uuid ?? item.id) === uuid);
            if (i !== -1) this.items[i] = { ...this.items[i], ...patch };
        },

        async _afterCreate(response) {
            const item = response?.data?.data ?? response?.data ?? response;
            await toast('¡Éxito!', 'Registro creado correctamente', 'success');
            this.pagination.currentPage = 1;
            await this.fetchItems();
            return item;
        },

        createItem(data) {
            return this._run(
                () => inspectionItemsService.create(data).then(r => this._afterCreate(r)),
                'Error al crear el registro'
            );
        },

        bulkCreateItems(payload) {
            return this._run(async () => {
                const response = await inspectionItemsService.bulkCreate(payload);
                const result = response?.data ?? response;
                const created = result?.created_count ?? 0;
                const skipped = result?.skipped_count ?? 0;
                const msg = skipped > 0
                    ? `Se crearon ${created} ítem(s) y se omitieron ${skipped} duplicado(s).`
                    : `Se registraron ${created} ítem(s) correctamente.`;
                await toast('¡Éxito!', msg, created > 0 ? 'success' : 'info');
                this.pagination.currentPage = 1;
                await Promise.all([this.fetchItems(), this.fetchCategories()]);
                return result;
            }, 'Error al guardar los ítems de inspección');
        },

        async downloadTemplate() {
            try {
                await inspectionItemsService.downloadTemplate();
            } catch (error) {
                const msg = error?.message || 'No se pudo descargar la plantilla Excel';
                await toast('Error', msg, 'error');
                throw error;
            }
        },

        async importExcel(file) {
            return this._run(async () => {
                const response = await inspectionItemsService.importExcel(file);
                const result = response?.data ?? response;
                this.pagination.currentPage = 1;
                await Promise.all([this.fetchCategories(), this.fetchItems()]);
                return result;
            }, 'Error al procesar el archivo Excel');
        },

        updateItem(uuid, data) {
            return this._run(async () => {
                const response = await inspectionItemsService.update(uuid, data);
                const updated = response?.data?.data ?? response?.data ?? response;
                this._patchLocal(uuid, updated);
                await toast('¡Éxito!', 'Registro actualizado correctamente', 'success');
                return updated;
            }, 'Error al actualizar el registro');
        },

        async deleteItem(uuid) {
            return this._run(async () => {
                await inspectionItemsService.delete(uuid);
                await toast('¡Eliminado!', 'El registro ha sido eliminado', 'success');
                if (this.items.length === 1 && this.pagination.currentPage > 1) {
                    this.pagination.currentPage -= 1;
                }
                await Promise.all([this.fetchItems(), this.fetchCategories()]);
            }, 'Error al eliminar el registro');
        },

        fetchById(uuid) {
            return this._run(async () => {
                const r = await inspectionItemsService.get(uuid);
                this.selectedItem = r?.data?.data ?? r?.data ?? r;
                return this.selectedItem;
            }, 'Error al cargar el registro');
        },

        fetchProfileById(uuid) { return this.fetchById(uuid); },

        setPage(page) { this.pagination.currentPage = page; return this.fetchItems(); },
        setSort(field, order) {
            this.sortField = field;
            this.sortOrder = order;
            this.pagination.currentPage = 1;
            return this.fetchItems();
        },
        setCategoryFilter(category) {
            this.categoryFilter = category || '';
            this.pagination.currentPage = 1;
            return this.fetchItems();
        },
        setGlobalFilter(query) { this.search = query; this.pagination.currentPage = 1; return this.fetchItems(); },
        clearFilters() {
            this.search = '';
            this.categoryFilter = '';
            this.pagination.currentPage = 1;
            return this.fetchItems();
        },
    },
});
