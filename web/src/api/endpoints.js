import client from './client';

export const authAPI = {
  ownerLogin:    (data) => client.post('/api/auth/owner-login', data),
  employeeLogin: (data) => client.post('/api/auth/employee-login', data),
};

export const productsAPI = {
  getAll:  (params) => client.get('/api/products', { params }),
  getById: (id)     => client.get(`/api/products/${id}`),
};

export const ordersAPI = {
  create:    (data) => client.post('/api/orders', data),
  getStatus: (id)   => client.get(`/api/orders/${id}/status`),
};

export const employeeAPI = {
  getActiveOrders: ()            => client.get('/api/employee/orders'),
  confirmOrder:    (id, data)    => client.patch(`/api/employee/orders/${id}/confirm`, data),
  updateStatus:    (id, data)    => client.patch(`/api/employee/orders/${id}/status`, data),
  addStock:        (data)        => client.post('/api/employee/stock', data),
  getStockHistory: (p)           => client.get('/api/employee/stock-history', { params: p }),
  requestEdit:     (data)        => client.post('/api/employee/edit-requests', data),
};

export const ownerAPI = {
  // Statistika
  getStats:        (params) => client.get('/api/owner/stats', { params }),
  getTopProducts:  (params) => client.get('/api/owner/top-products', { params }),

  // Məhsullar
  getProducts:     (params) => client.get('/api/owner/products', { params }),
  createProduct:   (data)   => client.post('/api/owner/products', data),
  updateProduct:   (id, d)  => client.put(`/api/owner/products/${id}`, d),
  deleteProduct:   (id)     => client.delete(`/api/owner/products/${id}`),
  uploadImage:     (id, formData) => client.post(`/api/owner/products/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Kateqoriyalar
  getCategories:   ()       => client.get('/api/owner/categories'),
  createCategory:  (data)   => client.post('/api/owner/categories', data),

  // İnqredientlər
  getIngredients:  ()       => client.get('/api/owner/ingredients'),
  createIngredient:(data)   => client.post('/api/owner/ingredients', data),

  // Endirimlər
  getDiscounts:    ()       => client.get('/api/owner/discounts'),
  createDiscount:  (d)      => client.post('/api/owner/discounts', d),
  updateDiscount:  (id, d)  => client.put(`/api/owner/discounts/${id}`, d),
  toggleDiscount:  (id)     => client.patch(`/api/owner/discounts/${id}/toggle`),
  deleteDiscount:  (id)     => client.delete(`/api/owner/discounts/${id}`),

  // İşçilər
  getEmployees:    ()       => client.get('/api/owner/employees'),
  createEmployee:  (d)      => client.post('/api/owner/employees', d),
  updateEmployee:  (id, d)  => client.put(`/api/owner/employees/${id}`, d),
  blockEmployee:   (id, d)  => client.patch(`/api/owner/employees/${id}/block`, d),
  deleteEmployee:  (id)     => client.delete(`/api/owner/employees/${id}`),

  // Redaktə icazəsi
  getEditRequests: (p)      => client.get('/api/owner/edit-requests', { params: p }),
  approveRequest:  (id)     => client.patch(`/api/owner/edit-requests/${id}/approve`),
  rejectRequest:   (id)     => client.patch(`/api/owner/edit-requests/${id}/reject`),

  // Stok tarixçəsi
  getStockHistory: (p)      => client.get('/api/owner/stock-history', { params: p }),
};

export const aiAPI = {
  chat: (messages) => client.post('/api/ai/chat', { messages }),
};
