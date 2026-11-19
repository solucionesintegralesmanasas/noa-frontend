import { BaseService } from '@services/api/base.service.js';

class InspectionItemsService extends BaseService {
    constructor() {
        super({
            resourcePath: 'catalogs/inspection-items',
            metadata: { module: 'inspectionItems', service: 'inspection-items' },
        });
    }

    list(params = {}) { return this._request('GET', '', { params }); }
    listAll(params = {}) { return this._request('GET', '/list', { params }); }
    get(uuid) { return this._request('GET', `/${uuid}`); }
    create(data) { return this._request('POST', '', { data }); }
    update(uuid, data) { return this._request('PUT', `/${uuid}`, { data }); }
    delete(uuid) { return this._request('DELETE', `/${uuid}`); }

    listCategories() { return this._request('GET', '/categories', { listAbort: false }); }
    createCategory(data) { return this._request('POST', '/categories', { data }); }
    updateCategory(uuid, data) { return this._request('PUT', `/categories/${uuid}`, { data }); }
    deleteCategory(uuid) { return this._request('DELETE', `/categories/${uuid}`); }

    bulkCreate(data) { return this._request('POST', '/bulk', { data }); }
    downloadTemplate() { return this._downloadExcel('/template', 'Plantilla_Items_Inspeccion.xlsx'); }

    importExcel(file) {
        const formData = new FormData();
        formData.append('file', file);
        return this._multipart('POST', '/import', formData);
    }
}

export default new InspectionItemsService();
