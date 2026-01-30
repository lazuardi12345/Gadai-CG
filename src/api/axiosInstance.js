import axios from "axios";
import { toast } from "react-toastify"; 

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Variable flag buat kunci supaya gak redirect berkali-kali
let isRedirecting = false;

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Cek 401 dan pastikan belum dalam proses redirect
    if (error.response && error.response.status === 401 && !isRedirecting) {
      
      // Jika kita sudah di halaman login, jangan redirect lagi!
      if (window.location.pathname === "/login") {
        return Promise.reject(error);
      }

      isRedirecting = true; // KUNCI DISINI

      toast.error("Sesi telah berakhir. Silakan login kembali.", {
        position: "top-center",
        autoClose: 2000,
      });

      // Bersihkan data
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      
      // Gunakan replace agar history gak numpuk
      setTimeout(() => {
        window.location.replace("/login"); 
      }, 2000);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;