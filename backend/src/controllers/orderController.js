const prisma = require("../config/db");
const { PayOS } = require("@payos/node");

// Khởi tạo PayOS để sẵn sàng tạo link QR nếu khách chọn thanh toán online
const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

// API: Tạo đơn hàng mới
const createOrder = async (req, res) => {
  try {
    const {
      userId,
      shippingAddress,
      subtotal,
      shippingFee,
      discountAmount,
      totalAmount,
      paymentMethod,
      deliveryType,
      voucherCode,
      note,
      vatRequired,
      vatCompany,
      vatTaxCode,
      vatAddress,
      items, // Mảng các món trong giỏ hàng
    } = req.body;

    // 1. Sinh mã đơn hàng (PayOS yêu cầu orderCode dạng số nguyên dương)
    const numericOrderCode = Number(String(Date.now()).slice(-6));
    const orderCodeString = `CF-${numericOrderCode}`;

    // Kiểm tra userId có tồn tại trong database không (nếu không hoặc là khách vãng lai thì để null)
    let validUserId = null;
    if (userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: Number(userId) },
      });
      if (userExists) {
        validUserId = userExists.id;
      }
    }

    // Tính điểm Brew tích lũy: 1 điểm cho mỗi 10.000đ
    const pointsEarned = Math.max(0, Math.floor((Number(totalAmount) || 0) / 10000));

    // Lấy sản phẩm mặc định để làm fallback phòng khi id sản phẩm không hợp lệ
    const defaultProduct = await prisma.product.findFirst();
    const fallbackProductId = defaultProduct ? defaultProduct.id : 1;

    // 2. Lưu đơn hàng vào MySQL qua Prisma
    const newOrder = await prisma.order.create({
      data: {
        orderCode: orderCodeString,
        userId: validUserId,
        shippingAddress: shippingAddress || (deliveryType === "PICKUP" ? "Lấy tại quầy cửa hàng" : "Giao tận nơi"),
        deliveryType: deliveryType === "PICKUP" || deliveryType === "pickup" || deliveryType === "TAKEAWAY" ? "PICKUP" : "DELIVERY",
        subtotal: Number(subtotal) || 0,
        shippingFee: Number(shippingFee) || 0,
        discountAmount: Number(discountAmount) || 0,
        totalAmount: Number(totalAmount) || 0,
        voucherCode: voucherCode || null,
        brewPointsEarned: pointsEarned,
        paymentMethod: paymentMethod || "COD",
        status: "PENDING",
        isPaid: false,
        note: note || "",
        vatRequired: Boolean(vatRequired),
        vatCompany: vatCompany || null,
        vatTaxCode: vatTaxCode || null,
        vatAddress: vatAddress || null,
        items: {
          create: (items || []).map((item) => ({
            productId: Number(item.productId) && Number(item.productId) > 0 ? Number(item.productId) : fallbackProductId,
            quantity: Number(item.quantity) || 1,
            sizeName: item.sizeName || item.size || "Size M",
            sizePrice: Number(item.sizePrice) || 0,
            sweetness: item.sweetness || item.sugar || "100%",
            ice: item.ice || "Chuẩn đá",
            note: item.note || null,
            unitPrice: Number(item.unitPrice) || 0,
            toppings: item.toppings && item.toppings.length > 0 ? {
              create: item.toppings.map((tp) => ({
                toppingId: Number(tp.id) || 1,
                price: Number(tp.price) || 0,
              }))
            } : undefined,
          })),
        },
      },
      include: {
        items: {
          include: {
            toppings: true, // Phải include toppings để khi trả về có dữ liệu
          },
        },
      },
    });

    // 2.1 Nếu khách hàng đã đăng nhập, tự động tích lũy hạt Brew và ghi nhận lịch sử giao dịch điểm
    if (validUserId && pointsEarned > 0) {
      try {
        await prisma.user.update({
          where: { id: validUserId },
          data: {
            brewPoints: {
              increment: pointsEarned,
            },
          },
        });

        await prisma.pointTransaction.create({
          data: {
            userId: validUserId,
            points: pointsEarned,
            type: "EARN",
            orderCode: orderCodeString,
            description: `Tích lũy điểm hạt Brew từ đơn hàng #${orderCodeString}`,
          },
        });
      } catch (pointErr) {
        console.warn("Lỗi cộng điểm hội viên:", pointErr.message);
      }
    }

    // 3. Xử lý trường hợp khách chọn thanh toán online PayOS / VietQR
    let payosData = null;
    if (paymentMethod === "vietqr" || paymentMethod === "PAYOS") {
      try {
        const clientUrl = process.env.CLIENT_URL || "https://web-velvet.vercel.app";
        const paymentRes = await payOS.paymentRequests.create({
          orderCode: numericOrderCode,
          amount: Math.round(Number(totalAmount)),
          description: `Don hang ${numericOrderCode}`.slice(0, 25),
          returnUrl: `${clientUrl}/#checkout`,
          cancelUrl: `${clientUrl}/#checkout`,
        });

        payosData = {
          orderCode: numericOrderCode,
          checkoutUrl: paymentRes.checkoutUrl,
          qrCode: paymentRes.qrCode,
        };
      } catch (payosErr) {
        console.error("Lỗi tạo mã QR PayOS:", payosErr.message);
        // Đơn hàng vẫn được lưu ở Database, chỉ thông báo lỗi sinh QR nếu có
      }
    }

    return res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công!",
      order: newOrder,
      payos: payosData, // Chứa qrCode & checkoutUrl nếu chọn VietQR
    });
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Không thể tạo đơn hàng",
    });
  }
};

// API: Lấy danh sách đơn hàng của người dùng hiện tại
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id || req.query?.userId;
    if (!userId) {
      return res.status(200).json({
        success: true,
        orders: [],
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: Number(userId),
      },
      include: {
        items: {
          include: {
            product: true,
            toppings: {
              include: {
                topping: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Không thể lấy danh sách đơn hàng",
    });
  }
};

// API: Hủy đơn hàng (nếu đang ở trạng thái PENDING hoặc PREPARING)
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existingOrder = await prisma.order.findUnique({
      where: { id: Number(id) },
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    if (userId && existingOrder.userId && existingOrder.userId !== Number(userId)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền hủy đơn hàng này" });
    }

    if (existingOrder.status === "COMPLETED" || existingOrder.status === "DELIVERING") {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng đang trên đường giao hoặc đã hoàn tất, không thể hủy!",
      });
    }
    // Xóa các món trong đơn trước
    await prisma.orderItem.deleteMany({ where: { orderId: Number(id) } });
    // Xóa hẳn đơn hàng khỏi Database
    await prisma.order.delete({ where: { id: Number(id) } });


    return res.status(200).json({
      success: true,
      message: "Đã hủy đơn hàng thành công!",
      order: null,
    });
  } catch (error) {
    console.error("Lỗi khi hủy đơn hàng:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Không thể hủy đơn hàng",
    });
  }
};

// API: Lấy tất cả đơn hàng (cho Admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
            avatar: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng admin:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Không thể lấy danh sách đơn hàng",
    });
  }
};

// API: Cập nhật trạng thái đơn hàng (cho Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "PENDING",
      "PREPARING",
      "PREPARED",
      "DELIVERING",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Phải là một trong: ${validStatuses.join(", ")}`,
      });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: Number(id) },
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    const updated = await prisma.order.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công!",
      order: updated,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Không thể cập nhật trạng thái đơn hàng",
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};

