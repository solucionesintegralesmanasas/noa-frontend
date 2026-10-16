import { BaseService } from '@services/api/base.service.js';

class ObjectsContractsService extends BaseService {
    constructor() {
        super({
            resourcePath: 'contract-extract/objects-contracts',
            metadata: { module: 'objectsContracts', service: 'objectsContracts' },
        });
    }

    list(params = {}) { return this._request('GET', '', { params }); }
    listAll(params = {}) { return this._request('GET', '/list', { params }); }
    get(uuid) { return this._request('GET', `/${uuid}`); }
    create(data) { return this._request('POST', '', { data }); }
    update(uuid, data) { return this._request('PUT', `/${uuid}`, { data }); }
    delete(uuid) { return this._request('DELETE', `/${uuid}`); }
}

export default new ObjectsContractsService();
