import axios from 'axios';

axios.defaults.baseURL = window.location.origin; // otomatis pakai https jika situsnya https
axios.defaults.withCredentials = true;

window.axios = axios;
