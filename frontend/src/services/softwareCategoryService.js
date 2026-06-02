import axios from 'axios';

// const BASE = '/api/software-categories';
const BASE = `${import.meta.env.VITE_API_URL}/api/software-categories`; 

export const getSoftwareCategories   = (params)   => axios.get(BASE, { params }).then((r) => r.data);
export const getAllSoftwareCategories = ()         => axios.get(`${BASE}/all`).then((r) => r.data);
export const getSoftwareCategory     = (id)       => axios.get(`${BASE}/${id}`).then((r) => r.data);
export const createSoftwareCategory  = (data)     => axios.post(BASE, data).then((r) => r.data);
export const updateSoftwareCategory  = (id, data) => axios.put(`${BASE}/${id}`, data).then((r) => r.data);
export const deleteSoftwareCategory  = (id)       => axios.delete(`${BASE}/${id}`).then((r) => r.data);
