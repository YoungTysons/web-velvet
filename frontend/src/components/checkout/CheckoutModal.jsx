import { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import logoIcon from "../../assets/logo-icon.png";
import { money, amount } from "../../utils/format";
import orderApi from "../../api/orderApi";
import axiosClient from "../../api/axiosClient";


// Dữ liệu mẫu đồ uống chuẩn bị thanh toán khi giỏ hàng trống (fallback)
const DEFAULT_SAMPLE_ITEMS = [
  {
    id: "sample-1",
    name: "Cà Phê Sữa Truyền Thống",
    price: "55.000 đ",
    basePrice: 55000,
    quantity: 2,
    size: "Size L",
    note: "50% Đường • Ít Đá",
    topping: "+ Kem Muối Hồng Himalaya",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAM8V9vfFRo9QXR8W7xxUSYhDRBAPwn1dofJdoNCUlmTmdZZTUGlJppUbKtAOFrSH16ztd1yHvMoWqbEDrjh7mCw4ic8EaS-3GluOXBplAXADUZNvETobdhUpZ-xX2I7dDz5YTvSkf9QkL-NXWDNjXkuIBU43T3S7pprAcN36sEfm9nF9S8RtW6MWSTWiDH3yCvJx0-UIkcBRx_DR2QhtGzlRXYwStZYgG3OBac6lVSSObIHHJ-btF2eA",
  },
  {
    id: "sample-2",
    name: "Trà Sữa Oolong Nướng",
    price: "56.000 đ",
    basePrice: 56000,
    quantity: 1,
    size: "Size M",
    note: "70% Đường • Chuẩn Đá",
    topping: "+ Trân Châu Hoàng Kim Mật Mía",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDwo3yM-JTOYxylZYZLtZs_sLuOpso6uCmVYeXyM5dksLqkDbjrva0wsAWf-N7YTL9c0Pq8fRECsgeEFYoukC8lmqtKnibSLsBU0zN5tZB81u6CUzfPUWWTvXmc_TifzHGjbZpAYhgwb606CZ4FLzgdjOhU9qsWK6vKJx5u5ibrxjbHeXSXYEkinIlqL-pdpk4h_iGv52L1SWpyhiXxAAtRGOGjo0PgKWF3t1YWWUvA5KaL24JMzKa84g",
  },
  {
    id: "sample-3",
    name: "Velvet Mocha Frosting Hạt Phỉ",
    price: "65.000 đ",
    basePrice: 65000,
    quantity: 1,
    size: "Size L",
    note: "Ít Ngọt • Kem Tươi Béo",
    topping: "Đặc quyền Best-seller tuần",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBqjctmMeBS6BU-9NLoXTan24mxuDbpBoG_oBDZ6ILQWxcRGtRNGWWqr45OvbGSn9cenYtznO6Pl-PoMIMuNEJ6DBFQH4fC0LpTCZli-nMbq8El_2rtHpT61YOCQlpV8fn1gvXkxKZssF7qiLbf4H6RtznZo1HByb_KsBy1KFzg0kKOx9oWlQBLKW-JjzhbCUOUJmNalIeh-Hqv78PsvX7NT_2GmJ4iFIaG2-4IN76oDum5ZStAqn7tIQ",
  },
];

export default function CheckoutModal({
  isOpen = true,
  onClose,
  onBackToStore,
  cart = [],
  user: propUser,
  onClearCart,
  onOpenProfile,
  onOpenAdmin,
  onOpenAuth,
  onOpenCart,
}) {
  const { user: authUser, logout } = useAuth();
  const currentUser = propUser !== undefined && propUser !== null ? propUser : authUser;
  const isAdmin = !!(currentUser && (currentUser.role || "").toUpperCase() === "ADMIN");

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  // Trạng thái Phương thức nhận hàng: "delivery" (Giao tận nơi) hoặc "pickup" (Lấy tại quán)
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");

  // Thông tin người nhận
  const [customerName, setCustomerName] = useState(
    currentUser?.fullName || "Nguyễn Minh Trí"
  );
  const [customerPhone, setCustomerPhone] = useState(
    currentUser?.phoneNumber || "0903 888 234"
  );
  const [customerEmail, setCustomerEmail] = useState(
    currentUser?.email || "minhtri.design@velvetbrew.vn"
  );

  useEffect(() => {
    if (currentUser?.fullName && customerName === "Nguyễn Minh Trí") {
      setCustomerName(currentUser.fullName);
    }
    if (currentUser?.phoneNumber && customerPhone === "0903 888 234") {
      setCustomerPhone(currentUser.phoneNumber);
    }
    if (currentUser?.email && customerEmail === "minhtri.design@velvetbrew.vn") {
      setCustomerEmail(currentUser.email);
    }
    // Tự động nạp địa chỉ mặc định từ tài khoản nếu người dùng đã lưu địa chỉ
    if (currentUser?.addresses && currentUser.addresses.length > 0) {
      const defaultAddr = currentUser.addresses.find((a) => a.isDefault) || currentUser.addresses[0];
      if (defaultAddr) {
        if (defaultAddr.street) setStreetAddress(defaultAddr.street);
        if (defaultAddr.district) setDistrict(defaultAddr.district);
        if (defaultAddr.city) setCity(defaultAddr.city);
        if (defaultAddr.recipientName) setCustomerName(defaultAddr.recipientName);
        if (defaultAddr.phoneNumber) setCustomerPhone(defaultAddr.phoneNumber);
        if (defaultAddr.note) setDeliveryNotes(defaultAddr.note);
      }
    }
  }, [currentUser]);

  const initials = currentUser?.fullName
    ? (currentUser.fullName.trim().split(/\s+/).length > 1
      ? currentUser.fullName.trim().split(/\s+/).map((n) => n[0]).slice(-2).join("").toUpperCase()
      : currentUser.fullName.trim().charAt(0).toUpperCase())
    : "VB";
  const [city, setCity] = useState("HN");
  const [district, setDistrict] = useState("HK");
  const [streetAddress, setStreetAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [deliveryTiming, setDeliveryTiming] = useState("now"); // "now" | "scheduled"

  // Tùy chọn Sống xanh & Hóa đơn VAT
  const [ecoFriendly, setEcoFriendly] = useState(true);
  const [vatRequired, setVatRequired] = useState(false);
  const [vatCompany, setVatCompany] = useState("");
  const [vatTaxCode, setVatTaxCode] = useState("");
  const [vatAddress, setVatAddress] = useState("");
  const [payosCheckoutUrl, setPayosCheckoutUrl] = useState("");
  const [payosQrCode, setPayosQrCode] = useState("");
  const [payosOrderCode, setPayosOrderCode] = useState(null);


  // Phương thức thanh toán: "vietqr" | "card" | "wallet" | "cod"
  const [paymentMethod, setPaymentMethod] = useState("vietqr");

  // Mã giảm giá / Ưu đãi
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupons, setAppliedCoupons] = useState([]);
  const [couponMessage, setCouponMessage] = useState("");

  // Trạng thái sau khi bấm "Đặt hàng"
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState(null);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  // Countdown timer cho QR Code (10 phút)
  const [qrCountdown, setQrCountdown] = useState(600);

  useEffect(() => {
    let timer;
    if (showQRModal && qrCountdown > 0) {
      timer = setInterval(() => setQrCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showQRModal, qrCountdown]);

  // Polling tự động kiểm tra trạng thái thanh toán từ PayOS mỗi 2 giây
  useEffect(() => {
    let pollTimer;
    if (showQRModal && payosOrderCode) {
      pollTimer = setInterval(async () => {
        try {
          const res = await axiosClient.get(`/payment/order-status/${payosOrderCode}`);
          if (res && (res.status === "PAID" || res.isPaid)) {
            clearInterval(pollTimer);
            setShowQRModal(false);
            setOrderSuccess(true);
            if (onClearCart) onClearCart();
          }
        } catch {
          // Bỏ qua lỗi polling tạm thời khi chưa thanh toán
        }
      }, 2000);
    }
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [showQRModal, payosOrderCode, onClearCart]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Xác định danh sách món thanh toán
  const displayItems = useMemo(() => {
    if (cart && cart.length > 0) {
      return cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: money(item.unitPrice || amount(item.price || item.basePrice)),
        unitPrice: item.unitPrice || amount(item.price || item.basePrice),
        quantity: item.quantity || 1,
        size: item.size || "Size M",
        sizePrice: item.sizePrice || 0,
        note:
          item.note ||
          (item.sugar && item.ice ? `${item.sugar} Đường • ${item.ice} Đá` : "Chuẩn vị"),
        topping:
          item.toppings && item.toppings.length > 0
            ? `+ ${item.toppings.map((t) => t.name || t.label || t).join(", ")}`
            : null,
        toppings: item.toppings || [],
        image:
          item.image ||
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAM8V9vfFRo9QXR8W7xxUSYhDRBAPwn1dofJdoNCUlmTmdZZTUGlJppUbKtAOFrSH16ztd1yHvMoWqbEDrjh7mCw4ic8EaS-3GluOXBplAXADUZNvETobdhUpZ-xX2I7dDz5YTvSkf9QkL-NXWDNjXkuIBU43T3S7pprAcN36sEfm9nF9S8RtW6MWSTWiDH3yCvJx0-UIkcBRx_DR2QhtGzlRXYwStZYgG3OBac6lVSSObIHHJ-btF2eA",
      }));
    }
    return DEFAULT_SAMPLE_ITEMS;
  }, [cart]);

  // Tính toán chi phí
  const totalItemCount = displayItems.reduce((acc, it) => acc + it.quantity, 0);

  const subtotal = useMemo(() => {
    return displayItems.reduce((acc, it) => {
      const p = it.unitPrice || amount(it.price) || 0;
      return acc + p * it.quantity;
    }, 0);
  }, [displayItems]);

  const baseShippingFee = deliveryMethod === "pickup" ? 0 : 25000;

  const hasFreeship = appliedCoupons.some((c) => c.code === "FREESHIP");
  const shippingDiscount =
    deliveryMethod === "delivery" && hasFreeship ? baseShippingFee : 0;

  const voucherDiscount = appliedCoupons
    .filter((c) => c.code !== "FREESHIP")
    .reduce((sum, c) => sum + c.discount, 0);

  const grandTotal = Math.max(
    0,
    subtotal + baseShippingFee - shippingDiscount - voucherDiscount
  );

  const brewPoints = Math.floor(grandTotal / 10000);
  const totalSavings = shippingDiscount + voucherDiscount;

  // Thêm/Xóa mã giảm giá
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (appliedCoupons.some((c) => c.code === code)) {
      setCouponMessage("Mã này đã được áp dụng trong đơn!");
      return;
    }

    if (code === "VELVETNEW") {
      setAppliedCoupons((prev) => [
        ...prev,
        { code: "VELVETNEW", discount: 20000, label: "VELVETNEW (-20.000đ)" },
      ]);
      setCouponMessage("Áp dụng mã VELVETNEW thành công!");
    } else if (code === "FREESHIP") {
      setAppliedCoupons((prev) => [
        ...prev,
        { code: "FREESHIP", discount: 25000, label: "FREESHIP (Giảm 25.000đ)" },
      ]);
      setCouponMessage("Áp dụng mã FREESHIP thành công!");
    } else if (code === "VELVET50") {
      setAppliedCoupons((prev) => [
        ...prev,
        { code: "VELVET50", discount: 50000, label: "VELVET50 (-50.000đ)" },
      ]);
      setCouponMessage("Áp dụng mã VELVET50 giảm 50.000đ thành công!");
    } else {
      setCouponMessage("Mã ưu đãi không hợp lệ hoặc đã hết lượt!");
    }
  };

  const handleRemoveCoupon = (codeToRemove) => {
    setAppliedCoupons((prev) => prev.filter((c) => c.code !== codeToRemove));
  };

  // Xử lý bấm Đặt Hàng & Thanh Toán
  const handlePlaceOrder = async () => {
    if (!customerName || !customerName.trim() || !customerPhone || !customerPhone.trim()) {
      alert("⚠️ Vui lòng điền đầy đủ họ tên và số điện thoại người nhận!");
      return;
    }

    if (deliveryMethod === "delivery") {
      if (!streetAddress || !streetAddress.trim()) {
        alert("⚠️ Bạn chưa có hoặc chưa điền địa chỉ nhận hàng!\nVui lòng chọn từ sổ địa chỉ hoặc nhập số nhà, tên đường nhận hàng.");
        return;
      }
    }

    setOrderProcessing(true);

    try {
      // 2. Chuẩn bị payload gửi lên Backend
      const orderPayload = {
        userId: currentUser?.id || null,
        shippingAddress:
          deliveryMethod === "delivery"
            ? `${streetAddress}, ${district}, ${city}`
            : "Nhận tại quầy cửa hàng",
        deliveryType: deliveryMethod === "pickup" ? "PICKUP" : "DELIVERY",
        subtotal: subtotal,
        shippingFee: baseShippingFee - shippingDiscount,
        discountAmount: totalSavings || 0,
        totalAmount: grandTotal,
        voucherCode: appliedCoupons.map((c) => c.code).join(", ") || null,
        paymentMethod: paymentMethod, // "vietqr" | "cod" | "card" | "wallet"
        note: deliveryNotes || "",
        vatRequired: Boolean(vatRequired),
        vatCompany: vatRequired ? vatCompany : null,
        vatTaxCode: vatRequired ? vatTaxCode : null,
        vatAddress: vatRequired ? vatAddress : null,
        items: displayItems.map((item) => ({
          productId: item.id && !isNaN(item.id) ? Number(item.id) : 1, // Fallback ID sản phẩm
          quantity: item.quantity || 1,
          sizeName: item.size || "Size M",
          sizePrice: item.sizePrice || 0,
          sweetness: item.note || "Chuẩn vị",
          ice: "Chuẩn đá",
          note: item.note || null,
          toppings: (item.toppings || []).map((t) => ({
            id: t.id,
            name: t.name || t.label,
            price: Number(t.price) || 0,
          })),
          unitPrice: item.unitPrice || 50000,
        })),
      };
      const response = await orderApi.createOrder(orderPayload);
      if (response && response.success) {
        setCreatedOrderCode(response.order.orderCode);
        // Nếu chọn VietQR / PayOS và backend trả về link/mã QR
        if (paymentMethod === "vietqr" && response.payos) {
          setPayosCheckoutUrl(response.payos.checkoutUrl);
          setPayosQrCode(response.payos.qrCode);
          setPayosOrderCode(response.payos.orderCode);
          setShowQRModal(true); // Mở popup QR
          setCreatedOrderId(response.order.id);
        } else {
          // Nếu là COD hoặc phương thức khác: Hoàn tất đơn ngay
          setOrderSuccess(true);
          if (onClearCart) onClearCart(); // Xóa sạch giỏ hàng
        }
      }
    } catch (err) {
      console.error("Lỗi khi đặt hàng:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra khi tạo đơn hàng!");
    } finally {
      setOrderProcessing(false);
    }



  };
  // Xử lý khi khách bấm nút [X] hoặc "Đóng / Hủy" trên popup QR
  const handleCancelQRPayment = async () => {
    const isConfirmed = window.confirm("Bạn có chắc chắn muốn hủy thanh toán đơn hàng này không?");
    if (!isConfirmed) return;

    try {
      if (createdOrderId) {
        // Gọi API backend chuyển trạng thái đơn sang CANCELLED
        await orderApi.cancelOrder(createdOrderId);
      }
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
    } finally {
      setShowQRModal(false); // Đóng popup QR
    }
  };

  const handleCompleteVietQRPayment = () => {
    setShowQRModal(false);
    setOrderSuccess(true);
    if (onClearCart) onClearCart();
  };

  const handleReturnHome = () => {
    if (onClose) onClose();
    if (onBackToStore) onBackToStore();
  };

  if (!isOpen) return null;

  return (
    <div className="w-full bg-surface font-body-md text-body-md text-on-surface min-h-screen">
      {/* 1. HEADER CHUẨN THƯƠNG HIỆU */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/85 backdrop-blur-md shadow-[0_1px_8px_rgba(62,39,35,0.06)]">
        <div className="h-20 w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-space-md">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-space-sm shrink-0 cursor-pointer"
            onClick={handleReturnHome}
            title="Quay lại cửa hàng"
          >
            <img
              alt="Velvet & Brew Brand Logo"
              className="h-8 w-auto object-contain"
              src={logoIcon}
              onError={(e) => {
                e.target.src =
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuBRMxOCJJIwhg2mAHon8lvGMa1yym3orqDiRdlg40dBTFx0TvEYfZ71neLTQ8uprX8147qfyIYLJzVxXFz0-7ICt2RDwvn4jZ2tle3rHiJDQ2CKmX2n687yOluhuMxETFM7MOXoF--pdXecPCdu558V282Cl4oqc_UILl-QtvYPqxNgKmGVit_2jgH1wviVhHrNLduF8f-hBJVF13RvckcnmMoRE6pnVYhqI2aR7tzp6m2ScQKt6sznsQ";
              }}
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary leading-tight tracking-tight">
                Velvet &amp; Brew
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                Artisanal Coffee &amp; Tea
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-space-xs">
            <button
              onClick={handleReturnHome}
              className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all bg-transparent border-0 cursor-pointer"
            >
              Trang chủ
            </button>
            <button
              onClick={handleReturnHome}
              className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all bg-transparent border-0 cursor-pointer"
            >
              Thực đơn
            </button>
            <button
              onClick={handleReturnHome}
              className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all bg-transparent border-0 cursor-pointer"
            >
              Cà phê
            </button>
            <button
              onClick={handleReturnHome}
              className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all bg-transparent border-0 cursor-pointer"
            >
              Trà sữa
            </button>
            <button
              onClick={handleReturnHome}
              className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all bg-transparent border-0 cursor-pointer"
            >
              Khuyến mãi
            </button>
            <button
              onClick={handleReturnHome}
              className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all bg-transparent border-0 cursor-pointer"
            >
              Giới thiệu
            </button>
            <button
              onClick={handleReturnHome}
              className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all bg-transparent border-0 cursor-pointer"
            >
              Liên hệ
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-space-xs md:gap-space-sm shrink-0">
            <button
              aria-label="Tìm kiếm"
              onClick={handleReturnHome}
              title="Tìm kiếm đồ uống (về cửa hàng)"
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors bg-transparent border-0 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>
            <button
              aria-label="Thông báo"
              title="Thông báo đơn hàng"
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors bg-transparent border-0 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error" />
            </button>
            <button
              aria-label="Giỏ hàng"
              onClick={onOpenCart || handleReturnHome}
              title="Xem giỏ hàng"
              className="relative flex items-center gap-space-2xs bg-surface-container-low hover:bg-surface-container-high px-space-sm py-space-xs rounded-full transition-all text-on-surface border-0 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px] text-primary-container">
                local_mall
              </span>
              <span className="font-label-sm text-label-sm bg-primary-container text-on-primary px-space-2xs py-[1px] rounded-full">
                {totalItemCount}
              </span>
            </button>

            {/* AVATAR VÀ DROPDOWN TÀI KHOẢN */}
            {!currentUser ? (
              <button
                type="button"
                onClick={onOpenAuth}
                title="Đăng nhập tài khoản"
                className="ml-1 px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-semibold text-xs border-0 cursor-pointer shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>Đăng nhập</span>
              </button>
            ) : (
              <div className="relative flex items-center pl-space-xs" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  title={`${currentUser.fullName || "Tài khoản"} (Bấm để xem menu tài khoản)`}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  className="w-9 h-9 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center shadow-[0_2px_8px_rgba(62,39,35,0.2)] border-2 border-primary/20 hover:border-primary-container hover:scale-105 active:scale-95 transition-all cursor-pointer p-0 overflow-hidden outline-none"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.fullName || "Avatar"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.parentElement) {
                          e.target.parentElement.innerText = initials;
                        }
                      }}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </button>

                {/* DROPDOWN MENU KHI BẤM VÀO AVATAR */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-12 bg-white rounded-2xl shadow-[0_12px_36px_rgba(43,23,19,0.2),0_0_0_1px_rgba(211,195,192,0.4)] p-3 min-w-[240px] z-50 text-left"
                    style={{
                      animation: "menuDropdownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    {/* Header thông tin người dùng */}
                    <div className="px-2 py-2 border-b border-[#f1ede6] mb-2">
                      <div className="font-bold text-[#271310] text-[13.5px] truncate">
                        {currentUser.fullName || "Khách hàng Velvet"}
                      </div>
                      <div className="text-[11.5px] text-[#756762] truncate mt-0.5">
                        {currentUser.phoneNumber || currentUser.email || "Hội viên Velvet Club"}
                      </div>
                      <div className="mt-2">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${isAdmin
                            ? "bg-[#ffdcc3] text-[#6e3900]"
                            : "bg-[#e6f4ea] text-[#137333]"
                            }`}
                        >
                          {isAdmin ? "Quản trị viên (Admin)" : "Hội viên Velvet Club"}
                        </span>
                      </div>
                    </div>

                    {/* Danh sách hành động */}
                    <div className="flex flex-col gap-1">
                      {/* Nút Trang Quản Trị - Nếu là Admin */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            if (onOpenAdmin) {
                              onOpenAdmin();
                            } else {
                              window.location.hash = "admin";
                            }
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-[12.5px] font-semibold text-[#271310] bg-[#f1ede6] hover:bg-[#e6e0d6] transition-colors flex items-center gap-2 border-0 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[17px] text-[#3e2723]">
                            dashboard
                          </span>
                          <span>Trang Quản Trị (Admin)</span>
                        </button>
                      )}

                      {/* Nút Thông tin khách hàng & Đơn mua */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          if (onOpenProfile) {
                            onOpenProfile();
                          } else {
                            window.location.hash = "profile";
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-[12.5px] font-semibold text-[#271310] bg-[#fdf9f2] hover:bg-[#f7efe3] border border-[#e6e2db] transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[17px] text-[#8a5100]">
                          badge
                        </span>
                        <span>Thông tin khách hàng</span>
                      </button>

                      {/* Nút Quay lại cửa hàng */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleReturnHome();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-[12.5px] font-medium text-[#49454e] hover:bg-[#f1ede6] transition-colors flex items-center gap-2 border-0 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[17px] text-[#756762]">
                          storefront
                        </span>
                        <span>Về trang chủ cửa hàng</span>
                      </button>

                      <div className="border-t border-[#f1ede6] my-1" />

                      {/* Nút Đăng xuất */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          if (logout) logout();
                          handleReturnHome();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-[12.5px] font-semibold text-[#93000a] bg-[#ffdad6] hover:bg-[#ffcdd2] transition-colors flex items-center gap-2 border-0 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          logout
                        </span>
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. NỘI DUNG CHÍNH (MAIN CHECKOUT) */}
      <main className="w-full pt-20 bg-surface min-h-screen">
        <div className="flex flex-col w-full">
          <div className="relative w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop pt-space-md pb-space-2xl">
            {/* Breadcrumb & Step Progress Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-lg">
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-space-2xs text-on-surface-variant font-label-md text-label-md"
              >
                <button
                  onClick={handleReturnHome}
                  className="hover:text-primary transition-colors flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0 font-label-md"
                >
                  <span className="material-symbols-outlined text-[16px]">home</span>
                  Trang chủ
                </button>
                <span className="text-outline-variant">/</span>
                <button
                  onClick={handleReturnHome}
                  className="hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0 font-label-md"
                >
                  Giỏ hàng ({totalItemCount})
                </button>
                <span className="text-outline-variant">/</span>
                <span className="text-primary font-semibold">Thanh toán đơn hàng</span>
              </nav>

              {/* Step Progress Tracker */}
              <div className="inline-flex items-center gap-space-xs bg-surface-container-low px-space-md py-space-xs rounded-full shadow-sm">
                <div className="flex items-center gap-space-2xs text-secondary font-label-sm text-label-sm">
                  <span className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                    ✓
                  </span>
                  <span className="hidden sm:inline">1. Giỏ hàng</span>
                </div>
                <span className="text-outline-variant text-[12px]">• • •</span>
                <div className="flex items-center gap-space-2xs text-primary font-label-sm text-label-sm font-bold">
                  <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                    2
                  </span>
                  <span>2. Địa chỉ &amp; Thanh toán</span>
                </div>
                <span className="text-outline-variant text-[12px]">• • •</span>
                <div
                  className={`flex items-center gap-space-2xs font-label-sm text-label-sm ${orderSuccess ? "text-secondary font-bold" : "text-outline"
                    }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-medium ${orderSuccess
                      ? "bg-secondary-container text-on-secondary-container"
                      : "bg-surface-container-high text-on-surface-variant"
                      }`}
                  >
                    {orderSuccess ? "✓" : "3"}
                  </span>
                  <span className="hidden sm:inline">3. Hoàn tất</span>
                </div>
              </div>
            </div>

            {/* Editorial Header Title */}
            <div className="mb-space-xl flex flex-col gap-space-2xs">
              <div className="flex items-center gap-space-xs">
                <span className="inline-flex items-center gap-1 px-space-xs py-[2px] rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[14px] text-tertiary-container">
                    local_shipping
                  </span>
                  Giao Hỏa Tốc Chuẩn Nhiệt Độ
                </span>
                <span className="inline-flex items-center gap-1 px-space-xs py-[2px] rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[14px] text-secondary">
                    verified_user
                  </span>
                  Bảo mật SSL 256-bit
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                Xác Nhận &amp; Thanh Toán Đơn Hàng
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                Thưởng thức trọn vẹn từng giọt hương vị với đóng gói túi giữ nhiệt đa lớp
                chuyên dụng, giao tận tay trong 20-30 phút.
              </p>
            </div>

            {/* Main Content 2-Column Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
              {/* LEFT COLUMN: Checkout Details (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-space-lg">
                {/* SECTION 1: Delivery Mode Selector */}
                <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary-container">
                        <span className="material-symbols-outlined text-[20px]">
                          two_wheeler
                        </span>
                      </span>
                      <h2 className="font-title-lg text-title-lg text-primary">
                        Phương Thức Nhận Hàng
                      </h2>
                    </div>
                    <span className="font-label-sm text-label-sm text-secondary bg-secondary-container/40 px-space-xs py-1 rounded-full font-semibold">
                      {deliveryMethod === "delivery"
                        ? "Ưu tiên hỏa tốc"
                        : "Sẵn sàng sau 15p"}
                    </span>
                  </div>

                  {/* Switchable Tabs */}
                  <div className="grid grid-cols-2 gap-space-xs bg-surface-container-low p-space-2xs rounded-full">
                    <button
                      className={`flex items-center justify-center gap-space-xs py-space-xs px-space-md rounded-full font-label-lg text-label-lg transition-all border-0 cursor-pointer ${deliveryMethod === "delivery"
                        ? "bg-primary-container text-on-primary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface bg-transparent"
                        }`}
                      onClick={() => setDeliveryMethod("delivery")}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">bolt</span>
                      <span>Giao tận nơi (20-30p)</span>
                    </button>
                    <button
                      className={`flex items-center justify-center gap-space-xs py-space-xs px-space-md rounded-full font-label-lg text-label-lg transition-all border-0 cursor-pointer ${deliveryMethod === "pickup"
                        ? "bg-primary-container text-on-primary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface bg-transparent"
                        }`}
                      onClick={() => setDeliveryMethod("pickup")}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        storefront
                      </span>
                      <span>Đến lấy tại quán</span>
                    </button>
                  </div>
                </section>

                {/* SECTION 2: Recipient Information & Address */}
                <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary-container">
                      <span className="material-symbols-outlined text-[20px]">
                        person_pin_circle
                      </span>
                    </span>
                    <div>
                      <h2 className="font-title-lg text-title-lg text-primary">
                        Thông Tin Người Nhận &amp; Điểm Giao
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Vui lòng kiểm tra kỹ số điện thoại để tài xế liên hệ giao hàng thuận
                        tiện.
                      </p>
                    </div>
                  </div>

                  <form
                    className="grid grid-cols-1 md:grid-cols-2 gap-space-md"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    {/* Full Name */}
                    <div className="flex flex-col gap-space-2xs">
                      <label
                        className="font-label-sm text-label-sm text-on-surface-variant"
                        htmlFor="customer-name"
                      >
                        Họ và tên người nhận *
                      </label>
                      <div className="relative flex items-center">
                        <input
                          className="w-full bg-surface-container-low focus:bg-surface-container-lowest text-on-surface px-space-md py-space-xs rounded-lg font-body-md text-body-md outline-none transition-all shadow-inner border border-transparent focus:border-outline-variant"
                          id="customer-name"
                          placeholder="Nhập tên người nhận"
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                        <span className="material-symbols-outlined absolute right-3 text-outline text-[18px] pointer-events-none">
                          badge
                        </span>
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="flex flex-col gap-space-2xs">
                      <label
                        className="font-label-sm text-label-sm text-on-surface-variant"
                        htmlFor="customer-phone"
                      >
                        Số điện thoại *
                      </label>
                      <div className="relative flex items-center">
                        <input
                          className="w-full bg-surface-container-low focus:bg-surface-container-lowest text-on-surface px-space-md py-space-xs rounded-lg font-body-md text-body-md outline-none transition-all shadow-inner border border-transparent focus:border-outline-variant"
                          id="customer-phone"
                          placeholder="090x xxx xxx"
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                        <span className="material-symbols-outlined absolute right-3 text-outline text-[18px] pointer-events-none">
                          phone_iphone
                        </span>
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="md:col-span-2 flex flex-col gap-space-2xs">
                      <label
                        className="font-label-sm text-label-sm text-on-surface-variant"
                        htmlFor="customer-email"
                      >
                        Email nhận hóa đơn điện tử &amp; mã theo dõi
                      </label>
                      <div className="relative flex items-center">
                        <input
                          className="w-full bg-surface-container-low focus:bg-surface-container-lowest text-on-surface px-space-md py-space-xs rounded-lg font-body-md text-body-md outline-none transition-all shadow-inner border border-transparent focus:border-outline-variant"
                          id="customer-email"
                          placeholder="email@domain.com"
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                        />
                        <span className="material-symbols-outlined absolute right-3 text-outline text-[18px] pointer-events-none">
                          mail
                        </span>
                      </div>
                    </div>

                    {deliveryMethod === "delivery" ? (
                      <>
                        {/* THÔNG BÁO NẾU CHƯA CÓ DỮ LIỆU ĐỊA CHỈ TRONG SỔ ĐỊA CHỈ */}
                        {(!currentUser?.addresses || currentUser.addresses.length === 0) ? (
                          <div className="md:col-span-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 animate-fadeIn">
                            <span className="material-symbols-outlined text-amber-600 text-[24px] shrink-0 mt-0.5">
                              location_off
                            </span>
                            <div className="flex-1 text-xs sm:text-sm">
                              <strong className="text-amber-950 block font-bold text-[13.5px]">
                                Bạn chưa có dữ liệu địa chỉ nhận hàng trong sổ địa chỉ!
                              </strong>
                              <span className="text-amber-800 block mt-1 leading-relaxed">
                                Vui lòng nhập địa chỉ giao hàng vào các ô bên dưới để đặt hàng, hoặc thêm địa chỉ vào sổ địa chỉ để sử dụng nhanh cho các lần sau.
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onOpenProfile) onOpenProfile();
                                  else window.location.hash = "profile";
                                }}
                                className="mt-2.5 text-[12px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                              >
                                <span className="material-symbols-outlined text-[15px]">add_location_alt</span>
                                <span>Thêm địa chỉ vào sổ địa chỉ</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* DANH SÁCH ĐỊA CHỈ ĐÃ LƯU TRONG TÀI KHOẢN */
                          <div className="md:col-span-2 flex flex-col gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-primary flex items-center gap-1">
                                <span className="material-symbols-outlined text-[17px] text-secondary">
                                  bookmark
                                </span>
                                <span>Địa chỉ đã lưu của bạn ({currentUser.addresses.length})</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onOpenProfile) onOpenProfile();
                                  else window.location.hash = "profile";
                                }}
                                className="text-[11.5px] text-secondary hover:underline cursor-pointer bg-transparent border-0 p-0 font-medium"
                              >
                                + Quản lý sổ địa chỉ
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {currentUser.addresses.map((addr) => {
                                const isSelected = streetAddress === addr.street;
                                return (
                                  <div
                                    key={addr.id}
                                    onClick={() => {
                                      setStreetAddress(addr.street || "");
                                      if (addr.recipientName) setCustomerName(addr.recipientName);
                                      if (addr.phoneNumber) setCustomerPhone(addr.phoneNumber);
                                      if (addr.district) setDistrict(addr.district);
                                      if (addr.city) setCity(addr.city);
                                      if (addr.note) setDeliveryNotes(addr.note);
                                    }}
                                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${isSelected
                                      ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30"
                                      : "bg-surface-container-lowest border-outline-variant/40 hover:border-primary/50"
                                      }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-xs font-bold text-primary truncate">
                                        {addr.recipientName || "Người nhận"}
                                      </span>
                                      {addr.isDefault && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container uppercase">
                                          Mặc định
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11.5px] text-on-surface-variant truncate mt-0.5">
                                      {addr.phoneNumber}
                                    </div>
                                    <div className="text-[12px] text-on-surface mt-1 line-clamp-2">
                                      {addr.street}, {addr.ward ? addr.ward + ", " : ""}{addr.district}, {addr.city}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* City / District Cascades */}
                        <div className="flex flex-col gap-space-2xs">
                          <label
                            className="font-label-sm text-label-sm text-on-surface-variant"
                            htmlFor="city-select"
                          >
                            Tỉnh / Thành phố *
                          </label>
                          <select
                            className="w-full bg-surface-container-low text-on-surface px-space-md py-space-xs rounded-lg font-body-md text-body-md outline-none cursor-pointer border border-transparent focus:border-outline-variant"
                            id="city-select"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                          >
                            <option value="HN">Hà Nội</option>
                            <option value="HCM">TP. Hồ Chí Minh</option>
                            <option value="DN">Đà Nẵng</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-space-2xs">
                          <label
                            className="font-label-sm text-label-sm text-on-surface-variant"
                            htmlFor="district-select"
                          >
                            Quận / Huyện *
                          </label>
                          <select
                            className="w-full bg-surface-container-low text-on-surface px-space-md py-space-xs rounded-lg font-body-md text-body-md outline-none cursor-pointer border border-transparent focus:border-outline-variant"
                            id="district-select"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                          >
                            <option value="HK">Quận Hoàn Kiếm</option>
                            <option value="BD">Quận Ba Đình</option>
                            <option value="TX">Quận Thanh Xuân</option>
                            <option value="CG">Quận Cầu Giấy</option>
                            <option value="DDA">Quận Đống Đa</option>
                            <option value="HBT">Quận Hai Bà Trưng</option>
                          </select>
                        </div>

                        {/* Address Detail */}
                        <div className="md:col-span-2 flex flex-col gap-space-2xs">
                          <label
                            className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-between"
                            htmlFor="street-address"
                          >
                            <span>Số nhà, Tòa nhà &amp; Tên đường *</span>
                            {(!streetAddress || !streetAddress.trim()) && (
                              <span className="text-red-500 text-[11px] font-bold flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[13px]">error</span>
                                Chưa có địa chỉ nhận hàng
                              </span>
                            )}
                          </label>
                          <input
                            className={`w-full bg-surface-container-low focus:bg-surface-container-lowest text-on-surface px-space-md py-space-xs rounded-lg font-body-md text-body-md outline-none transition-all shadow-inner border ${!streetAddress || !streetAddress.trim()
                              ? "border-amber-400 focus:border-red-400"
                              : "border-transparent focus:border-outline-variant"
                              }`}
                            id="street-address"
                            placeholder="Vd: 124 Phố Hàng Trống, Tòa nhà Heritage..."
                            type="text"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                          />
                        </div>

                        {/* Delivery Note */}
                        <div className="md:col-span-2 flex flex-col gap-space-2xs">
                          <label
                            className="font-label-sm text-label-sm text-on-surface-variant"
                            htmlFor="delivery-notes"
                          >
                            Ghi chú cho tài xế giao hàng
                          </label>
                          <textarea
                            className="w-full bg-surface-container-low focus:bg-surface-container-lowest text-on-surface px-space-md py-space-xs rounded-lg font-body-md text-body-md outline-none transition-all resize-none shadow-inner border border-transparent focus:border-outline-variant"
                            id="delivery-notes"
                            placeholder="Vd: Giao lên lầu 3, xin đừng bấm chuông em bé đang ngủ, gọi trước 5 phút..."
                            rows="2"
                            value={deliveryNotes}
                            onChange={(e) => setDeliveryNotes(e.target.value)}
                          />
                        </div>
                      </>
                    ) : (
                      /* Thông tin điểm lấy tại quán */
                      <div className="md:col-span-2 p-space-md bg-surface-container-low rounded-lg flex items-start gap-space-sm">
                        <span className="material-symbols-outlined text-primary-container text-[24px]">
                          store
                        </span>
                        <div>
                          <strong className="text-primary font-title-md block">
                            Chi nhánh nhận đồ: Velvet &amp; Brew Hoàn Kiếm
                          </strong>
                          <p className="text-on-surface-variant font-body-sm mt-1">
                            124 Phố Cổ, Quận Hoàn Kiếm, Hà Nội (Mở cửa: 07:00 - 22:30). Đơn
                            hàng sẽ được chuẩn bị sẵn sau 15 phút.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Delivery Timing Preference */}
                    <div className="md:col-span-2 flex flex-col gap-space-xs pt-space-xs">
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                        Thời gian mong muốn nhận:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                        <label
                          className={`flex items-center gap-space-xs p-space-sm rounded-lg cursor-pointer transition-colors ${deliveryTiming === "now"
                            ? "bg-surface-container shadow-xs"
                            : "bg-surface-container-low hover:bg-surface-container"
                            }`}
                        >
                          <input
                            checked={deliveryTiming === "now"}
                            onChange={() => setDeliveryTiming("now")}
                            className="accent-primary w-4 h-4"
                            name="delivery_time"
                            type="radio"
                          />
                          <div className="flex flex-col">
                            <span className="font-title-md text-title-md text-primary leading-tight">
                              Giao ngay (20 - 30 phút)
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Tài xế ưu tiên nhận đơn lập tức
                            </span>
                          </div>
                        </label>
                        <label
                          className={`flex items-center gap-space-xs p-space-sm rounded-lg cursor-pointer transition-colors ${deliveryTiming === "scheduled"
                            ? "bg-surface-container shadow-xs"
                            : "bg-surface-container-low hover:bg-surface-container"
                            }`}
                        >
                          <input
                            checked={deliveryTiming === "scheduled"}
                            onChange={() => setDeliveryTiming("scheduled")}
                            className="accent-primary w-4 h-4"
                            name="delivery_time"
                            type="radio"
                          />
                          <div className="flex flex-col">
                            <span className="font-title-md text-title-md text-on-surface leading-tight">
                              Hẹn giờ nhận hôm nay
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Chọn khung giờ vàng thưởng trà
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </form>
                </section>

                {/* SECTION 3: Eco Preferences & VAT */}
                <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-8 h-8 rounded-full bg-secondary-container/50 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">eco</span>
                    </span>
                    <div>
                      <h2 className="font-title-lg text-title-lg text-primary">
                        Sống Xanh &amp; Hóa Đơn Doanh Nghiệp
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Chung tay bảo vệ hệ sinh thái cùng Velvet &amp; Brew
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-sm">
                    {/* Eco Bag Option */}
                    <label className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors">
                      <input
                        checked={ecoFriendly}
                        onChange={(e) => setEcoFriendly(e.target.checked)}
                        className="accent-secondary w-5 h-5 rounded mt-0.5"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-primary">
                          Dùng phụ kiện sinh học bã mía &amp; quai xách giấy
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Cung cấp ống hút bã mía tự hủy sinh học, quai vải sợi đay tái
                          chế bảo vệ thiên nhiên.
                        </span>
                      </div>
                    </label>

                    {/* VAT Option */}
                    <label className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors">
                      <input
                        checked={vatRequired}
                        onChange={(e) => setVatRequired(e.target.checked)}
                        className="accent-primary w-5 h-5 rounded mt-0.5"
                        id="vat-toggle"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-on-surface">
                          Yêu cầu xuất hóa đơn điện tử VAT (e-Invoice)
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Hóa đơn điện tử hợp lệ gửi trực tiếp qua email đăng ký trong
                          24h.
                        </span>
                      </div>
                    </label>

                    {/* VAT Subform (hiển thị khi vatRequired = true) */}
                    {vatRequired && (
                      <div
                        className="flex flex-col gap-space-xs p-space-md bg-surface-container-low rounded-lg mt-space-2xs animate-fadeIn"
                        id="vat-fields"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xs">
                          <input
                            className="bg-surface-container-lowest px-space-md py-space-xs rounded-lg font-body-sm text-body-sm outline-none text-on-surface border border-outline-variant/50"
                            placeholder="Tên công ty / Doanh nghiệp"
                            type="text"
                            value={vatCompany}
                            onChange={(e) => setVatCompany(e.target.value)}
                          />
                          <input
                            className="bg-surface-container-lowest px-space-md py-space-xs rounded-lg font-body-sm text-body-sm outline-none text-on-surface border border-outline-variant/50"
                            placeholder="Mã số thuế (MST)"
                            type="text"
                            value={vatTaxCode}
                            onChange={(e) => setVatTaxCode(e.target.value)}
                          />
                        </div>
                        <input
                          className="bg-surface-container-lowest px-space-md py-space-xs rounded-lg font-body-sm text-body-sm outline-none text-on-surface border border-outline-variant/50"
                          placeholder="Địa chỉ đăng ký kinh doanh chính thức"
                          type="text"
                          value={vatAddress}
                          onChange={(e) => setVatAddress(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </section>

                {/* SECTION 4: Payment Methods */}
                <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary-container">
                        <span className="material-symbols-outlined text-[20px]">
                          account_balance_wallet
                        </span>
                      </span>
                      <div>
                        <h2 className="font-title-lg text-title-lg text-primary">
                          Phương Thức Thanh Toán
                        </h2>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Mọi giao dịch được bảo mật và mã hóa đa tầng
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        lock
                      </span>
                      <span>256-Bit SSL</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-xs">
                    {/* Payment 1: VietQR Bank Transfer (Recommended) */}
                    <label
                      onClick={() => setPaymentMethod("vietqr")}
                      className={`group relative flex flex-col p-space-md rounded-xl cursor-pointer transition-all ${paymentMethod === "vietqr"
                        ? "bg-surface-container ring-1 ring-primary/20 shadow-xs"
                        : "bg-surface-container-low hover:bg-surface-container"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-space-sm">
                          <input
                            checked={paymentMethod === "vietqr"}
                            onChange={() => setPaymentMethod("vietqr")}
                            className="accent-primary w-4 h-4"
                            name="payment_method"
                            type="radio"
                          />
                          <div className="flex items-center gap-space-xs">
                            <span className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-tertiary-container shadow-xs">
                              <span className="material-symbols-outlined text-[20px]">
                                qr_code_2
                              </span>
                            </span>
                            <div>
                              <span className="font-title-md text-title-md text-primary block leading-tight">
                                Quét mã VietQR / Chuyển khoản tức thì
                              </span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                Mở ứng dụng ngân hàng quét mã, không cần nhập số tài khoản
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-secondary-fixed-variant bg-secondary-container px-space-xs py-1 rounded-full font-bold uppercase tracking-wider">
                          Khuyên dùng • Tự động
                        </span>
                      </div>
                      {/* QR Detail Preview Hint */}
                      <div className="mt-space-sm pl-7 pt-space-2xs flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          bolt
                        </span>
                        <span>
                          Hệ thống tạo mã QR động đúng {money(grandTotal)} ngay sau khi
                          nhấn Đặt Hàng.
                        </span>
                      </div>
                    </label>

                    {/* Payment 2: Credit Card (Visa/Master/JCB) */}
                    <label
                      onClick={() => setPaymentMethod("card")}
                      className={`group relative flex flex-col p-space-md rounded-xl cursor-pointer transition-all ${paymentMethod === "card"
                        ? "bg-surface-container ring-1 ring-primary/20 shadow-xs"
                        : "bg-surface-container-low hover:bg-surface-container"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-space-sm">
                          <input
                            checked={paymentMethod === "card"}
                            onChange={() => setPaymentMethod("card")}
                            className="accent-primary w-4 h-4"
                            name="payment_method"
                            type="radio"
                          />
                          <div className="flex items-center gap-space-xs">
                            <span className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary-container shadow-xs">
                              <span className="material-symbols-outlined text-[20px]">
                                credit_card
                              </span>
                            </span>
                            <div>
                              <span className="font-title-md text-title-md text-on-surface block leading-tight">
                                Thẻ Quốc Tế Visa / MasterCard / JCB
                              </span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                Thanh toán bảo mật chuẩn 3D Secure
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-80">
                          <span className="font-label-sm text-label-sm font-bold bg-surface-container-highest px-2 py-0.5 rounded text-primary">
                            VISA
                          </span>
                          <span className="font-label-sm text-label-sm font-bold bg-surface-container-highest px-2 py-0.5 rounded text-primary">
                            MC
                          </span>
                        </div>
                      </div>
                    </label>

                    {/* Payment 3: E-wallets (MoMo/ZaloPay) */}
                    <label
                      onClick={() => setPaymentMethod("wallet")}
                      className={`group relative flex flex-col p-space-md rounded-xl cursor-pointer transition-all ${paymentMethod === "wallet"
                        ? "bg-surface-container ring-1 ring-primary/20 shadow-xs"
                        : "bg-surface-container-low hover:bg-surface-container"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-space-sm">
                          <input
                            checked={paymentMethod === "wallet"}
                            onChange={() => setPaymentMethod("wallet")}
                            className="accent-primary w-4 h-4"
                            name="payment_method"
                            type="radio"
                          />
                          <div className="flex items-center gap-space-xs">
                            <span className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-tertiary-container shadow-xs">
                              <span className="material-symbols-outlined text-[20px]">
                                account_balance
                              </span>
                            </span>
                            <div>
                              <span className="font-title-md text-title-md text-on-surface block leading-tight">
                                Ví điện tử MoMo / ZaloPay / ShopeePay
                              </span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                Liên kết trực tiếp một chạm qua App
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-tertiary-container bg-tertiary-fixed px-space-xs py-1 rounded-full font-semibold">
                          Hoàn 10.000đ xu
                        </span>
                      </div>
                    </label>

                    {/* Payment 4: COD Cash On Delivery */}
                    <label
                      onClick={() => setPaymentMethod("cod")}
                      className={`group relative flex flex-col p-space-md rounded-xl cursor-pointer transition-all ${paymentMethod === "cod"
                        ? "bg-surface-container ring-1 ring-primary/20 shadow-xs"
                        : "bg-surface-container-low hover:bg-surface-container"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-space-sm">
                          <input
                            checked={paymentMethod === "cod"}
                            onChange={() => setPaymentMethod("cod")}
                            className="accent-primary w-4 h-4"
                            name="payment_method"
                            type="radio"
                          />
                          <div className="flex items-center gap-space-xs">
                            <span className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant shadow-xs">
                              <span className="material-symbols-outlined text-[20px]">
                                payments
                              </span>
                            </span>
                            <div>
                              <span className="font-title-md text-title-md text-on-surface block leading-tight">
                                Thanh toán tiền mặt khi nhận hàng (COD)
                              </span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                Trả tiền trực tiếp cho tài xế sau khi kiểm tra đủ ly và
                                nguyên vẹn
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </section>
              </div>

              {/* RIGHT COLUMN: Sticky Order Summary (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-space-md lg:sticky lg:top-24">
                {/* Main Summary Card */}
                <div className="bg-surface-container-lowest rounded-xl shadow-lg p-space-lg flex flex-col gap-space-md relative overflow-hidden">
                  {/* Subtle Top Ambient Header Fill */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-container via-tertiary-container to-secondary" />

                  <div className="flex items-center justify-between pt-1">
                    <h2 className="font-headline-sm text-headline-sm text-primary">
                      Tóm Tắt Đơn Hàng
                    </h2>
                    <span className="font-label-sm text-label-sm text-on-primary bg-primary-container px-space-xs py-1 rounded-full">
                      {totalItemCount} Món
                    </span>
                  </div>

                  {/* Product Item List */}
                  <div className="flex flex-col gap-space-sm divide-y-0 max-h-[380px] overflow-y-auto pr-1">
                    {displayItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-space-sm bg-surface-container-low/70 p-space-sm rounded-xl"
                      >
                        <div className="w-16 h-16 rounded-lg bg-surface-container shrink-0 overflow-hidden relative shadow-xs">
                          <img
                            className="w-full h-full object-cover"
                            alt={item.name}
                            src={item.image}
                            onError={(e) => {
                              e.target.src =
                                "https://lh3.googleusercontent.com/aida-public/AB6AXuAM8V9vfFRo9QXR8W7xxUSYhDRBAPwn1dofJdoNCUlmTmdZZTUGlJppUbKtAOFrSH16ztd1yHvMoWqbEDrjh7mCw4ic8EaS-3GluOXBplAXADUZNvETobdhUpZ-xX2I7dDz5YTvSkf9QkL-NXWDNjXkuIBU43T3S7pprAcN36sEfm9nF9S8RtW6MWSTWiDH3yCvJx0-UIkcBRx_DR2QhtGzlRXYwStZYgG3OBac6lVSSObIHHJ-btF2eA";
                            }}
                          />
                          <span className="absolute bottom-1 right-1 bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            x{item.quantity}
                          </span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-space-xs">
                            <h3 className="font-title-md text-title-md text-primary truncate">
                              {item.name}
                            </h3>
                            <span className="font-title-md text-title-md text-primary font-bold shrink-0">
                              {item.price}
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                            {item.size} • {item.note}
                          </p>
                          {item.topping && (
                            <div className="flex items-center gap-1 mt-1 text-on-secondary-fixed-variant font-label-sm text-label-sm bg-secondary-container/40 px-space-xs py-0.5 rounded w-fit">
                              <span className="material-symbols-outlined text-[12px]">
                                add_circle
                              </span>
                              <span>{item.topping}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Input & Applied Badges */}
                  <div className="flex flex-col gap-space-xs pt-space-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                      Mã Ưu Đãi &amp; Giảm Giá
                    </span>
                    <div className="flex items-center bg-surface-container-low rounded-full p-1 shadow-inner">
                      <span className="material-symbols-outlined text-outline pl-space-xs text-[18px]">
                        sell
                      </span>
                      <input
                        className="bg-transparent px-space-xs py-space-2xs text-on-surface font-label-md text-label-md outline-none w-full uppercase"
                        placeholder="Nhập mã ưu đãi..."
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                      />
                      <button
                        className="bg-primary-container text-on-primary hover:bg-tertiary-container px-space-md py-space-2xs rounded-full font-label-sm text-label-sm transition-colors shrink-0 font-semibold border-0 cursor-pointer"
                        type="button"
                        onClick={handleApplyCoupon}
                      >
                        Áp Dụng
                      </button>
                    </div>

                    {couponMessage && (
                      <p className="text-[11.5px] text-tertiary-container px-2 m-0">
                        {couponMessage}
                      </p>
                    )}

                    {/* Active Coupon Tags */}
                    <div className="flex flex-wrap gap-space-2xs pt-1">
                      {appliedCoupons.map((coupon) => (
                        <span
                          key={coupon.code}
                          className={`inline-flex items-center gap-1 font-label-sm text-label-sm px-space-xs py-1 rounded-full font-semibold ${coupon.code === "FREESHIP"
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-primary-fixed text-on-primary-fixed"
                            }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {coupon.code === "FREESHIP"
                              ? "local_shipping"
                              : "confirmation_number"}
                          </span>
                          {coupon.label}
                          <button
                            className="hover:opacity-70 text-[12px] font-bold bg-transparent border-0 cursor-pointer p-0 ml-1 text-inherit"
                            type="button"
                            onClick={() => handleRemoveCoupon(coupon.code)}
                            title="Xóa mã"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price Ledger Breakdown */}
                  <div className="flex flex-col gap-space-xs pt-space-sm bg-surface-container-low p-space-md rounded-xl">
                    <div className="flex items-center justify-between text-on-surface-variant font-body-md text-body-md">
                      <span>Tạm tính đồ uống:</span>
                      <span className="font-semibold text-on-surface">
                        {money(subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-on-surface-variant font-body-md text-body-md">
                      <span className="flex items-center gap-1">
                        Phí giao hàng (
                        {deliveryMethod === "delivery" ? "Hỏa tốc 3.2km" : "Tại quán"}):
                        <span
                          className="material-symbols-outlined text-[14px] text-outline cursor-help"
                          title="Giao bằng túi giữ nhiệt cao cấp chuyên dụng"
                        >
                          info
                        </span>
                      </span>
                      {deliveryMethod === "pickup" ? (
                        <span className="text-secondary font-semibold">Miễn phí</span>
                      ) : (
                        <span
                          className={
                            hasFreeship ? "line-through text-outline" : "text-on-surface"
                          }
                        >
                          {money(baseShippingFee)}
                        </span>
                      )}
                    </div>

                    {shippingDiscount > 0 && (
                      <div className="flex items-center justify-between text-secondary font-body-md text-body-md">
                        <span>Hỗ trợ phí vận chuyển (FREESHIP):</span>
                        <span>-{money(shippingDiscount)}</span>
                      </div>
                    )}

                    {voucherDiscount > 0 && (
                      <div className="flex items-center justify-between text-error font-body-md text-body-md">
                        <span>Ưu đãi mã khuyến mãi:</span>
                        <span>-{money(voucherDiscount)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                      <span className="flex items-center gap-1 text-tertiary-container">
                        <span className="material-symbols-outlined text-[14px]">stars</span>
                        Tích lũy điểm hội viên BrewClub:
                      </span>
                      <span className="font-bold text-tertiary-container">
                        +{brewPoints} Hạt Brew
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                      <span>Đóng gói giữ nhiệt cao cấp 3 lớp:</span>
                      <span className="text-secondary font-semibold">Miễn phí</span>
                    </div>

                    {/* Grand Total Highlight */}
                    <div className="pt-space-sm mt-space-2xs flex items-baseline justify-between border-t border-outline-variant/30">
                      <div className="flex flex-col">
                        <span className="font-title-lg text-title-lg text-primary font-bold">
                          Tổng Thanh Toán:
                        </span>
                        <span className="font-label-sm text-label-sm text-outline">
                          Đã bao gồm VAT 8%
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-headline-md text-headline-md text-primary font-bold tracking-tight">
                          {money(grandTotal)}
                        </span>
                        {totalSavings > 0 && (
                          <span className="font-label-sm text-label-sm text-secondary font-semibold">
                            Tiết kiệm {money(totalSavings)} hôm nay
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Checkout Primary Action Button */}
                  <button
                    className="w-full py-space-md px-space-lg rounded-full bg-primary text-on-primary hover:bg-tertiary-container transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-space-xs font-title-lg text-title-lg font-bold group border-0 cursor-pointer disabled:opacity-70"
                    type="button"
                    disabled={orderProcessing}
                    onClick={handlePlaceOrder}
                  >
                    {orderProcessing ? (
                      <span>Đang xử lý đơn...</span>
                    ) : (
                      <>
                        <span>Đặt Hàng &amp; Thanh Toán ({money(grandTotal)})</span>
                        <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>

                  {/* Delivery Guarantee & Temperature Assurance */}
                  <div className="flex flex-col gap-space-xs bg-surface-container-high/60 p-space-sm rounded-lg text-on-surface-variant font-body-sm text-body-sm">
                    <div className="flex items-center gap-space-xs text-primary font-semibold">
                      <span className="material-symbols-outlined text-[18px] text-tertiary-container">
                        workspace_premium
                      </span>
                      <span>Cam Kết Chất Lượng Velvet &amp; Brew</span>
                    </div>
                    <p className="leading-relaxed m-0">
                      Cam kết hoàn tiền 100% hoặc giao lại miễn phí nếu nước bị tràn đổ,
                      tan đá quá 50% hoặc thời gian nhận trễ hơn 45 phút kể từ lúc tài xế
                      lấy món.
                    </p>
                  </div>
                </div>

                {/* Quick Help Micro Card */}
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-[22px]">
                      support_agent
                    </span>
                    <div className="flex flex-col">
                      <span className="font-title-md text-title-md text-primary leading-tight">
                        Cần hỗ trợ đơn gấp?
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Hotline ưu tiên: 1900 8822 (Phím 1)
                      </span>
                    </div>
                  </div>
                  <a
                    href="tel:19008822"
                    className="px-space-md py-space-2xs rounded-full bg-surface-container-low hover:bg-surface-container font-label-sm text-label-sm text-primary font-semibold transition-colors no-underline"
                  >
                    Gọi Ngay
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. MODAL VIETQR TỰ ĐỘNG CHUYỂN KHOẢN */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg shadow-2xl relative border border-outline-variant/30 flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">
                  qr_code_scanner
                </span>
                <h3 className="font-title-lg text-primary m-0">Mã Thanh Toán VietQR</h3>
              </div>
              <button
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center border-0 cursor-pointer text-on-surface-variant"
                onClick={handleCancelQRPayment}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center gap-space-sm text-center">
              <span className="text-body-sm text-on-surface-variant">
                Quét mã QR bằng ứng dụng ngân hàng bất kỳ để thanh toán tự động:
              </span>

              {/* QR Image Box */}
              <div className="p-3 bg-white rounded-xl shadow-inner border border-surface-container-high flex flex-col items-center">
                <img
                  src={
                    payosQrCode
                      ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
                        payosQrCode
                      )}&size=260x260`
                      : `https://img.vietqr.io/image/970422-0366448294-compact2.png?amount=${grandTotal}&addInfo=${encodeURIComponent(
                        createdOrderCode
                      )}&accountName=VELVET%20BREW`
                  }
                  alt="VietQR Code"
                  className="w-56 h-56 object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <span className="font-label-sm text-secondary font-bold mt-2">
                  Đúng số tiền: {money(grandTotal)}
                </span>
              </div>

              {/* Realtime Listening Status Badge */}
              <div className="flex items-center justify-center gap-2 py-2 px-3 bg-[#e6f4ea] border border-[#ceead6] rounded-full text-[#137333] text-[12px] font-semibold w-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34a853] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1e8e3e]"></span>
                </span>
                <span>Hệ thống tự động hoàn tất ngay khi nhận được tiền...</span>
              </div>

              {/* Thông tin tài khoản */}
              <div className="w-full bg-surface-container-low p-space-sm rounded-xl text-left flex flex-col gap-1 text-body-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Ngân hàng:</span>
                  <strong className="text-primary">MB Bank (Quân Đội)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Số tài khoản:</span>
                  <strong className="text-primary tracking-wide">0366 448 294</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Chủ tài khoản:</span>
                  <strong className="text-primary">VELVET &amp; BREW CO., LTD</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Nội dung CK:</span>
                  <strong className="text-primary text-secondary font-bold">
                    {createdOrderCode}
                  </strong>
                </div>
              </div>

              {/* Link mở PayOS nếu có */}
              {payosCheckoutUrl && (
                <a
                  href={payosCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0052cc] hover:bg-[#0747a6] text-white font-label-md font-bold text-center flex items-center justify-center gap-2 no-underline transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  <span>Mở Cổng Thanh Toán PayOS</span>
                </a>
              )}

              {/* Countdown time */}
              <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm">
                <span className="material-symbols-outlined text-[16px] text-tertiary-container animate-spin">
                  timelapse
                </span>
                <span>
                  Mã hết hạn sau:{" "}
                  <b className="text-tertiary-container">{formatTimer(qrCountdown)}</b>
                </span>
              </div>
            </div>

            <div className="flex gap-space-xs mt-space-xs">
              <button
                type="button"
                onClick={handleCancelQRPayment}
                className="flex-1 py-space-xs rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md font-semibold border-0 cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleCompleteVietQRPayment}
                className="flex-1 py-space-xs rounded-full bg-primary text-on-primary hover:bg-tertiary-container font-label-md font-bold border-0 cursor-pointer transition-colors shadow-sm"
              >
                Đã Chuyển Khoản Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL / THÔNG BÁO ĐẶT HÀNG THÀNH CÔNG */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-xl shadow-2xl relative border border-outline-variant/30 flex flex-col items-center text-center gap-space-md">
            <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-md animate-bounce">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-secondary font-bold tracking-wider uppercase">
                Đặt Hàng Thành Công
              </span>
              <h2 className="font-headline-md text-primary m-0">
                Cảm ơn bạn đã lựa chọn Velvet &amp; Brew!
              </h2>
              <p className="font-body-sm text-on-surface-variant mt-1">
                Mã đơn hàng: <strong className="text-primary">{createdOrderCode}</strong>.
                Barista đang chuẩn bị đồ uống cho bạn ngay lập tức.
              </p>
            </div>

            <div className="w-full bg-surface-container-low p-space-md rounded-xl text-left flex flex-col gap-1 text-body-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Thời gian dự kiến nhận:</span>
                <strong className="text-secondary">20 - 30 phút nữa</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Phương thức nhận:</span>
                <span className="text-on-surface font-semibold">
                  {deliveryMethod === "delivery" ? "Giao tận nơi" : "Lấy tại quán"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Hình thức thanh toán:</span>
                <span className="text-on-surface font-semibold">
                  {paymentMethod === "vietqr"
                    ? "VietQR Đã xác nhận"
                    : paymentMethod === "cod"
                      ? "Tiền mặt khi nhận (COD)"
                      : paymentMethod === "card"
                        ? "Thẻ Quốc Tế"
                        : "Ví điện tử"}
                </span>
              </div>
              <div className="flex justify-between border-t border-surface-container pt-1 mt-1">
                <span className="text-on-surface-variant font-bold">Tổng thanh toán:</span>
                <strong className="text-primary text-title-md font-bold">
                  {money(grandTotal)}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReturnHome}
              className="w-full py-space-sm rounded-full bg-primary text-on-primary hover:bg-tertiary-container font-title-md font-bold border-0 cursor-pointer transition-colors shadow-md flex items-center justify-center gap-2 mt-space-xs"
            >
              <span>Tiếp tục khám phá thực đơn</span>
              <span className="material-symbols-outlined text-[18px]">storefront</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. FOOTER TRANG WEB */}
      <footer className="w-full bg-surface-container-low text-on-surface shadow-[0_-1px_12px_rgba(62,39,35,0.03)] mt-space-3xl">
        <div className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-gutter-desktop">
            <div className="lg:col-span-2 flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <img
                  alt="Velvet &amp; Brew Brand Logo"
                  className="h-8 w-auto object-contain"
                  src={logoIcon}
                  onError={(e) => {
                    e.target.src =
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuBRMxOCJJIwhg2mAHon8lvGMa1yym3orqDiRdlg40dBTFx0TvEYfZ71neLTQ8uprX8147qfyIYLJzVxXFz0-7ICt2RDwvn4jZ2tle3rHiJDQ2CKmX2n687yOluhuMxETFM7MOXoF--pdXecPCdu558V282Cl4oqc_UILl-QtvYPqxNgKmGVit_2jgH1wviVhHrNLduF8f-hBJVF13RvckcnmMoRE6pnVYhqI2aR7tzp6m2ScQKt6sznsQ";
                  }}
                />
                <span className="font-headline-sm text-headline-sm text-primary leading-tight tracking-tight">
                  Velvet &amp; Brew
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                Nơi nghệ thuật pha chế thủ công hòa quyện cùng xúc cảm đương đại. Từng giọt
                cà phê chắt lọc và lá trà tuyển chọn mang lại trải nghiệm thư thái tuyệt
                mỹ.
              </p>
              <div className="flex flex-col gap-space-2xs">
                <div className="flex items-center gap-space-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-tertiary-container">
                    schedule
                  </span>
                  <span className="font-body-sm text-body-sm">
                    Thứ Hai - Chủ Nhật: 07:00 - 22:30
                  </span>
                </div>
                <div className="flex items-center gap-space-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-tertiary-container">
                    location_on
                  </span>
                  <span className="font-body-sm text-body-sm">
                    124 Phố Cổ, Quận Hoàn Kiếm, Hà Nội
                  </span>
                </div>
                <div className="flex items-center gap-space-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-tertiary-container">
                    call
                  </span>
                  <span className="font-body-sm text-body-sm">+84 (0) 24 3828 9999</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-space-sm">
              <span className="font-title-md text-title-md text-primary">Khám Phá</span>
              <div className="flex flex-col gap-space-xs">
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors no-underline"
                  href="#ca-phe"
                >
                  Cà phê Specialty
                </a>
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors no-underline"
                  href="#tra-sua"
                >
                  Trà Shan Tuyết &amp; Oolong
                </a>
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors no-underline"
                  href="#banh-ngot"
                >
                  Bánh ngọt thủ công
                </a>
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors no-underline"
                  href="#qua-tang"
                >
                  Bộ quà tặng mùa lễ hội
                </a>
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors no-underline"
                  href="#brewclub"
                >
                  Đăng ký hội viên BrewClub
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-space-sm">
              <span className="font-title-md text-title-md text-primary">Hỗ Trợ</span>
              <div className="flex flex-col gap-space-xs">
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors no-underline"
                  href="#giao-hang"
                >
                  Chính sách giao hàng
                </a>
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors no-underline"
                  href="#huong-dan"
                >
                  Hướng dẫn đặt đồ uống
                </a>
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors no-underline"
                  href="#bao-mat"
                >
                  Bảo mật thông tin
                </a>
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors no-underline"
                  href="#nhuong-quyen"
                >
                  Hợp tác nhượng quyền
                </a>
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors no-underline"
                  href="#lien-he"
                >
                  Liên hệ phản hồi
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-space-sm">
              <span className="font-title-md text-title-md text-primary">
                Bản Tin Hương Vị
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Đăng ký nhận ưu đãi độc quyền và cảm hứng thưởng thức cà phê mỗi tuần.
              </p>
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center bg-surface-container-lowest rounded-full p-space-2xs shadow-[0_2px_8px_rgba(62,39,35,0.04)]">
                  <input
                    className="bg-transparent px-space-sm py-space-xs text-on-surface placeholder:text-outline font-body-sm text-body-sm outline-none w-full"
                    placeholder="Email của bạn..."
                    type="email"
                  />
                  <button
                    className="bg-primary-container text-on-primary hover:bg-tertiary-container rounded-full px-space-md py-space-xs font-label-sm text-label-sm transition-colors shrink-0 border-0 cursor-pointer"
                    type="button"
                  >
                    Gửi
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-space-xs pt-space-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px] hover:text-primary cursor-pointer transition-colors">
                  local_cafe
                </span>
                <span className="material-symbols-outlined text-[20px] hover:text-primary cursor-pointer transition-colors">
                  photo_camera
                </span>
                <span className="material-symbols-outlined text-[20px] hover:text-primary cursor-pointer transition-colors">
                  share
                </span>
                <span className="material-symbols-outlined text-[20px] hover:text-primary cursor-pointer transition-colors">
                  forum
                </span>
              </div>
            </div>
          </div>

          <div className="mt-space-2xl pt-space-md flex flex-col md:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm border-t border-surface-container">
            <p className="m-0">
              © 2024 Velvet &amp; Brew Artisanal Coffee &amp; Tea. Tất cả quyền được bảo
              lưu.
            </p>
            <div className="flex items-center gap-space-md">
              <a
                className="hover:text-primary transition-colors no-underline text-on-surface-variant"
                href="#dieu-khoan"
              >
                Điều khoản dịch vụ
              </a>
              <a
                className="hover:text-primary transition-colors no-underline text-on-surface-variant"
                href="#quyen-rieng-tu"
              >
                Chính sách quyền riêng tư
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
