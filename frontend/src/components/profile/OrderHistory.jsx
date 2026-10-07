import { useState, useEffect, useRef } from "react";
import logoIcon from "../../assets/logo-icon.png";
import orderApi from "../../api/orderApi";

export default function OrderHistory({
  user,
  onBackToStore,
  onBackToProfile,
  onOpenCart,
  onOpenAuth,
  cartCount = 0,
}) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilterStatus, setOrderFilterStatus] = useState("ALL");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState("30_DAYS"); // 30_DAYS | 60_DAYS | ALL
  const [fulfillmentFilter, setFulfillmentFilter] = useState("ALL"); // ALL | DELIVERY | TAKEAWAY
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [orderNotificationToast, setOrderNotificationToast] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await orderApi.getMyOrders(user?.id ? { userId: user.id } : {});
      const list = res.orders || res.data || [];
      setOrders(list);
    } catch (err) {
      console.warn("Lỗi tải đơn hàng:", err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
    window.scrollTo({ top: 0, behavior: "smooth" });

    const interval = setInterval(() => {
      fetchMyOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString("vi-VN") + "đ";
  };

  const formatOrderDate = (dateStr) => {
    if (!dateStr) return "Hôm nay";
    try {
      const d = new Date(dateStr);
      return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} - ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Mẫu đơn hàng chuẩn Velvet & Brew
  const defaultMockOrders = [
    {
      id: 98241,
      orderCode: "VB-98241",
      createdAt: new Date().toISOString(),
      status: "DELIVERING",
      isPaid: true,
      paymentMethod: "VISA",
      shippingAddress: "Chung cư Artemis, Tầng 5, 03 Lê Trọng Tấn, P. Khương Mai, Q. Thanh Xuân, Hà Nội",
      recipientName: user?.fullName || "Nguyễn Minh Trí",
      recipientPhone: user?.phoneNumber || "0903 888 234",
      note: "Cho xin thêm 2 ống hút giấy và ít đá riêng",
      subtotal: 165000,
      shippingFee: 20000,
      discountAmount: 40000,
      totalAmount: 145000,
      brewPoints: 15,
      deliveryType: "DELIVERY",
      driverName: "Nguyễn Văn Hùng",
      driverPhone: "0982 345 678",
      driverPlate: "29B1-882.14",
      deliveryDistance: "1.2 km (Tài xế đang đến)",
      items: [
        {
          id: 101,
          name: "Cà Phê Trứng Nướng Brulee",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdMxKFz8br9A39E0teaeHqEzquEMikNt5F_Kzyc-YpEq2rfj7Rgi9w-cvCnaCF6sPoof7JNpcbuNHgmPwbONA4F0BZ7IYQeDpc6BPWhf16i3UPrd5oCB_xTjHGW4yzj2k2iLobsc4_g4yboYNq8i1OCt5-8GlnjoMZ4pnOFIFkIACP5mx5dmzVXDujf-GtxayOlbM1KIveA2AfI4QRkrYhva_5caYa_D-VCBrOfDsvYcsNU80rfAI3Vw",
          quantity: 1,
          sizeName: "Size L",
          sweetness: "50% đường",
          ice: "Ít đá",
          toppings: ["Trân châu hoàng kim", "Thạch pudding"],
          unitPrice: 65000,
        },
        {
          id: 102,
          name: "Trà Sữa Oolong Nướng Rang Mộc",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCbe5hSL5WTGVXUf8LydC7rfsFlD2P2ggr-2waDg7boSlCqww05r5Svd7oSGIaBb02FpoOirzaZJvJEkBV93rgjC1csGm5vX3YnYji2qkVZQ4xBuv0_WvSTGkroTarOUdc2kxZk8HQpgp0249xQ55zh32YPirn0eefK65hmKTagj6k53UYrFzZElMakOSd7xXThx-YlQ-2QM-F687mTCw4--aI88SyNq9Ww9eh7QZk-h6c9ZX3bUnFvA",
          quantity: 1,
          sizeName: "Size M",
          sweetness: "70% đường",
          ice: "50% đá",
          toppings: ["Thạch Espresso nướng"],
          unitPrice: 55000,
        },
        {
          id: 103,
          name: "Bánh Croissant Hạnh Nhân Bơ Pháp",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgMQO1qbJqLhuL3iPsMcIDTG0SkiX_-l84-RnCAIsZ7AiP35Ntl93PwKR-nCrgevEaGSLCXlRM_39S9QrOuqV--UuKxvHvIbi24KEwfGm0VOkKJLxTaQo1wUVBMCEL4w_k7RloPElBf1mdFBquCqAw2_nBMV5NIsejM_B76grWB8tau3Ij7fAC65qLihL7q0IkkjgMT0Hk4rP94020FPFj2W-u9RIqcSSQq1e1PITZ4Oz9_Mg2tnp0qw",
          quantity: 1,
          sizeName: "Nóng giòn",
          sweetness: "",
          ice: "",
          toppings: ["Bơ Pháp Elle & Vire"],
          unitPrice: 45000,
        },
      ],
    },
    {
      id: 98190,
      orderCode: "VB-98190",
      createdAt: "2024-10-24T08:45:00.000Z",
      status: "PREPARING",
      isPaid: true,
      paymentMethod: "MOMO",
      shippingAddress: "Lấy mang đi tại quầy Velvet & Brew 124 Phố Cổ, Hoàn Kiếm, Hà Nội",
      recipientName: user?.fullName || "Nguyễn Minh Trí",
      recipientPhone: user?.phoneNumber || "0903 888 234",
      note: "Để đá riêng, đóng nắp chống tràn mang đi",
      subtotal: 120000,
      shippingFee: 0,
      discountAmount: 0,
      totalAmount: 120000,
      brewPoints: 12,
      deliveryType: "TAKEAWAY",
      items: [
        {
          id: 104,
          name: "Cold Brew Cam Sả Quế Thảo Mộc",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAyDeekpkli4cFFc6N7oViWPHymJSZaCi4lceB_95Sk1qdRfcDI1-Cvw-NndZU77kzeTILErZnREq4RNu4f7Mzs104RvPeYzW69onZoewzixEyLcy07i_i-zTb7wWvJPO2iIzhZiEq_ErADXus1oWS1mkmxKviKKMp9Nujj-025_AGpADf7bx8Xm7WIxLt9LqCgdZWw007vxtlIjdAaeygOIOvk4lSmzc8eVCceM4xoBWCkh5MwauQf0w",
          quantity: 2,
          sizeName: "Size L",
          sweetness: "Chuẩn",
          ice: "Đá riêng",
          toppings: ["Quế thanh & cam vàng"],
          unitPrice: 60000,
        },
      ],
    },
    {
      id: 97815,
      orderCode: "VB-97815",
      createdAt: "2024-10-22T15:20:00.000Z",
      status: "COMPLETED",
      isPaid: true,
      paymentMethod: "MOMO",
      shippingAddress: "Phòng 402, 124 Phố Huế, P. Hàng Bài, Q. Hoàn Kiếm, Hà Nội",
      recipientName: user?.fullName || "Nguyễn Minh Trí (Lễ tân tầng 1)",
      recipientPhone: user?.phoneNumber || "0903 888 234",
      subtotal: 185000,
      shippingFee: 0,
      totalAmount: 185000,
      brewPoints: 19,
      deliveryType: "DELIVERY",
      reviewRating: 5,
      reviewComment: "Cà phê thơm đậm vị, bọt sữa cực mịn ngậy!",
      items: [
        {
          id: 105,
          name: "Latte Hạnh Nhân Macchiato Yến Mạch",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCceJ032XSzChnNnnQTBq6Cpz84M9Nhc1NmFnpHQdBtEoLx_iL9yFyBr8jz8S2I6FRcv7vyKbKaObPcLw_qgN5mxWdqkEfnq0hARAcQIyfstm8h-MS7skoW8fV7I02FTsEWRjJuer2gTd7cM4b7uWkRyFaN0xkYR-GA4PkOuRdIKXDBnpPEvmeX1Suyj_gYqYEYFZMqSlr4nrRWI8mRMDECImHC61o_l72WtVnS3oFok_E_5Y8RoWj6xg",
          quantity: 2,
          sizeName: "Size L",
          sweetness: "Ít ngọt",
          ice: "Uống nóng",
          toppings: ["Sữa hạt Hạnh nhân hữu cơ"],
          unitPrice: 65000,
        },
        {
          id: 106,
          name: "Trà Shan Tuyết Cổ Thụ Mật Ong Rừng",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFFCKDGYgwQipvk0iLZwyKEjYzMqMxDkaQ1UO3KHZ9MHNQiujsgrOqKACVs1k6q4UY_IescnpJ5C8Kn88iWXH9Sx2v68N6Tc5t31l7LtddqJWoALfEg3w9ByyB9VOz08sqJFjmocgy4ivhcPWYSj33xWHByiMBrvvOa9p2UYVJwV685klG18NyMBHCgFV40briO-nzIvdVr6HEN0rIkNbuVFjGok1Llep2FfnmRclpA52NiiGOvzoOxQ",
          quantity: 1,
          sizeName: "Size M",
          sweetness: "Chuẩn",
          ice: "Nóng nhẹ",
          toppings: ["Mật ong hoa rừng tự nhiên"],
          unitPrice: 55000,
        },
      ],
    },
    {
      id: 96204,
      orderCode: "VB-96204",
      createdAt: "2024-10-18T14:10:00.000Z",
      status: "COMPLETED",
      isPaid: true,
      paymentMethod: "COD",
      shippingAddress: "Cửa hàng Velvet & Brew 124 Phố Cổ, Q. Hoàn Kiếm, Hà Nội",
      recipientName: user?.fullName || "Nguyễn Minh Trí",
      recipientPhone: user?.phoneNumber || "0903 888 234",
      subtotal: 58000,
      shippingFee: 0,
      totalAmount: 58000,
      brewPoints: 6,
      deliveryType: "TAKEAWAY",
      items: [
        {
          id: 107,
          name: "Trà Sữa Thiết Quan Âm Kem Phô Mai Macchiato",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBRJL49kbOfaFBCFZDYBNKW99XVAxvrCHMrOgHCxEKNsmNLmcPlEPbtkLApu3w5E6GqtV3HWoguAdnFvbPsTEpVhAUfepc3LS9PQzgNJP2K8mNQRdvRnDwezp6pk0IwHukgsHFMgcQ7CE0HyUB--0R9OT1J6lc-iXI0fR13_aqyYjThjsnwoqRsiKz6Y4D5FgKiWHaXQLPI70_wn4efbAnsHmHRpLsjJ3MldtB2z2F9Ga5XzHKEI1zfEA",
          quantity: 1,
          sizeName: "Size L",
          sweetness: "30% đường",
          ice: "Chuẩn",
          toppings: ["Trân châu đen hoàng gia"],
          unitPrice: 58000,
        },
      ],
    },
    {
      id: 95112,
      orderCode: "VB-95112",
      createdAt: "2024-10-10T09:00:00.000Z",
      status: "CANCELLED",
      isPaid: false,
      paymentMethod: "VNPAY",
      shippingAddress: "Chung cư Artemis, Tầng 5, 03 Lê Trọng Tấn, Thanh Xuân, Hà Nội",
      recipientName: user?.fullName || "Nguyễn Minh Trí",
      recipientPhone: user?.phoneNumber || "0903 888 234",
      subtotal: 110000,
      shippingFee: 0,
      totalAmount: 110000,
      brewPoints: 0,
      deliveryType: "DELIVERY",
      cancelReason: "Quý khách đổi ý địa chỉ giao hàng ngoài bán kính phục vụ 5km.",
      refundStatus: "Đã hoàn 110.000đ về thẻ ngân hàng",
      items: [
        {
          id: 108,
          name: "Espresso Tonic Cam Vàng & Tiramisu Cacao Specialty",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAyDeekpkli4cFFc6N7oViWPHymJSZaCi4lceB_95Sk1qdRfcDI1-Cvw-NndZU77kzeTILErZnREq4RNu4f7Mzs104RvPeYzW69onZoewzixEyLcy07i_i-zTb7wWvJPO2iIzhZiEq_ErADXus1oWS1mkmxKviKKMp9Nujj-025_AGpADf7bx8Xm7WIxLt9LqCgdZWw007vxtlIjdAaeygOIOvk4lSmzc8eVCceM4xoBWCkh5MwauQf0w",
          quantity: 1,
          sizeName: "Size L",
          sweetness: "Chuẩn",
          ice: "Chuẩn",
          toppings: [],
          unitPrice: 110000,
        },
      ],
    },
  ];

  // Kết hợp đơn thật từ database lên trên cùng
  const allOrders = [
    ...orders.map((dbOrder) => ({
      id: dbOrder.id,
      orderCode: dbOrder.orderCode,
      createdAt: dbOrder.createdAt,
      status: dbOrder.status,
      isPaid: dbOrder.isPaid,
      paymentMethod: dbOrder.paymentMethod,
      shippingAddress: dbOrder.shippingAddress,
      recipientName: user?.fullName || "Khách Hàng",
      recipientPhone: user?.phoneNumber || "",
      note: dbOrder.note || "",
      subtotal: Number(dbOrder.subtotal) || Number(dbOrder.totalAmount) || 0,
      shippingFee: Number(dbOrder.shippingFee) || 0,
      discountAmount: Number(dbOrder.discountAmount) || 0,
      totalAmount: Number(dbOrder.totalAmount) || 0,
      voucherCode: dbOrder.voucherCode || null,
      brewPoints: Number(dbOrder.brewPointsEarned) || Math.max(1, Math.round((Number(dbOrder.totalAmount) || 0) / 10000)),
      deliveryType: dbOrder.deliveryType || (dbOrder.shippingAddress?.includes("quầy") ? "TAKEAWAY" : "DELIVERY"),
      driverName: dbOrder.driverName || null,
      driverPhone: dbOrder.driverPhone || null,
      driverPlate: dbOrder.driverPlate || null,
      items:
        dbOrder.items?.map((it) => ({
          id: it.id,
          name: it.product?.name || "Cà Phê Velvet & Brew",
          image:
            it.product?.image ||
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDdMxKFz8br9A39E0teaeHqEzquEMikNt5F_Kzyc-YpEq2rfj7Rgi9w-cvCnaCF6sPoof7JNpcbuNHgmPwbONA4F0BZ7IYQeDpc6BPWhf16i3UPrd5oCB_xTjHGW4yzj2k2iLobsc4_g4yboYNq8i1OCt5-8GlnjoMZ4pnOFIFkIACP5mx5dmzVXDujf-GtxayOlbM1KIveA2AfI4QRkrYhva_5caYa_D-VCBrOfDsvYcsNU80rfAI3Vw",
          quantity: it.quantity || 1,
          sizeName: it.sizeName || "Size M",
          sweetness: it.sweetness || "Chuẩn",
          ice: it.ice || "Chuẩn",
          toppings: (it.toppings || []).map((tp) => tp.topping?.name || tp.name || (typeof tp === "string" ? tp : "Topping")),
          unitPrice: Number(it.unitPrice) || 0,
        })) || [],
    })),
    ...defaultMockOrders.filter(
      (mock) => !orders.some((db) => db.orderCode === mock.orderCode)
    ),
  ];

  const activeOrdersCount = allOrders.filter(
    (o) => o.status === "DELIVERING" || o.status === "PREPARING" || o.status === "PENDING"
  ).length;

  const deliveringCount = allOrders.filter(
    (o) => o.status === "DELIVERING" || o.status === "PREPARED"
  ).length;
  const preparingCount = allOrders.filter(
    (o) => o.status === "PREPARING" || o.status === "PENDING"
  ).length;
  const completedCount = allOrders.filter((o) => o.status === "COMPLETED").length;
  const cancelledCount = allOrders.filter((o) => o.status === "CANCELLED").length;

  const totalSpent = allOrders
    .filter((o) => o.status === "COMPLETED" || o.status === "DELIVERING" || o.status === "PREPARING" || o.status === "PREPARED")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const totalBrewPoints = allOrders.reduce((sum, o) => sum + (o.brewPoints || 0), 0);

  // Lọc
  const filteredOrders = allOrders.filter((order) => {
    if (orderFilterStatus === "DELIVERING" && order.status !== "DELIVERING" && order.status !== "PREPARED") return false;
    if (
      orderFilterStatus === "PREPARING" &&
      order.status !== "PREPARING" &&
      order.status !== "PENDING"
    )
      return false;
    if (orderFilterStatus === "COMPLETED" && order.status !== "COMPLETED") return false;
    if (orderFilterStatus === "CANCELLED" && order.status !== "CANCELLED") return false;

    if (fulfillmentFilter === "DELIVERY" && order.deliveryType === "TAKEAWAY") return false;
    if (fulfillmentFilter === "TAKEAWAY" && order.deliveryType !== "TAKEAWAY") return false;

    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      const matchCode = order.orderCode.toLowerCase().includes(q);
      const matchAddress = (order.shippingAddress || "").toLowerCase().includes(q);
      const matchItems = order.items.some((it) => it.name.toLowerCase().includes(q));
      if (!matchCode && !matchAddress && !matchItems) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleReorder = (order) => {
    setOrderNotificationToast({
      title: "Đã thêm vào giỏ hàng!",
      message: `Đơn #${order.orderCode} (${order.items.length} món) đã được thêm lại vào giỏ hàng.`,
      icon: "shopping_cart_checkout",
    });
    setTimeout(() => {
      setOrderNotificationToast(null);
    }, 4000);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;
    setCancellingOrderId(orderId);
    try {
      await orderApi.cancelOrder(orderId);
      setOrderNotificationToast({
        title: "Đã hủy đơn hàng thành công",
        message: `Đơn hàng #${orderId} đã được hủy.`,
        icon: "check_circle",
      });
      fetchMyOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể hủy đơn hàng này!");
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface min-h-screen flex flex-col">
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md shadow-[0_1px_8px_rgba(62,39,35,0.06)]">
        <div className="h-20 w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-space-md">
          {/* Logo & Slogan */}
          <div
            onClick={onBackToStore}
            className="flex items-center gap-space-sm shrink-0 cursor-pointer"
          >
            <img
              alt="Velvet & Brew Brand Logo"
              className="h-9 w-auto object-contain"
              src={logoIcon}
              onError={(e) => {
                e.target.src =
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuBRMxOCJJIwhg2mAHon8lvGMa1yym3orqDiRdlg40dBTFx0TvEYfZ71neLTQ8uprX8147qfyIYLJzVxXFz0-7ICt2RDwvn4jZ2tle3rHiJDQ2CKmX2n687yOluhuMxETFM7MOXoF--pdXecPCdu558V282Cl4oqc_UILl-QtvYPqxNgKmGVit_2jgH1wviVhHrNLduF8f-hBJVF13RvckcnmMoRE6pnVYhqI2aR7tzp6m2ScQKt6sznsQ";
              }}
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary leading-tight tracking-tight">
                Velvet & Brew
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                Artisanal Coffee & Tea
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-space-xs">
            <button
              onClick={onBackToStore}
              className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all border-0 bg-transparent cursor-pointer"
            >
              Trang chủ
            </button>
            <button
              onClick={onBackToStore}
              className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all border-0 bg-transparent cursor-pointer"
            >
              Thực đơn
            </button>
            <button
              onClick={onBackToStore}
              className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all border-0 bg-transparent cursor-pointer"
            >
              Cà phê
            </button>
            <button
              onClick={onBackToStore}
              className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all border-0 bg-transparent cursor-pointer"
            >
              Trà sữa
            </button>
            <button
              onClick={onBackToProfile}
              className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg bg-primary-container text-on-primary font-semibold shadow-sm border-0 cursor-pointer"
            >
              Lịch sử đơn
            </button>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-space-xs md:gap-space-sm shrink-0">
            <button
              aria-label="Thông báo đơn hàng"
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors border-0 bg-transparent cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error" />
            </button>

            <button
              aria-label="Giỏ hàng"
              onClick={onOpenCart}
              className="relative flex items-center gap-space-2xs bg-surface-container-low hover:bg-surface-container-high px-space-sm py-space-xs rounded-full transition-all text-on-surface border-0 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px] text-primary-container">
                local_mall
              </span>
              <span className="font-label-sm text-label-sm bg-primary-container text-on-primary px-space-2xs py-[1px] rounded-full">
                {cartCount}
              </span>
            </button>

            <button
              onClick={onBackToProfile}
              className="flex items-center pl-space-2xs border-0 bg-transparent cursor-pointer group"
              title="Về trang tài khoản"
              type="button"
            >
              <img
                alt="Ảnh đại diện khách hàng"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary-container transition-all shadow-[0_2px_6px_rgba(62,39,35,0.15)]"
                src={
                  user?.avatar ||
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuAIuIQH4ntxcCHLQm_B4eLlcpsyZoY-ztnLLrUoHQvuvhcWVL697v9e1qYuXL24xfWixBCb4BcNpdyDf9rtZtY-m81_NLB_tSkCN2O1IlWOV_1ZFsHncKjfwk6Rjx50j_WXLwVKonSWBuo8pXE9BWiAxbzq36FemRBOkxiDC3Dx-jHU6-d9_-gq1JUgZipflE6h9X1FRZCv7yciMd_JqiGJ5n7ELAz5zdTP9mBzsgaFotLvcETCpMaqAA"
                }
              />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="w-full pt-20 bg-surface flex-1">
        {/* Breadcrumb strip */}
        <div className="w-full bg-surface-container-low/60 shadow-[0_1px_4px_rgba(62,39,35,0.02)]">
          <div className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-xs flex items-center justify-between">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-space-2xs font-body-sm text-body-sm text-on-surface-variant"
            >
              <button
                onClick={onBackToStore}
                className="flex items-center hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0 text-on-surface-variant font-body-sm"
              >
                <span className="material-symbols-outlined text-[16px] mr-1">home</span>
                Trang chủ
              </button>
              <span className="material-symbols-outlined text-[14px] text-outline">
                chevron_right
              </span>
              <button
                onClick={onBackToProfile}
                className="hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0 text-on-surface-variant font-body-sm"
              >
                Tài khoản & Hồ sơ
              </button>
              <span className="material-symbols-outlined text-[14px] text-outline">
                chevron_right
              </span>
              <span
                aria-current="page"
                className="font-label-sm text-label-sm text-primary font-semibold"
              >
                Lịch sử tất cả đơn hàng
              </span>
            </nav>

            <button
              onClick={onBackToProfile}
              className="flex items-center gap-1 text-primary hover:underline font-label-sm text-label-sm font-semibold bg-transparent border-0 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Quay lại hồ sơ cá nhân</span>
            </button>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-xl">
          {/* Top Header Banner & Stats Section */}
          <section className="relative overflow-hidden rounded-xl bg-surface-container p-space-lg md:p-space-xl lg:p-space-2xl shadow-sm mb-space-xl">
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-space-xl">
              <div className="max-w-2xl">
                <div className="flex items-center gap-space-2xs mb-space-xs text-on-tertiary-container">
                  <span className="material-symbols-outlined text-[20px]">local_cafe</span>
                  <span className="font-label-sm text-label-sm tracking-wider uppercase font-semibold">
                    Tài Khoản Thành Viên BrewClub
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg md:text-display-lg text-primary tracking-tight m-0 font-serif">
                  Quản Lý & Lịch Sử Tất Cả Đơn Hàng
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs m-0">
                  Theo dõi trạng thái giao hàng thời gian thực, xem lại chi tiết thức uống đã đặt và gọi lại món yêu thích chỉ với một chạm.
                </p>
              </div>

              <div className="flex items-center gap-space-xs shrink-0">
                <button
                  onClick={fetchMyOrders}
                  className="bg-primary-container text-on-primary hover:bg-tertiary-container font-label-lg text-label-lg px-space-md py-space-sm rounded-full transition-all shadow-sm flex items-center gap-space-xs border-0 cursor-pointer font-semibold"
                  type="button"
                >
                  <span className={`material-symbols-outlined text-[18px] ${loadingOrders ? "animate-spin" : ""}`}>
                    sync
                  </span>
                  <span>Làm mới</span>
                </button>
                <button
                  onClick={() => alert("Tổng đài CSKH Velvet & Brew: 1900 6886 (8:00 - 22:00 hàng ngày)")}
                  className="bg-surface-container-lowest text-primary hover:bg-surface-container-high font-label-lg text-label-lg px-space-md py-space-sm rounded-full transition-all shadow-sm flex items-center gap-space-xs border-0 cursor-pointer font-semibold"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">help_outline</span>
                  <span>Trợ Giúp</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Stats Bento */}
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-space-md mt-space-xl pt-space-lg border-t-0">
              <div className="bg-surface-container-lowest/80 backdrop-blur-sm p-space-md md:p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-space-2xs">
                  <span className="font-label-md text-label-md">Tổng số đơn</span>
                  <span className="material-symbols-outlined text-outline text-[20px]">
                    shopping_bag
                  </span>
                </div>
                <div>
                  <div className="font-headline-md text-headline-md text-primary font-semibold">
                    {allOrders.length} Đơn
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                    <span className="text-secondary font-medium">100%</span> tỉ lệ giao thành công
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest/80 backdrop-blur-sm p-space-md md:p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-space-2xs">
                  <span className="font-label-md text-label-md">Tổng chi tiêu</span>
                  <span className="material-symbols-outlined text-outline text-[20px]">
                    payments
                  </span>
                </div>
                <div>
                  <div className="font-headline-md text-headline-md text-primary font-semibold">
                    {formatCurrency(totalSpent)}
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                    Tiết kiệm <span className="text-on-tertiary-container font-medium">320.000đ</span> ưu đãi
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest/80 backdrop-blur-sm p-space-md md:p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-space-2xs">
                  <span className="font-label-md text-label-md">Tích lũy Brew Club</span>
                  <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">
                    stars
                  </span>
                </div>
                <div>
                  <div className="font-headline-md text-headline-md text-on-tertiary-container font-semibold">
                    +{totalBrewPoints} Hạt Brew
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                    Đạt hạng <span className="text-primary font-medium">Gold Connoisseur</span>
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest/80 backdrop-blur-sm p-space-md md:p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-space-2xs">
                  <span className="font-label-md text-label-md">Đơn đang diễn ra</span>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                  </span>
                </div>
                <div>
                  <div className="font-headline-md text-headline-md text-secondary font-semibold">
                    {activeOrdersCount} Đang giao
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                    <span className="text-secondary font-medium">
                      {activeOrdersCount > 0 ? "Đang trên đường giao" : "Hiện tại không có"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Toolbar: Search, Filters & Tabs */}
          <section className="flex flex-col gap-space-md mb-space-xl">
            {/* Status Tabs */}
            <div className="flex items-center gap-space-xs overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => {
                  setOrderFilterStatus("ALL");
                  setCurrentPage(1);
                }}
                className={`font-label-lg text-label-lg px-space-md py-space-xs rounded-full shadow-sm whitespace-nowrap flex items-center gap-space-2xs transition-all border-0 cursor-pointer ${
                  orderFilterStatus === "ALL"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                }`}
                type="button"
              >
                <span>Tất cả</span>
                <span className="bg-surface-container-high/30 px-2 py-0.5 rounded-full text-label-sm font-label-sm">
                  {allOrders.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setOrderFilterStatus("DELIVERING");
                  setCurrentPage(1);
                }}
                className={`font-label-lg text-label-lg px-space-md py-space-xs rounded-full shadow-sm whitespace-nowrap flex items-center gap-space-2xs transition-all border-0 cursor-pointer ${
                  orderFilterStatus === "DELIVERING"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                }`}
                type="button"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                </span>
                <span>Đã pha chế & Vận chuyển</span>
                <span className="bg-secondary/15 text-secondary px-2 py-0.5 rounded-full text-label-sm font-label-sm font-bold">
                  {deliveringCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setOrderFilterStatus("PREPARING");
                  setCurrentPage(1);
                }}
                className={`font-label-lg text-label-lg px-space-md py-space-xs rounded-full shadow-sm whitespace-nowrap flex items-center gap-space-2xs transition-all border-0 cursor-pointer ${
                  orderFilterStatus === "PREPARING"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                }`}
                type="button"
              >
                <span>Đang chuẩn bị / Pha chế</span>
                <span className="bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full text-label-sm font-label-sm">
                  {preparingCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setOrderFilterStatus("COMPLETED");
                  setCurrentPage(1);
                }}
                className={`font-label-lg text-label-lg px-space-md py-space-xs rounded-full shadow-sm whitespace-nowrap flex items-center gap-space-2xs transition-all border-0 cursor-pointer ${
                  orderFilterStatus === "COMPLETED"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                }`}
                type="button"
              >
                <span>Đã hoàn tất</span>
                <span className="bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full text-label-sm font-label-sm">
                  {completedCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setOrderFilterStatus("CANCELLED");
                  setCurrentPage(1);
                }}
                className={`font-label-lg text-label-lg px-space-md py-space-xs rounded-full shadow-sm whitespace-nowrap flex items-center gap-space-2xs transition-all border-0 cursor-pointer ${
                  orderFilterStatus === "CANCELLED"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                }`}
                type="button"
              >
                <span>Đã hủy / Hoàn tiền</span>
                <span className="bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full text-label-sm font-label-sm">
                  {cancelledCount}
                </span>
              </button>
            </div>

            {/* Search & Extended Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md bg-surface-container-low p-space-md rounded-xl shadow-sm">
              {/* Search bar */}
              <div className="md:col-span-6 flex items-center bg-surface-container-lowest px-space-md py-space-xs rounded-full shadow-sm border border-outline-variant/30">
                <span className="material-symbols-outlined text-outline text-[20px] mr-space-xs">
                  search
                </span>
                <input
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline border-0"
                  placeholder="Tìm theo mã đơn (#VB-98241), tên đồ uống, tên người nhận..."
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => {
                    setOrderSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery("")}
                    className="text-outline hover:text-primary border-0 bg-transparent cursor-pointer p-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              {/* Date Range Filter */}
              <div className="md:col-span-3 flex items-center justify-between bg-surface-container-lowest px-space-md py-space-xs rounded-full shadow-sm border border-outline-variant/30">
                <div className="flex items-center gap-space-xs min-w-0 w-full">
                  <span className="material-symbols-outlined text-outline text-[18px]">
                    calendar_today
                  </span>
                  <select
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value)}
                    className="bg-transparent font-body-md text-body-md text-on-surface outline-none border-0 w-full cursor-pointer appearance-none"
                  >
                    <option value="30_DAYS">30 ngày gần nhất</option>
                    <option value="60_DAYS">60 ngày gần nhất</option>
                    <option value="ALL">Toàn bộ thời gian</option>
                  </select>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px] pointer-events-none">
                  arrow_drop_down
                </span>
              </div>

              {/* Fulfillment Mode Filter */}
              <div className="md:col-span-3 flex items-center justify-between bg-surface-container-lowest px-space-md py-space-xs rounded-full shadow-sm border border-outline-variant/30">
                <div className="flex items-center gap-space-xs min-w-0 w-full">
                  <span className="material-symbols-outlined text-outline text-[18px]">
                    local_shipping
                  </span>
                  <select
                    value={fulfillmentFilter}
                    onChange={(e) => setFulfillmentFilter(e.target.value)}
                    className="bg-transparent font-body-md text-body-md text-on-surface outline-none border-0 w-full cursor-pointer appearance-none"
                  >
                    <option value="ALL">Tất cả hình thức</option>
                    <option value="DELIVERY">Giao hàng hỏa tốc</option>
                    <option value="TAKEAWAY">Lấy tại quầy</option>
                  </select>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px] pointer-events-none">
                  arrow_drop_down
                </span>
              </div>
            </div>
          </section>

          {/* Orders Feed */}
          <div className="flex flex-col gap-space-xl">
            {paginatedOrders.length === 0 ? (
              <div className="p-space-2xl text-center bg-surface-container-lowest rounded-xl shadow-sm flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-[64px] text-outline mb-space-sm">
                  inventory_2
                </span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold m-0">
                  Không tìm thấy đơn hàng nào
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-space-xs">
                  Không có đơn hàng nào khớp với điều kiện tìm kiếm và bộ lọc hiện tại.
                </p>
                <button
                  onClick={() => {
                    setOrderFilterStatus("ALL");
                    setOrderSearchQuery("");
                    setFulfillmentFilter("ALL");
                    setDateRangeFilter("30_DAYS");
                  }}
                  className="mt-space-md px-space-xl py-space-xs rounded-full bg-primary-container text-on-primary font-label-md text-label-md font-semibold border-0 cursor-pointer shadow-sm hover:bg-tertiary-container transition-all"
                  type="button"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              paginatedOrders.map((order) => {
                const isDelivering = order.status === "DELIVERING";
                const isPrepared = order.status === "PREPARED";
                const isPreparing = order.status === "PREPARING";
                const isPending = order.status === "PENDING";
                const isCompleted = order.status === "COMPLETED";
                const isCancelled = order.status === "CANCELLED";

                return (
                  <article
                    key={order.orderCode || order.id}
                    className="bg-surface-container-lowest rounded-xl p-space-lg md:p-space-xl shadow-md transition-all border border-outline-variant/40"
                  >
                    {/* Header badge row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-md mb-space-md bg-surface-container-low/40 -mx-space-lg md:-mx-space-xl -mt-space-lg md:-mt-space-xl px-space-lg md:px-space-xl pt-space-lg md:pt-space-xl rounded-t-xl">
                      <div className="flex flex-wrap items-center gap-space-sm">
                        <span className="font-title-lg text-title-lg text-primary font-bold font-mono">
                          #{order.orderCode}
                        </span>
                        <span className="text-outline-variant">•</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          {formatOrderDate(order.createdAt)}
                        </span>
                        <span className="text-outline-variant">•</span>
                        <span className="bg-primary/10 text-primary font-label-sm text-label-sm px-space-xs py-0.5 rounded-full flex items-center gap-1 font-semibold">
                          <span className="material-symbols-outlined text-[14px]">
                            {order.deliveryType === "TAKEAWAY" ? "storefront" : "electric_moped"}
                          </span>
                          {order.deliveryType === "TAKEAWAY" ? "Lấy tại quầy" : "Giao hàng hỏa tốc"}
                        </span>
                      </div>

                      <div className="flex items-center gap-space-xs self-start lg:self-auto">
                        {isDelivering && (
                          <span className="inline-flex items-center gap-1.5 bg-secondary-container text-on-secondary-fixed-variant px-space-md py-space-2xs rounded-full font-label-md text-label-md font-semibold shadow-sm">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                            </span>
                            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                            <span>
                              {order.deliveryType === "TAKEAWAY"
                                ? "Đã pha chế xong • Sẵn sàng lấy tại quầy"
                                : "Đã pha chế xong và vận chuyển"}
                            </span>
                          </span>
                        )}
                        {isPrepared && (
                          <span className="inline-flex items-center gap-1.5 bg-secondary-container text-on-secondary-fixed-variant px-space-md py-space-2xs rounded-full font-label-md text-label-md font-semibold shadow-sm">
                            <span className="material-symbols-outlined text-secondary text-[16px]">
                              check_circle
                            </span>
                            <span>Đã pha chế xong</span>
                          </span>
                        )}
                        {isPreparing && (
                          <span className="inline-flex items-center gap-1.5 bg-tertiary-fixed text-on-tertiary-fixed-variant px-space-md py-space-2xs rounded-full font-label-md text-label-md font-semibold">
                            <span className="material-symbols-outlined text-[16px] animate-spin">
                              sync
                            </span>
                            <span>Barista đang pha chế</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 bg-surface-container text-primary px-space-md py-space-2xs rounded-full font-label-md text-label-md font-semibold">
                            <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                            <span>Chờ xử lý đơn</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 bg-surface-container text-on-surface-variant px-space-md py-space-2xs rounded-full font-label-md text-label-md font-semibold">
                            <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              check_circle
                            </span>
                            <span>Giao hàng thành công</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="bg-error-container text-on-error-container font-label-sm text-label-sm px-space-xs py-0.5 rounded-full flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[14px]">cancel</span>
                            <span>Đơn đã hủy</span>
                          </span>
                        )}
                      </div>
                    </div>


                    {/* Order Content Split Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-lg">
                      {/* Drinks List */}
                      <div className="lg:col-span-7 flex flex-col gap-space-md">
                        <span className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider font-semibold">
                          Danh sách món ({order.items.reduce((s, it) => s + (it.quantity || 1), 0)} món)
                        </span>

                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-space-md bg-surface-container-low/40 p-space-sm rounded-lg"
                          >
                            <img
                              className="w-16 h-16 rounded-lg object-cover shrink-0 shadow-sm border border-outline-variant/30"
                              src={item.image}
                              alt={item.name}
                              onError={(e) => {
                                e.target.src =
                                  "https://lh3.googleusercontent.com/aida-public/AB6AXuDdMxKFz8br9A39E0teaeHqEzquEMikNt5F_Kzyc-YpEq2rfj7Rgi9w-cvCnaCF6sPoof7JNpcbuNHgmPwbONA4F0BZ7IYQeDpc6BPWhf16i3UPrd5oCB_xTjHGW4yzj2k2iLobsc4_g4yboYNq8i1OCt5-8GlnjoMZ4pnOFIFkIACP5mx5dmzVXDujf-GtxayOlbM1KIveA2AfI4QRkrYhva_5caYa_D-VCBrOfDsvYcsNU80rfAI3Vw";
                              }}
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-space-xs">
                                <h2 className="font-title-md text-title-md text-primary font-semibold truncate m-0">
                                  {item.quantity}x {item.name}
                                </h2>
                                <span className="font-title-md text-title-md text-primary font-bold whitespace-nowrap">
                                  {formatCurrency(item.unitPrice * (item.quantity || 1))}
                                </span>
                              </div>
                              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 m-0">
                                {item.sizeName} {item.sweetness ? `• ${item.sweetness}` : ""} {item.ice ? `• ${item.ice}` : ""}
                              </p>
                              {item.toppings?.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                  {item.toppings.map((top, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full"
                                    >
                                      + {top.topping?.name || top.name || (typeof top === "string" ? top : "Topping")}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Review rating callout if completed */}
                        {order.reviewComment && (
                          <div className="mt-space-xs p-space-sm bg-surface-container-low/70 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-space-xs">
                              <div className="flex text-on-tertiary-container">
                                {[...Array(order.reviewRating || 5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className="material-symbols-outlined text-[16px]"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                  >
                                    star
                                  </span>
                                ))}
                              </div>
                              <span className="font-body-sm text-body-sm text-on-surface italic">
                                "{order.reviewComment}"
                              </span>
                            </div>
                            <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">
                              Đã đánh giá
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Order Metadata & Financial Breakdown */}
                      <div className="lg:col-span-5 flex flex-col justify-between bg-surface-container-low p-space-md md:p-space-lg rounded-xl">
                        <div className="flex flex-col gap-space-sm">
                          <span className="font-label-lg text-label-lg text-primary font-semibold">
                            Thông tin nhận hàng
                          </span>
                          <div className="flex items-start gap-space-xs text-on-surface">
                            <span className="material-symbols-outlined text-outline text-[18px] shrink-0 mt-0.5">
                              location_on
                            </span>
                            <div>
                              <p className="font-body-md text-body-md font-medium m-0">
                                {order.recipientName} • {order.recipientPhone}
                              </p>
                              <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-0.5">
                                {order.shippingAddress}
                              </p>
                            </div>
                          </div>

                          {order.note && (
                            <div className="flex items-start gap-space-xs text-on-surface-variant bg-surface-container-lowest p-space-xs rounded-lg mt-space-2xs">
                              <span className="material-symbols-outlined text-on-tertiary-container text-[18px] shrink-0">
                                edit_note
                              </span>
                              <p className="font-body-sm text-body-sm italic m-0">
                                "{order.note}"
                              </p>
                            </div>
                          )}

                          <div className="flex flex-col gap-space-2xs pt-space-xs border-t border-surface-container">
                            <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                              <span>Tạm tính đồ uống:</span>
                              <span>{formatCurrency(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                              <span>Phí giao hàng:</span>
                              <span>{order.shippingFee ? formatCurrency(order.shippingFee) : "0đ"}</span>
                            </div>
                            {order.discountAmount > 0 && (
                              <div className="flex justify-between font-body-sm text-body-sm text-secondary font-medium">
                                <span>Voucher giảm giá:</span>
                                <span>-{formatCurrency(order.discountAmount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-title-lg text-title-lg text-primary font-bold pt-space-2xs border-t border-surface-container">
                              <span>Tổng thanh toán:</span>
                              <span className="text-tertiary-container font-extrabold">
                                {formatCurrency(order.totalAmount)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant pt-1">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-secondary">
                                  check_circle
                                </span>{" "}
                                {order.paymentMethod === "VISA"
                                  ? "Thẻ Visa •••• 4092 (Đã thanh toán)"
                                  : order.paymentMethod === "MOMO"
                                  ? "Ví điện tử MoMo"
                                  : order.paymentMethod === "vietqr" || order.paymentMethod === "PAYOS"
                                  ? "VietQR Đã thanh toán"
                                  : "Tiền mặt khi nhận hàng (COD)"}
                              </span>
                              <span className="text-on-tertiary-container font-semibold">
                                +{order.brewPoints || 10} Hạt Brew
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Real-time actions */}
                        <div className="flex flex-wrap items-center gap-space-xs pt-space-md">
                          {isDelivering ? (
                            <>
                              <button
                                onClick={() => setSelectedOrderForDetail(order)}
                                className="flex-1 bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md px-space-md py-space-xs rounded-full shadow-sm flex items-center justify-center gap-1 transition-all border-0 cursor-pointer font-semibold"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[18px]">map</span>
                                <span>Theo dõi tài xế trên bản đồ</span>
                              </button>
                              <a
                                href="tel:0982345678"
                                className="bg-surface-container-lowest text-primary hover:bg-surface-container-high font-label-md text-label-md px-space-md py-space-xs rounded-full shadow-sm flex items-center gap-1 transition-all no-underline font-semibold"
                              >
                                <span className="material-symbols-outlined text-[18px]">call</span>
                                <span>Tài xế ({order.driverPhone ? order.driverPhone.slice(0, 4) + "***" : "0982***"})</span>
                              </a>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleReorder(order)}
                                className="flex-1 bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md px-space-md py-space-xs rounded-full shadow-sm flex items-center justify-center gap-1 transition-all border-0 cursor-pointer font-semibold"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[18px]">replay</span>
                                <span>Đặt lại đơn này</span>
                              </button>
                              <button
                                onClick={() => setSelectedOrderForDetail(order)}
                                className="bg-surface-container-lowest text-primary hover:bg-surface-container-high font-label-md text-label-md px-space-md py-space-xs rounded-full shadow-sm flex items-center gap-1 transition-all border-0 cursor-pointer font-semibold"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[18px]">info</span>
                                <span>Chi tiết</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Pagination & Results Counter */}
          <section className="mt-space-xl pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md border-t border-surface-container">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Hiển thị{" "}
              <strong className="text-primary font-semibold">
                {filteredOrders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{" "}
                {Math.min(currentPage * pageSize, filteredOrders.length)}
              </strong>{" "}
              trong tổng số <strong className="text-primary font-semibold">{filteredOrders.length}</strong> đơn hàng
            </span>
            <div className="flex items-center gap-1">
              <button
                aria-label="Trang trước"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-9 h-9 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-all border-0 bg-transparent cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-full font-label-md text-label-md transition-all border-0 cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-primary text-on-primary shadow-sm"
                        : "text-on-surface-variant hover:bg-surface-container bg-transparent"
                    }`}
                    type="button"
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                aria-label="Trang tiếp"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all border-0 bg-transparent cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </section>

          {/* Customer Care & Quality Promise Banner */}
          <section className="mt-space-2xl bg-surface-container rounded-xl p-space-lg md:p-space-xl flex flex-col lg:flex-row items-center justify-between gap-space-xl shadow-sm">
            <div className="flex items-start gap-space-md max-w-2xl">
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary font-semibold m-0">
                  Cam Kết Chất Lượng Đồ Uống Tươi Mới
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1 m-0">
                  Mỗi ly trà và cà phê đều được đóng kín với nắp chống tràn chuyên dụng, giữ trọn nhiệt độ &amp; hương vị thủ công trong suốt 30 phút giao hàng. Nếu có bất kỳ trải nghiệm không hài lòng nào, Velvet &amp; Brew cam kết hoàn tiền 100%.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-space-sm shrink-0 w-full lg:w-auto">
              <a
                className="w-full sm:w-auto bg-surface-container-lowest text-primary hover:bg-surface-container-high font-label-md text-label-md px-space-lg py-space-sm rounded-full transition-all shadow-sm flex items-center justify-center gap-space-xs no-underline font-semibold"
                href="tel:19006886"
              >
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  support_agent
                </span>
                <span>Hotline 1900 6886 (Miễn phí)</span>
              </a>
              <button
                onClick={() => alert("Kênh Zalo CSKH chính thức: Velvet & Brew Việt Nam (Zalo OA)")}
                className="w-full sm:w-auto bg-primary-container text-on-primary hover:bg-tertiary-container font-label-md text-label-md px-space-lg py-space-sm rounded-full transition-all shadow-sm flex items-center justify-center gap-space-xs border-0 cursor-pointer font-semibold"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
                <span>Zalo CSKH Trực Tuyến</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="w-full bg-surface-container-low text-on-surface shadow-[0_-1px_12px_rgba(62,39,35,0.03)] mt-space-3xl">
        <div className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-gutter-desktop">
            <div className="lg:col-span-2 flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <img
                  alt="Velvet & Brew Brand Logo"
                  className="h-8 w-auto object-contain"
                  src={logoIcon}
                  onError={(e) => {
                    e.target.src =
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuBRMxOCJJIwhg2mAHon8lvGMa1yym3orqDiRdlg40dBTFx0TvEYfZ71neLTQ8uprX8147qfyIYLJzVxXFz0-7ICt2RDwvn4jZ2tle3rHiJDQ2CKmX2n687yOluhuMxETFM7MOXoF--pdXecPCdu558V282Cl4oqc_UILl-QtvYPqxNgKmGVit_2jgH1wviVhHrNLduF8f-hBJVF13RvckcnmMoRE6pnVYhqI2aR7tzp6m2ScQKt6sznsQ";
                  }}
                />
                <span className="font-headline-sm text-headline-sm text-primary leading-tight tracking-tight">
                  Velvet & Brew
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md m-0">
                Nơi nghệ thuật pha chế thủ công hòa quyện cùng xúc cảm đương đại. Từng giọt cà phê chắt lọc và lá trà tuyển chọn mang lại trải nghiệm thư thái tuyệt mỹ.
              </p>
              <div className="flex flex-col gap-space-2xs mt-2">
                <div className="flex items-center gap-space-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-tertiary-container">
                    schedule
                  </span>
                  <span className="font-body-sm text-body-sm">Thứ Hai - Chủ Nhật: 07:00 - 22:30</span>
                </div>
                <div className="flex items-center gap-space-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-tertiary-container">
                    location_on
                  </span>
                  <span className="font-body-sm text-body-sm">124 Phố Cổ, Quận Hoàn Kiếm, Hà Nội</span>
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
              <span className="font-title-md text-title-md text-primary font-bold">Khám Phá</span>
              <div className="flex flex-col gap-space-xs">
                <button
                  onClick={onBackToStore}
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors text-left bg-transparent border-0 cursor-pointer p-0"
                >
                  Cà phê Specialty
                </button>
                <button
                  onClick={onBackToStore}
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors text-left bg-transparent border-0 cursor-pointer p-0"
                >
                  Trà Shan Tuyết & Oolong
                </button>
                <button
                  onClick={onBackToStore}
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors text-left bg-transparent border-0 cursor-pointer p-0"
                >
                  Bánh ngọt thủ công
                </button>
                <button
                  onClick={onBackToStore}
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors text-left bg-transparent border-0 cursor-pointer p-0"
                >
                  Bộ quà tặng mùa lễ hội
                </button>
                <button
                  onClick={onBackToProfile}
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors text-left bg-transparent border-0 cursor-pointer p-0"
                >
                  Đăng ký hội viên BrewClub
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-space-sm">
              <span className="font-title-md text-title-md text-primary font-bold">Hỗ Trợ</span>
              <div className="flex flex-col gap-space-xs">
                <span className="font-body-md text-body-md text-on-surface-variant">Chính sách giao hàng</span>
                <span className="font-body-md text-body-md text-on-surface-variant">Hướng dẫn đặt đồ uống</span>
                <span className="font-body-md text-body-md text-on-surface-variant">Bảo mật thông tin</span>
                <span className="font-body-md text-body-md text-on-surface-variant">Hợp tác nhượng quyền</span>
                <span className="font-body-md text-body-md text-on-surface-variant">Liên hệ phản hồi</span>
              </div>
            </div>

            <div className="flex flex-col gap-space-sm">
              <span className="font-title-md text-title-md text-primary font-bold">Bản Tin Hương Vị</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
                Đăng ký nhận ưu đãi độc quyền và cảm hứng thưởng thức cà phê mỗi tuần.
              </p>
              <div className="flex flex-col gap-space-xs mt-2">
                <div className="flex items-center bg-surface-container-lowest rounded-full p-space-2xs shadow-[0_2px_8px_rgba(62,39,35,0.04)] border border-outline-variant/30">
                  <input
                    className="bg-transparent px-space-sm py-space-xs text-on-surface placeholder:text-outline font-body-sm text-body-sm outline-none w-full border-0"
                    placeholder="Email của bạn..."
                    type="email"
                  />
                  <button
                    className="bg-primary-container text-on-primary hover:bg-tertiary-container rounded-full px-space-md py-space-xs font-label-sm text-label-sm transition-colors shrink-0 border-0 cursor-pointer font-semibold"
                    type="button"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-space-2xl pt-space-md flex flex-col md:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm border-t border-surface-container">
            <p className="m-0">© 2024 Velvet & Brew Artisanal Coffee & Tea. Tất cả quyền được bảo lưu.</p>
            <div className="flex items-center gap-space-md">
              <button
                onClick={onBackToProfile}
                className="hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0 text-on-surface-variant font-body-sm"
              >
                Hồ sơ cá nhân
              </button>
              <button
                onClick={onBackToStore}
                className="hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0 text-on-surface-variant font-body-sm"
              >
                Trang chủ cửa hàng
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 4. MODAL CHI TIẾT ĐƠN HÀNG */}
      {selectedOrderForDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-margin-mobile md:p-space-xl bg-[#271310]/60 backdrop-blur-sm transition-all duration-300"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrderForDetail(null);
          }}
        >
          <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-space-lg py-space-md border-b border-surface-container bg-surface-container-low">
              <div className="flex items-center gap-space-xs">
                <div className="w-10 h-10 rounded-full bg-primary-container text-[#ffdcc3] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-title-lg text-title-lg text-primary font-bold m-0 font-mono">
                      #{selectedOrderForDetail.orderCode}
                    </h3>
                    <span className="font-label-sm text-[11px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
                      {selectedOrderForDetail.status === "DELIVERING"
                        ? (selectedOrderForDetail.deliveryType === "TAKEAWAY" ? "Đã pha chế xong • Sẵn sàng lấy tại quầy" : "Đã pha chế xong và vận chuyển")
                        : selectedOrderForDetail.status === "PREPARED"
                        ? "Đã pha chế xong"
                        : selectedOrderForDetail.status === "PREPARING"
                        ? "Barista đang pha chế"
                        : selectedOrderForDetail.status === "COMPLETED"
                        ? "Thành công"
                        : selectedOrderForDetail.status === "CANCELLED"
                        ? "Đã hủy"
                        : "Chờ tiếp nhận"}
                    </span>
                  </div>
                  <p className="font-body-sm text-[12px] text-on-surface-variant m-0 mt-0.5">
                    Đặt lúc: {formatOrderDate(selectedOrderForDetail.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors border-0 cursor-pointer"
                title="Đóng hộp thoại"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-space-lg overflow-y-auto flex flex-col gap-space-md">
              <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-2">
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  Địa chỉ giao hàng
                </span>
                <p className="font-label-md text-label-md font-bold text-primary m-0">
                  {selectedOrderForDetail.recipientName} • {selectedOrderForDetail.recipientPhone}
                </p>
                <p className="font-body-sm text-[13px] text-on-surface-variant m-0">
                  {selectedOrderForDetail.shippingAddress}
                </p>
                {selectedOrderForDetail.note && (
                  <p className="font-body-sm text-[12px] italic text-on-tertiary-container m-0 mt-1 bg-surface-container-lowest p-2 rounded-md">
                    Ghi chú: "{selectedOrderForDetail.note}"
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 bg-surface-container-low p-space-sm rounded-xl">
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold px-1">
                  Món trong đơn ({selectedOrderForDetail.items?.length || 0} món)
                </span>
                {selectedOrderForDetail.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-space-sm py-1.5 border-b last:border-b-0 border-surface-container"
                  >
                    <div className="flex items-center gap-space-sm min-w-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-outline-variant/30"
                        onError={(e) => {
                          e.target.src =
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuDdMxKFz8br9A39E0teaeHqEzquEMikNt5F_Kzyc-YpEq2rfj7Rgi9w-cvCnaCF6sPoof7JNpcbuNHgmPwbONA4F0BZ7IYQeDpc6BPWhf16i3UPrd5oCB_xTjHGW4yzj2k2iLobsc4_g4yboYNq8i1OCt5-8GlnjoMZ4pnOFIFkIACP5mx5dmzVXDujf-GtxayOlbM1KIveA2AfI4QRkrYhva_5caYa_D-VCBrOfDsvYcsNU80rfAI3Vw";
                        }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md font-bold text-primary truncate">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-body-sm text-[11px] text-on-surface-variant">
                          {item.sizeName} {item.sweetness ? `• ${item.sweetness}` : ""} {item.ice ? `• ${item.ice}` : ""}
                        </span>
                        {item.toppings?.length > 0 && (
                          <span className="font-body-sm text-[11px] text-primary font-medium">
                            + {item.toppings.map((t) => t.topping?.name || t.name || (typeof t === "string" ? t : "Topping")).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-label-md text-label-md font-bold text-primary shrink-0">
                      {formatCurrency(item.unitPrice * (item.quantity || 1))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-1.5">
                <div className="flex justify-between font-body-sm text-[12px] text-on-surface-variant">
                  <span>Tạm tính thức uống:</span>
                  <span>{formatCurrency(selectedOrderForDetail.subtotal)}</span>
                </div>
                <div className="flex justify-between font-body-sm text-[12px] text-on-surface-variant">
                  <span>Phí giao hàng:</span>
                  <span>{selectedOrderForDetail.shippingFee ? formatCurrency(selectedOrderForDetail.shippingFee) : "0đ"}</span>
                </div>
                {selectedOrderForDetail.discountAmount > 0 && (
                  <div className="flex justify-between font-body-sm text-[12px] text-secondary font-semibold">
                    <span>Ưu đãi thành viên:</span>
                    <span>-{formatCurrency(selectedOrderForDetail.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-title-lg text-title-lg text-primary font-bold pt-1 border-t border-surface-container">
                  <span>Tổng thanh toán:</span>
                  <span className="text-primary font-extrabold">
                    {formatCurrency(selectedOrderForDetail.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-space-lg py-space-md border-t border-surface-container bg-surface-container-low">
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="px-space-md py-space-xs rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-colors border-0 cursor-pointer"
                type="button"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  handleReorder(selectedOrderForDetail);
                  setSelectedOrderForDetail(null);
                }}
                className="px-space-lg py-space-xs rounded-full bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-tertiary-container shadow-md transition-all flex items-center gap-1.5 border-0 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">replay</span>
                <span>Đặt lại đơn này</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. TOAST NOTIFICATION */}
      {orderNotificationToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary px-space-lg py-space-md rounded-2xl shadow-2xl flex items-center gap-space-sm border border-[#ffdcc3]/30 animate-in slide-in-from-bottom-5">
          <span className="material-symbols-outlined text-[24px] text-secondary-fixed">
            {orderNotificationToast.icon || "info"}
          </span>
          <div className="flex flex-col">
            <span className="font-label-md text-label-md font-bold text-white">
              {orderNotificationToast.title}
            </span>
            <span className="font-body-sm text-[12px] text-on-primary-container">
              {orderNotificationToast.message}
            </span>
          </div>
          <button
            onClick={() => setOrderNotificationToast(null)}
            className="w-6 h-6 rounded-full bg-surface-container/20 text-white flex items-center justify-center border-0 cursor-pointer ml-2 hover:bg-surface-container/40"
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
