require('dotenv').config();
const express = require("express");
const cors = require("cors");
const productRouter = require("./routes/productRouter");
const userRoutes = require("./routes/userRoutes");
const prisma = require("./config/db");
const uploadRouter = require("./routes/uploadRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const voucherRoutes = require("./routes/voucherRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const port = process.env.PORT || 8080;
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/product", productRouter);
app.use("/api/auth", userRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api", uploadRouter);
// Lắng nghe cổng (đặt ở cuối)
app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    try {
        await prisma.$connect();
        console.log("✅ Database connected successfully! (MySQL: cafe_db)");
    } catch (error) {
        console.error("❌ Database connection error:", error.message);
    }
});

