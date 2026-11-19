import { describe, expect, it, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('../services/inspectionItems.service.js', () => ({
    default: {
        list: vi.fn(),
        listCategories: vi.fn(),
        createCategory: vi.fn(),
        updateCategory: vi.fn(),
        deleteCategory: vi.fn(),
        bulkCreate: vi.fn(),
        downloadTemplate: vi.fn(),
        importExcel: vi.fn(),
    },
}));
vi.mock('@/utils/toast.js', () => ({ toast: vi.fn() }));

import service from '../services/inspectionItems.service.js';
import { useInspectionItemsStore } from '../store/inspectionItems.store.js';

describe('useInspectionItemsStore: categorías, carga dinámica e importación Excel', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        service.list.mockResolvedValue({
            data: { data: [], total: 0, last_page: 1, current_page: 1, per_page: 10 },
        });
        service.listCategories.mockResolvedValue({
            data: [
                { uuid: 'cat-1', code: 'DOCUMENTOS', name: 'Documentos', description: null, items_count: 5 },
                { uuid: 'cat-2', code: 'LUCES', name: 'Luces', description: null, items_count: 2 },
            ],
        });
    });

    it('fetchCategories carga las categorías y genera categoryOptions y categoryLabelsMap', async () => {
        const store = useInspectionItemsStore();
        await store.fetchCategories();

        expect(store.categories).toHaveLength(2);
        expect(store.categoryOptions[0]).toEqual({
            label: 'Documentos',
            value: 'DOCUMENTOS',
            uuid: 'cat-1',
            description: '',
            items_count: 5,
        });
        expect(store.categoryLabelsMap).toEqual({
            DOCUMENTOS: 'Documentos',
            LUCES: 'Luces',
        });
    });

    it('createCategory registra la categoría y refresca la lista', async () => {
        service.createCategory.mockResolvedValue({
            data: { uuid: 'cat-3', code: 'SISTEMA_ELECTRICO', name: 'Sistema Eléctrico' },
        });

        const store = useInspectionItemsStore();
        const created = await store.createCategory({ name: 'Sistema Eléctrico' });

        expect(service.createCategory).toHaveBeenCalledWith({ name: 'Sistema Eléctrico' });
        expect(service.listCategories).toHaveBeenCalled();
        expect(created.code).toBe('SISTEMA_ELECTRICO');
    });

    it('bulkCreateItems envía múltiples ítems y refresca ítems y categorías', async () => {
        service.bulkCreate.mockResolvedValue({
            data: { category: 'DOCUMENTOS', created_count: 2, skipped_count: 1, items: [] },
        });

        const store = useInspectionItemsStore();
        const result = await store.bulkCreateItems({
            category: 'DOCUMENTOS',
            items: [
                { item_name: 'SOAT', description: null },
                { item_name: 'RTM', description: 'Vigente' },
            ],
        });

        expect(service.bulkCreate).toHaveBeenCalledWith({
            category: 'DOCUMENTOS',
            items: [
                { item_name: 'SOAT', description: null },
                { item_name: 'RTM', description: 'Vigente' },
            ],
        });
        expect(result.created_count).toBe(2);
        expect(service.list).toHaveBeenCalled();
        expect(service.listCategories).toHaveBeenCalled();
    });

    it('importExcel envía el archivo y recarga categorías e ítems', async () => {
        service.importExcel.mockResolvedValue({
            data: { created_count: 4, skipped_count: 0, categories_created: 1, errors: [] },
        });

        const store = useInspectionItemsStore();
        const fakeFile = new File(['dummy'], 'items.xlsx');
        const res = await store.importExcel(fakeFile);

        expect(service.importExcel).toHaveBeenCalledWith(fakeFile);
        expect(res.created_count).toBe(4);
        expect(service.list).toHaveBeenCalled();
        expect(service.listCategories).toHaveBeenCalled();
    });

    it('setCategoryFilter envía category al listar ítems', async () => {
        const store = useInspectionItemsStore();
        await store.setCategoryFilter('LUCES');

        expect(service.list).toHaveBeenCalledWith(expect.objectContaining({
            page: 1,
            category: 'LUCES',
        }));
    });
});
