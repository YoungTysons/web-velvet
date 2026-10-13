const express = require('express');
const router = express.Router();
const {
  getRevenueStats,
  getTotalUsers,
  getMenu,
  toggleProductActive,
  getTopSellingProducts,
  getCustomers,
} = require("../controllers/admin/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const { createProduct, updateProduct, deleteProduct } = require("../controllers/admin/productManagement");

// Thống kê Dashboard
router.get("/stats/revenue", authMiddleware, adminMiddleware, getRevenueStats);
router.get("/stats/users", authMiddleware, adminMiddleware, getTotalUsers);
router.get("/stats/get-users", authMiddleware, adminMiddleware, getTotalUsers);
router.get("/stats/menu", authMiddleware, adminMiddleware, getMenu);

// Danh sách khách hàng & hội viên
router.get("/customers", authMiddleware, adminMiddleware, getCustomers);

// Quản lý trạng thái món ăn (Ẩn/Hiện ở menu)
router.put("/products/:id/toggle-active", authMiddleware, adminMiddleware, toggleProductActive);
router.get("/stats/top-selling", authMiddleware, adminMiddleware, getTopSellingProducts);

// Tạo mới sản phẩm
router.post("/products", authMiddleware, adminMiddleware, createProduct);

// Cập nhật sản phẩm
router.put("/products/:id", authMiddleware, adminMiddleware, updateProduct);

// Xóa sản phẩm
router.delete("/products/:id", authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;


