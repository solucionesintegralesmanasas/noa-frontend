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
}

export default new InspectionItemsService();
