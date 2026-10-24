import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Token authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('folioverse_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Check for Throttling (HTTP 429)
      if (error.response.status === 429) {
        const detail = error.response.data?.detail || 'Request was throttled. Expected available in a few seconds.';
        console.warn('API Throttled:', detail);
      }
    }
    return Promise.reject(error);
  }
);

// API methods
export const authService = {
  register: (data) => api.post('/register/', data),
  login: (data) => api.post('/login/', data),
  getProfile: () => api.get('/user/'),
  logout: () => api.post('/logout/'),
};

export const bookService = {
  // GET /api/books/ with pagination, filtering, searching, ordering
  getBooks: (params = {}) => api.get('/books/', { params }),
  // GET /api/books/<id>/
  getBook: (id) => api.get(`/books/${id}/`),
  // POST /api/books/
  createBook: (data) => api.post('/books/', data),
  // PUT /api/books/<id>/
  updateBook: (id, data) => api.put(`/books/${id}/`, data),
  // PATCH /api/books/<id>/
  patchBook: (id, data) => api.patch(`/books/${id}/`, data),
  // DELETE /api/books/<id>/
  deleteBook: (id) => api.delete(`/books/${id}/`),
  // Check API health
  checkHealth: () => api.get('/'),
};

export default api;
