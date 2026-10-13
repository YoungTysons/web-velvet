import axiosClient from "./axiosClient";

export const fetchProducts = async (params) => {
  try {
    const data = await axiosClient.get("/product", { params });
    if (data.success && Array.isArray(data.data)) {
      const items = data.data.map((item) => ({
        ...item,
        price: `${Number(item.basePrice).toLocaleString("vi-VN")}đ`,
        category: item.category || "coffee",
        soldCount: item.soldCount !== undefined ? item.soldCount : 0,
        soldTrend: item.soldTrend || (item.soldCount > 0 ? `+${item.soldCount} ly` : "Mới tạo"),
      }));
      // Gắn kèm metadata phân trang từ backend nếu có
      items.pagination = data.pagination || null;
      return items;
    }
    return [];
  } catch (error) {
    console.error("Lỗi fetchProducts:", error);
    return [];
  }
};

export const getProducts = fetchProducts;

export const getProductById = (id) => {
  return axiosClient.get(`/product/${id}`);
};
