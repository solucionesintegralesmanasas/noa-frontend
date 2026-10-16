import { BaseService } from '@services/api/base.service.js';

class FleetServiceContractService extends BaseService {
  constructor() {
    super({
      resourcePath: 'procedure/fleet-service-contracts',
      metadata: { module: 'fleetServiceContract', service: 'fleetServiceContract' },
    });
  }
  list(params = {}) { return this._request('GET', '', { params }); }
  get(uuid) { return this._request('GET', `/${uuid}`); }
  create(data) { return this._request('POST', '', { data }); }
  update(uuid, data) { return this._request('PUT', `/${uuid}`, { data }); }
  delete(uuid) { return this._request('DELETE', `/${uuid}`); }
}

export default new FleetServiceContractService();