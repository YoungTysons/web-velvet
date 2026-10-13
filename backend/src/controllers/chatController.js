const prisma = require("../config/db");

// Lấy toàn bộ lịch sử tin nhắn của khách hàng
const getMessagesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!customerId) {
      return res.status(400).json({ success: false, message: "Thiếu customerId" });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { customerId: Number(customerId) },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }, // Sắp xếp tin nhắn từ cũ đến mới
        },
      },
    });

    return res.status(200).json({
      success: true,
      messages: conversation ? conversation.messages : [],
    });
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử chat:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy lịch sử chat",
    });
  }
};

module.exports = {
  getMessagesByCustomer,
};
