import axios from 'axios';

const BASE = '/api/products';

export const getProducts    = (params)   => axios.get(BASE, { params }).then((r) => r.data);
export const getAllProducts  = ()         => axios.get(`${BASE}/all`).then((r) => r.data);
export const getProduct     = (id)       => axios.get(`${BASE}/${id}`).then((r) => r.data);
export const createProduct  = (data)     => axios.post(BASE, data).then((r) => r.data);
export const updateProduct  = (id, data) => axios.put(`${BASE}/${id}`, data).then((r) => r.data);
export const deleteProduct  = (id)       => axios.delete(`${BASE}/${id}`).then((r) => r.data);

export const uploadProductImage = (id, file) => {
  const fd = new FormData();
  fd.append('image', file);
  return axios.post(`${BASE}/${id}/images`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export const deleteProductImage = (id, filename) =>
  axios.delete(`${BASE}/${id}/images/${encodeURIComponent(filename)}`).then((r) => r.data);
