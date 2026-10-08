import axiosClient from "./axiosClient";

const adminApi = {
  getRevenueStats: (params) => {
    return axiosClient.get("/admin/stats/revenue", { params });
  },
  getUsers: (params) => {
    return axiosClient.get("/admin/stats/users", { params });
  },
  getMenuStats: () => {
    return axiosClient.get("/admin/stats/menu");
  },
  toggleProductActive: (id, isActive) => {
    return axiosClient.put(`/admin/products/${id}/toggle-active`, { isActive });
  },
  getTopSelling: (params) => {
    return axiosClient.get("/admin/stats/top-selling", { params });
  },
};

export default adminApi;
