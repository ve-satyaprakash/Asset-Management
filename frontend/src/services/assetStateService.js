import axios from 'axios';

const BASE = '/api/asset-states';

export const getAssetStates    = (params)   => axios.get(BASE, { params }).then((r) => r.data);
export const getAllAssetStates  = ()         => axios.get(`${BASE}/all`).then((r) => r.data);
export const getAssetState     = (id)       => axios.get(`${BASE}/${id}`).then((r) => r.data);
export const createAssetState  = (data)     => axios.post(BASE, data).then((r) => r.data);
export const updateAssetState  = (id, data) => axios.put(`${BASE}/${id}`, data).then((r) => r.data);
export const deleteAssetState  = (id)       => axios.delete(`${BASE}/${id}`).then((r) => r.data);
