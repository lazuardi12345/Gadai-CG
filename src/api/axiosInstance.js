import axios from "axios";
import { toast } from "react-toastify"; 

const API_BASE = import.meta.env.VITE_API_BASE_URL;
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
    const originalRequest = error.config;

    // Jika error 401 dan bukan sedang di halaman login
    if (error.response && error.response.status === 401 && window.location.pathname !== "/login") {
      
      // OPTIONAL: Tambahkan pengecekan apakah ini request pertama setelah app dibuka
      // Kadang iOS butuh waktu untuk 'wake up' network-nya.
      
      if (!isRedirecting) {
        isRedirecting = true;

        // Cek apakah beneran ga ada token, atau tokennya expired
        const token = localStorage.getItem("auth_token");
        
        if (token) {
            toast.error("Sesi telah berakhir. Silakan login kembali.");
        }

        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");

        setTimeout(() => {
          window.location.replace("/login");
          isRedirecting = false; // Reset agar bisa dipakai lagi nanti
        }, 1500);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;