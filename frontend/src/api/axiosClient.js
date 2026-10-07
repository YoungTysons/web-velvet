import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://web-velvet.vercel.app/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request Interceptor: Tự động gán token nếu sau này có chức năng xác thực
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Trích xuất trực tiếp response.data và bắt lỗi tập trung
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      console.error(`[API Error ${error.response.status}]:`, error.response.data);
    } else {
      console.error("[API Network Error]:", error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
