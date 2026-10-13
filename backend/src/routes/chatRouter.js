const express = require("express");
const router = express.Router();
const { getMessagesByCustomer } = require("../controllers/chatController");
const authMiddleware = require("../middlewares/authMiddleware"); // <-- 1. Import middleware

// 2. Gắn authMiddleware vào trước khi gọi controller
router.get("/messages/:customerId", authMiddleware, getMessagesByCustomer);

module.exports = router;
