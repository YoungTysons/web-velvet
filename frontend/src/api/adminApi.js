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
  createProduct: (data) => {
    return axiosClient.post("/admin/products", data);
  },
  updateProduct: (id, data) => {
    return axiosClient.put(`/admin/products/${id}`, data);
  },
  deleteProduct: (id) => {
    return axiosClient.delete(`/admin/products/${id}`);
  },
  getCustomers: (params) => {
    return axiosClient.get("/admin/customers", { params });
  },
};

export default adminApi;
