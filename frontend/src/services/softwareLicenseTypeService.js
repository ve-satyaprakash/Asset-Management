import axios from 'axios';

const BASE = '/api/software-license-types';

export const getSoftwareLicenseTypes   = (params)   => axios.get(BASE, { params }).then((r) => r.data);
export const getAllSoftwareLicenseTypes = ()         => axios.get(`${BASE}/all`).then((r) => r.data);
export const getSoftwareLicenseType    = (id)       => axios.get(`${BASE}/${id}`).then((r) => r.data);
export const createSoftwareLicenseType = (data)     => axios.post(BASE, data).then((r) => r.data);
export const updateSoftwareLicenseType = (id, data) => axios.put(`${BASE}/${id}`, data).then((r) => r.data);
export const deleteSoftwareLicenseType = (id)       => axios.delete(`${BASE}/${id}`).then((r) => r.data);
