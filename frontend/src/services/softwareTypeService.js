import axios from 'axios';

const BASE = '/api/software-types';

export const getSoftwareTypes    = (params)   => axios.get(BASE, { params }).then((r) => r.data);
export const getAllSoftwareTypes  = ()         => axios.get(`${BASE}/all`).then((r) => r.data);
export const getSoftwareType     = (id)       => axios.get(`${BASE}/${id}`).then((r) => r.data);
export const createSoftwareType  = (data)     => axios.post(BASE, data).then((r) => r.data);
export const updateSoftwareType  = (id, data) => axios.put(`${BASE}/${id}`, data).then((r) => r.data);
export const deleteSoftwareType  = (id)       => axios.delete(`${BASE}/${id}`).then((r) => r.data);
