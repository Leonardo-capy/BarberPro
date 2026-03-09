import axios from 'axios';

const api = axios.create({
  baseURL: '',
  withCredentials: true,
  timeout: 10000
});

// Apenas loga os erros, não redireciona
api.interceptors.response.use(
  response => response,
  error => {
    console.log('Erro na requisição:', error.response?.status);
    return Promise.reject(error);
  }
);

export default api;