const express = require('express');
const router = express.Router();
const {
  getRevenueStats,
  getTotalUsers,
  getMenu,
  toggleProductActive,
  getTopSellingProducts,
} = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

// Thống kê Dashboard
router.get("/stats/revenue", authMiddleware, adminMiddleware, getRevenueStats);
router.get("/stats/users", authMiddleware, adminMiddleware, getTotalUsers);
router.get("/stats/get-users", authMiddleware, adminMiddleware, getTotalUsers);
router.get("/stats/menu", authMiddleware, adminMiddleware, getMenu);

// Quản lý trạng thái món ăn (Ẩn/Hiện ở menu)
router.put("/products/:id/toggle-active", authMiddleware, adminMiddleware, toggleProductActive);
router.get("/stats/top-selling", authMiddleware, adminMiddleware, getTopSellingProducts);

module.exports = router;


