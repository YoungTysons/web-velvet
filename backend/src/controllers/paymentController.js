const prisma = require("../config/db");
const { PayOS } = require("@payos/node");

const payOS = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

// 1. API Tạo liên kết / QR thanh toán
const createPaymentLink = async (req, res) => {
    try {
        const { amount, description } = req.body;

        // orderCode của PayOS phải là số nguyên dương duy nhất (tối đa 9007199254740991)
        const orderCode = Number(String(Date.now()).slice(-6));

        const clientUrl = process.env.CLIENT_URL || "https://web-velvet.vercel.app";
        const paymentData = {
            orderCode: orderCode,
            amount: Number(amount) || 20000,
            description: (description || `Don hang ${orderCode}`).slice(0, 25), // PayOS giới hạn tối đa 25 ký tự
            returnUrl: `${clientUrl}/#checkout`, // URL khi khách hoàn tất trên web
            cancelUrl: `${clientUrl}/#checkout`,  // URL khi khách hủy
        };

        const paymentLinkRes = await payOS.paymentRequests.create(paymentData);

        return res.status(200).json({
            success: true,
            orderCode: orderCode,
            checkoutUrl: paymentLinkRes.checkoutUrl, // Link trang thanh toán PayOS
            qrCode: paymentLinkRes.qrCode,           // Chuỗi mã QR động
        });
    } catch (error) {
        console.error("Lỗi tạo link PayOS:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể tạo thanh toán",
        });
    }
};

// 2. Webhook: PayOS tự động bắn về khi khách quét mã chuyển khoản thành công
const handleWebhook = async (req, res) => {
    try {
        const webhookData = await payOS.webhooks.verify(req.body);

        console.log("--> Nhận webhook thanh toán thành công:", webhookData);

        if (webhookData && webhookData.orderCode) {
            const numericCode = Number(webhookData.orderCode);
            await prisma.order.updateMany({
                where: {
                    OR: [
                        { orderCode: `CF-${numericCode}` },
                        { orderCode: String(numericCode) }
                    ]
                },
                data: {
                    isPaid: true,
                    status: "PREPARING"
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Webhook processed successfully",
        });
    } catch (error) {
        console.error("Lỗi xác thực webhook:", error);
        return res.status(400).json({ success: false, message: "Invalid webhook" });
    }
};

// 3. API Kiểm tra trạng thái đơn (Frontend polling gọi định kỳ mỗi 2-3s)
const checkOrderStatus = async (req, res) => {
    try {
        const { orderCode } = req.params;
        const numericCode = Number(orderCode);
        const orderInfo = await payOS.paymentRequests.get(numericCode);

        // Nếu PayOS xác nhận đã thanh toán PAID -> Cập nhật Database MySQL
        if (orderInfo && orderInfo.status === "PAID") {
            await prisma.order.updateMany({
                where: {
                    OR: [
                        { orderCode: `CF-${numericCode}` },
                        { orderCode: String(numericCode) }
                    ]
                },
                data: {
                    isPaid: true,
                    status: "PREPARING"
                }
            });
        }

        return res.status(200).json({
            success: true,
            status: orderInfo.status, // "PAID", "PENDING", "CANCELLED"
            isPaid: orderInfo.status === "PAID"
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createPaymentLink,
    handleWebhook,
    checkOrderStatus,
};