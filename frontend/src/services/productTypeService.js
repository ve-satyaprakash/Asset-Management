import axios from 'axios';

// const BASE = '/api/product-types';
const BASE = `${import.meta.env.VITE_API_URL}/api/product-types`; 

export const getProductTypes = (params) =>
  axios.get(BASE, { params }).then((r) => r.data);

export const getAllProductTypes = () =>
  axios.get(`${BASE}/all`).then((r) => r.data);

export const getProductType = (id) =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const createProductType = (data) =>
  axios.post(BASE, data).then((r) => r.data);

export const updateProductType = (id, data) =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteProductType = (id) =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);
