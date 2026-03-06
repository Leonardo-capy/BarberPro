import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL  // URL do backend no Render
    : '',  // Vazio = mesma origem em desenvolvimento
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