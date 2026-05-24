import client from './client';

export const authAPI = {
  ownerLogin: (data) => client.post('/api/auth/owner-login', data),
};

export const ownerAPI = {
  getStats:        (params) => client.get('/api/owner/stats', { params }),
  getTopProducts:  (p)      => client.get('/api/owner/top-products', { params: p }),
  getProducts:     (p)      => client.get('/api/owner/products', { params: p }),
  createProduct:   (d)      => client.post('/api/owner/products', d),
  updateProduct:   (id, d)  => client.put(`/api/owner/products/${id}`, d),
  deleteProduct:   (id)     => client.delete(`/api/owner/products/${id}`),
  getDiscounts:    ()       => client.get('/api/owner/discounts'),
  createDiscount:  (d)      => client.post('/api/owner/discounts', d),
  updateDiscount:  (id, d)  => client.put(`/api/owner/discounts/${id}`, d),
  toggleDiscount:  (id)     => client.patch(`/api/owner/discounts/${id}/toggle`),
  deleteDiscount:  (id)     => client.delete(`/api/owner/discounts/${id}`),
  getEmployees:    ()       => client.get('/api/owner/employees'),
  createEmployee:  (d)      => client.post('/api/owner/employees', d),
  updateEmployee:  (id, d)  => client.put(`/api/owner/employees/${id}`, d),
  blockEmployee:   (id, d)  => client.patch(`/api/owner/employees/${id}/block`, d),
  deleteEmployee:  (id)     => client.delete(`/api/owner/employees/${id}`),
  getEditRequests: (p)      => client.get('/api/owner/edit-requests', { params: p }),
  approveRequest:  (id)     => client.patch(`/api/owner/edit-requests/${id}/approve`),
  rejectRequest:   (id)     => client.patch(`/api/owner/edit-requests/${id}/reject`),
};

export const aiAPI = {
  chat: (messages) => client.post('/api/ai/chat', { messages }),
};
