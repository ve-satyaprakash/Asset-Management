import axios from 'axios';

// const BASE = '/api/assets';
const BASE = `${import.meta.env.VITE_API_URL}/api/assets`;

export const getAssets      = (params) => axios.get(BASE, { params }).then((r) => r.data);
export const getAsset       = (id)     => axios.get(`${BASE}/${id}`).then((r) => r.data);
export const createAsset    = (data)   => axios.post(BASE, data).then((r) => r.data);
export const updateAsset    = (id, data) => axios.put(`${BASE}/${id}`, data).then((r) => r.data);
export const deleteAsset    = (id)     => axios.delete(`${BASE}/${id}`).then((r) => r.data);
