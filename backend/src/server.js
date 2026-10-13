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
const http = require("http");
const { Server } = require("socket.io");
const chatRoutes = require("./routes/chatRouter");


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})
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
app.use("/api/chat", chatRoutes);

app.use("/api", uploadRouter);
// Lắng nghe cổng (đặt ở cuối)
// // tham gia vào phòng chat của khách hàng
io.on("connection", (socket) => {
    console.log("một người vừa kết nối ", socket.id)
    socket.on("join_room", (customerId) => {
        const roomName = `room_${customerId}`;
        socket.join(roomName);
        console.log('User ${socket.id} vưa vào room ${customerId}')
    })
    socket.on("send_message", async (data) => {
        try {
            const { customerId, senderId, senderRole, content } = data;
            if (!customerId || !content?.trim()) return;
            let conversation = await prisma.conversation.findUnique({
                where: {
                    customerId: Number(customerId)
                }
            }) //tạo cuộc hội thoại
            if (!conversation) {
                conversation = await prisma.conversation.create({
                    data: { customerId: Number(customerId) }
                });
            }
            // tạo tin nhắn

            const newMessage = await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId: Number(senderId || 0),
                    senderRole: senderRole || "CUSTOMER",
                    content: content.trim()
                },
            })
            //caập nhật hội thoại mới nhất 
            await prisma.conversation.update({
                where: {
                    id: conversation.id
                },
                data: {
                    lastMessage: content.trim()
                }
            })
            const roomName = `room_${customerId}`;
            io.to(roomName).emit("receive_message", {
                ...newMessage,
                customerId: Number(customerId),
            });
        } catch (error) {
            console.error("Error in send_message socket:", error);
        }
    })
    socket.on("disconnect", () => {
        console.log("🔌 Ngắt kết nối Socket:", socket.id);
    });

})
server.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    try {
        await prisma.$connect();
        console.log("✅ Database connected successfully! (MySQL: cafe_db)");
    } catch (error) {
        console.error("❌ Database connection error:", error.message);
    }
});

