import axios from 'axios';

const api = axios.create({
  // Mudamos aqui para garantir que ele use a variável de produção da Vercel
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL 
    : 'http://localhost:3000',
  withCredentials: true,
  timeout: 10000
});

// Log para debug (remova em produção)
api.interceptors.request.use(request => {
  console.log('📤 Request:', request.method, request.url);
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('📥 Response:', response.status);
    return response;
  },
  error => {
    console.log('❌ Erro na requisição:', error.response?.status);
    return Promise.reject(error);
  }
);

export default api;