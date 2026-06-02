import axios from 'axios';

// const BASE = '/api/vendors';
const BASE = `${import.meta.env.VITE_API_URL}/api/vendors`; 

export const getVendors    = (params)   => axios.get(BASE, { params }).then((r) => r.data);
export const getAllVendors  = ()         => axios.get(`${BASE}/all`).then((r) => r.data);
export const getVendor     = (id)       => axios.get(`${BASE}/${id}`).then((r) => r.data);
export const createVendor  = (data)     => axios.post(BASE, data).then((r) => r.data);
export const updateVendor  = (id, data) => axios.put(`${BASE}/${id}`, data).then((r) => r.data);
export const deleteVendor  = (id)       => axios.delete(`${BASE}/${id}`).then((r) => r.data);
