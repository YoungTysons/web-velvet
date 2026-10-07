const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_2026";

// 1. ĐĂNG KÝ
const register = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, password } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!fullName || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ họ tên, số điện thoại và mật khẩu"
      });
    }

    // Kiểm tra SĐT hoặc Email đã tồn tại chưa
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: phoneNumber },
          ...(email ? [{ email: email }] : []),
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.phoneNumber === phoneNumber
          ? "Số điện thoại này đã được đăng ký"
          : "Email này đã được đăng ký",
      });
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới (khớp chuẩn Schema)
    const newUser = await prisma.user.create({
      data: {
        fullName: fullName,
        phoneNumber: phoneNumber,
        email: email || null,
        password: hashedPassword,
        role: "CUSTOMER", // Khớp enum: CUSTOMER | ADMIN | STAFF
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi hệ thống",
      error: error.message,
    });
  }
};

// 2. ĐĂNG NHẬP (Hỗ trợ cả SĐT hoặc Email)
const login = async (req, res) => {
  try {
    const { account, email, password } = req.body;
    // Cho phép đăng nhập bằng 'account' (SĐT hoặc Email) hoặc trường 'email'
    const loginIdentifier = account || email;

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tài khoản (SĐT/Email) và mật khẩu"
      });
    }

    // Tìm user theo email hoặc số điện thoại
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier },
          { phoneNumber: loginIdentifier },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản hoặc mật khẩu không chính xác",
      });
    }

    // So sánh mật khẩu băm
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản hoặc mật khẩu không chính xác",
      });
    }

    // Tạo JWT Token
    const payLoad = {
      id: user.id,
      role: user.role,
    };

    const token = jwt.sign(payLoad, JWT_SECRET, { expiresIn: "7d" });

    // Trả về kết quả cho client
    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi hệ thống",
      error: error.message,
    });
  }
};

// 3. LẤY THÔNG TIN CÁ NHÂN (Dùng với authMiddleware)
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        gender: true,
        phoneNumber: true,
        email: true,
        avatar: true,
        role: true,
        nickname: true,
        birthDate: true,
        brewPoints: true,
        membershipTier: true,
        isActive: true,
        addresses: {
          orderBy: { isDefault: 'desc' }
        },
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
const updateProfile = async (req, res) => {
  try {
    const { fullName, nickname, gender, email, phoneNumber, avatar, birthDate } = req.body;
    const userId = req.user.id;
    const updateProfile = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName,
        nickname: nickname,
        gender: gender,
        email: email,
        phoneNumber: phoneNumber,
        avatar: avatar,
        ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        nickname: true,
        email: true,
        gender: true,
        avatar: true,
        role: true,
        birthDate: true,
        brewPoints: true,
        membershipTier: true,
        createdAt: true,
      }
    });
    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công",
      user: updateProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi hệ thống",
      error: error.message,
    });
  }
}
const googleLogin = async (req, res) => {
  try {
    const { email, fullName, avatar } = req.body;
    let user = await prisma.user.findFirst({
      where: { email: email },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatar: true,
        role: true,
        phoneNumber: true,
        gender: true,
        nickname: true,
      }
    })

    if (!user) {
      // let randomPhone = "0123456789"

      const hashedPassword = await bcrypt.hash("google_" + Date.now(), 10);
      user = await prisma.user.create({
        data: {
          email: email,
          fullName: fullName,
          avatar: avatar,
          role: "CUSTOMER",
          phoneNumber: null,   // Phải là String và không trùng lặp
          password: hashedPassword,
        }
      })
    }
    const payLoad = {
      id: user.id,
      role: user.role,
    };

    const token = jwt.sign(payLoad, JWT_SECRET, { expiresIn: "7d" });

    // Trả về kết quả cho client
    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi hệ thống",
      error: error.message,
    })
  }

}
const getAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await prisma.address.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        isDefault: "desc", // Đưa địa chỉ mặc định lên đầu danh sách
      },
    });
    return res.status(200).json({
      success: true,
      message: "Lấy địa chỉ thành công",
      data: addresses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi hệ thống",
      error: error.message,
    })
  }
}
const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      recipientName, phoneNumber, city, district, ward, street, note, label, isDefault, } = req.body;
    if (!recipientName || !phoneNumber || !city || !street) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ các trường bắt buộc",
      });
    }
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: userId },
        data: { isDefault: false },
      });
    }
    const newAddress = await prisma.address.create({
      data: {
        userId,
        recipientName,
        phoneNumber,
        city,
        district,
        ward,
        street,
        note,
        label: label || "HOME",
        isDefault: Boolean(isDefault),
      }
    })
    return res.status(200).json({
      success: true,
      message: "Thêm địa chỉ thành công",
      data: newAddress,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi hệ thống",
      error: error.message,
    })
  }
}
//TODO:sua xoa dia chi
const updateAddress =async (req,res)=>{
  try {
    const addressId = parseInt(req.params.addressId, 10);
    const { recipientName, phoneNumber, city, district, ward, street, note, label, isDefault } = req.body;
    const userId = req.user.id;

    const existAddress = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!existAddress) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa chỉ",
      });
    }

    if (existAddress.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa địa chỉ này",
      });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: userId },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        userId,
        recipientName,
        phoneNumber,
        city,
        district,
        ward,
        street,
        note,
        label,
        isDefault: Boolean(isDefault),
      }
    });
    return res.status(200).json({
      success: true,
      message: "Cập nhật địa chỉ thành công",
      data: updatedAddress,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi hệ thống",
      error: error.message,
    })
  }
}
const deleteAddress = async (req, res) => {
  try {
    const addressId = parseInt(req.params.addressId, 10);
    const userId = req.user.id;

    const existAddress = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existAddress) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa chỉ",
      });
    }

    if (existAddress.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa địa chỉ này",
      });
    }

    // 1. Gỡ liên kết địa chỉ khỏi các đơn hàng cũ (đặt addressId về null) để tránh lỗi ràng buộc khóa ngoại MySQL
    await prisma.order.updateMany({
      where: { addressId: addressId },
      data: { addressId: null },
    });

    // 2. Thực hiện xóa địa chỉ
    const deletedAddress = await prisma.address.delete({
      where: { id: addressId },
    });

    // 3. Nếu địa chỉ vừa xóa là mặc định, tự động chuyển 1 địa chỉ còn lại thành mặc định
    if (existAddress.isDefault) {
      const remainingAddress = await prisma.address.findFirst({
        where: { userId: userId },
      });
      if (remainingAddress) {
        await prisma.address.update({
          where: { id: remainingAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Xóa địa chỉ thành công",
      data: deletedAddress,
    });
  } catch (error) {
    console.error("Lỗi xóa địa chỉ:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi hệ thống khi xóa địa chỉ",
      error: error.message,
    });
  }
};
module.exports = {
  register,
  login,
  updateProfile,
  getProfile,
  googleLogin,
  updateAddress,
  getAddress,
  createAddress,
  deleteAddress,
};
