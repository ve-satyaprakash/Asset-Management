import axios from 'axios';

// const BASE = '/api/manufacturers';
const BASE = `${import.meta.env.VITE_API_URL}/api/manufacturers`;

export const getManufacturers    = (params)   => axios.get(BASE, { params }).then((r) => r.data);
export const getAllManufacturers  = ()         => axios.get(`${BASE}/all`).then((r) => r.data);
export const getManufacturer     = (id)       => axios.get(`${BASE}/${id}`).then((r) => r.data);
export const createManufacturer  = (data)     => axios.post(BASE, data).then((r) => r.data);
export const updateManufacturer  = (id, data) => axios.put(`${BASE}/${id}`, data).then((r) => r.data);
export const deleteManufacturer  = (id)       => axios.delete(`${BASE}/${id}`).then((r) => r.data);
