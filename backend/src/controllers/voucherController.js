const prisma = require("../config/db");

// 1. Lấy danh sách Voucher đang hoạt động
const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await prisma.voucher.findMany({
      where: {
        isActive: true,
        endDate: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({
      success: true,
      data: vouchers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Không thể tải danh sách voucher",
    });
  }
};

// 2. Kiểm tra và áp dụng mã Voucher cho đơn hàng
const checkVoucher = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập mã ưu đãi" });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!voucher || !voucher.isActive) {
      return res.status(404).json({ success: false, message: "Mã ưu đãi không tồn tại hoặc đã bị khóa" });
    }

    if (new Date() > new Date(voucher.endDate)) {
      return res.status(400).json({ success: false, message: "Mã ưu đãi đã hết hạn sử dụng" });
    }

    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({ success: false, message: "Mã ưu đãi đã hết lượt sử dụng" });
    }

    const total = Number(orderTotal) || 0;
    if (total < Number(voucher.minOrderAmount)) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu phải từ ${Number(voucher.minOrderAmount).toLocaleString("vi-VN")}đ để dùng mã này`,
      });
    }

    let discount = 0;
    if (voucher.discountType === "PERCENT") {
      discount = (total * Number(voucher.discountValue)) / 100;
      if (voucher.maxDiscount && discount > Number(voucher.maxDiscount)) {
        discount = Number(voucher.maxDiscount);
      }
    } else {
      discount = Number(voucher.discountValue);
    }

    return res.status(200).json({
      success: true,
      message: "Áp dụng mã ưu đãi thành công",
      voucher: {
        id: voucher.id,
        code: voucher.code,
        title: voucher.title,
        discountType: voucher.discountType,
        discountAmount: discount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi kiểm tra voucher",
    });
  }
};

// 3. Lấy danh sách Voucher trong ví của người dùng
const getMyVouchers = async (req, res) => {
  try {
    const userId = req.user?.id || Number(req.query?.userId);
    if (!userId) {
      return res.status(200).json({ success: true, vouchers: [] });
    }

    const userVouchers = await prisma.userVoucher.findMany({
      where: { userId },
      include: { voucher: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      vouchers: userVouchers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi lấy ví voucher",
    });
  }
};

module.exports = {
  getAllVouchers,
  checkVoucher,
  getMyVouchers,
};
