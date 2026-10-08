import { useState, useEffect } from "react";
import logoIcon from "../../assets/logo-icon.png";
import adminApi from "../../api/adminApi";
import orderApi from "../../api/orderApi";
import { fetchProducts } from "../../api/productApi";
import CustomerManagementTab from "./tabs/CustomerManagementTab";
import OrderManagementTab from "./tabs/OrderManagementTab";

export default function AdminDashboard({ user, onBackToStore }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [period, setPeriod] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");

  // Dữ liệu doanh thu & thống kê từ Backend
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    completedRevenue: 0,
    completedOrders: 0,
  });
  const [userData, setUserData] = useState({
    totalUsers: 0,
    newUsers: 0,
    allAccounts: 0,
    users: [],
  });
  const [menuStats, setMenuStats] = useState({
    activeCount: 0,
    totalCount: 0,
    inactiveCount: 0,
  });
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [topSellingProducts, setTopSellingProducts] = useState([]);

  // Gọi API lấy doanh thu, người dùng và thực đơn mỗi khi thay đổi kỳ thời gian
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoadingRevenue(true);
        const [revRes, userRes, menuRes, topRes] = await Promise.all([
          adminApi.getRevenueStats({
            period: period === "custom" ? "all" : period,
          }),
          adminApi.getUsers({
            period: period === "custom" ? "all" : period,
          }),
          adminApi.getMenuStats(),
          adminApi.getTopSelling({
            period: period === "custom" ? "all" : period,
          }),
        ]);

        if (revRes && revRes.success && revRes.data) {
          setRevenueData(revRes.data);
        }
        if (userRes && userRes.success && userRes.data) {
          setUserData({
            ...userRes.data,
            users: userRes.users || userRes.data.users || [],
          });
        }
        if (menuRes && menuRes.success) {
          const mData = menuRes.data || {};
          setMenuStats({
            activeCount: mData.activeCount ?? menuRes.menuCount ?? 0,
            totalCount: mData.totalCount ?? menuRes.menuCount ?? 0,
            inactiveCount: mData.inactiveCount ?? 0,
          });
        }
        if (topRes && topRes.success && Array.isArray(topRes.data)) {
          setTopSellingProducts(topRes.data);
        }
      } catch (error) {
        console.error("Lỗi khi tải thống kê dashboard:", error);
      } finally {
        setLoadingRevenue(false);
      }
    };

    fetchDashboardStats();
  }, [period]);

  // ================== QUẢN LÝ ĐƠN HÀNG ==================
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await orderApi.getAllOrders();
      if (res && res.orders && Array.isArray(res.orders)) {
        const mappedOrders = res.orders.map((o) => {
          let statusLabel = "Chờ xác nhận";
          let statusColor = "bg-tertiary-fixed text-on-tertiary-fixed";
          let dotColor = "bg-on-tertiary-container";
          const st = (o.status || "PENDING").toUpperCase();
          if (st === "PREPARING") {
            statusLabel = "Đang pha chế";
            statusColor = "bg-surface-container-highest text-on-surface";
            dotColor = "bg-primary-container animate-pulse";
          } else if (st === "DELIVERING") {
            statusLabel = "Đang giao hàng";
            statusColor = "bg-secondary-fixed text-on-secondary-fixed";
            dotColor = "bg-secondary";
          } else if (st === "COMPLETED") {
            statusLabel = "Hoàn thành";
            statusColor = "bg-secondary-container text-on-secondary-container";
            dotColor = "bg-secondary";
          } else if (st === "CANCELLED") {
            statusLabel = "Đã hủy";
            statusColor = "bg-error-container text-on-error-container";
            dotColor = "bg-error";
          }

          const itemsDesc =
            (o.items || [])
              .map(
                (it) =>
                  `${it.quantity}x ${it.product?.name || "Món"}${it.size ? ` (${it.size})` : ""
                  }`,
              )
              .join(", ") || "Đơn hàng chuẩn";

          const noteDesc =
            (o.items || [])
              .map((it) => {
                const parts = [];
                if (it.sugar) parts.push(`${it.sugar}% Đường`);
                if (it.ice) parts.push(`${it.ice}% Đá`);
                if (it.toppings) parts.push(it.toppings);
                return parts.join(", ");
              })
              .filter(Boolean)
              .join(" | ") ||
            o.notes ||
            "";

          const dateObj = o.createdAt ? new Date(o.createdAt) : new Date();
          const timeStr =
            dateObj.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }) +
            " " +
            dateObj.toLocaleDateString("vi-VN");

          const channel =
            o.orderType === "takeaway"
              ? "Mang đi"
              : o.orderType === "delivery"
                ? "Giao hàng"
                : "Tại quầy (POS)";
          const channelIcon =
            o.orderType === "delivery"
              ? "two_wheeler"
              : o.orderType === "takeaway"
                ? "shopping_bag"
                : "storefront";

          return {
            id: o.orderCode
              ? `#${o.orderCode}`
              : `#VB-${String(o.id).padStart(4, "0")}`,
            rawId: o.id,
            time: timeStr,
            customer: o.user?.fullName || o.customerName || "Khách vãng lai",
            phone: o.user?.phoneNumber || o.customerPhone || "N/A",
            items: itemsDesc,
            note: noteDesc,
            rawItems: o.items || [],
            total: Number(o.totalAmount || 0).toLocaleString("vi-VN") + " đ",
            payment: (o.paymentMethod || "VietQR").toUpperCase(),
            channel,
            channelIcon,
            status: st.toLowerCase(),
            statusLabel,
            statusColor,
            dotColor,
          };
        });
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.warn("Lỗi tải danh sách đơn hàng:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (
    orderId,
    newStatus,
    newLabel,
    newColor,
    newDot,
  ) => {
    // Cập nhật giao diện trước cho nhanh
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
            ...o,
            status: newStatus,
            statusLabel: newLabel,
            statusColor: newColor,
            dotColor: newDot,
          }
          : o,
      ),
    );

    // Lưu trạng thái vào Database
    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder?.rawId) {
      try {
        await orderApi.updateOrderStatus(
          targetOrder.rawId,
          newStatus.toUpperCase(),
        );
      } catch (err) {
        console.warn("Lỗi lưu trạng thái đơn:", err);
      }
    }
  };

  const handleQuickStatus = (order) => {
    if (order.status === "pending") {
      handleUpdateStatus(
        order.id,
        "preparing",
        "Đang pha chế",
        "bg-surface-container-highest text-on-surface",
        "bg-primary-container animate-pulse",
      );
    } else if (order.status === "preparing") {
      handleUpdateStatus(
        order.id,
        "delivering",
        "Đang giao hàng",
        "bg-secondary-fixed text-on-secondary-fixed",
        "bg-secondary",
      );
    } else if (order.status === "delivering") {
      handleUpdateStatus(
        order.id,
        "completed",
        "Hoàn tất",
        "bg-secondary-container text-on-secondary-container",
        "bg-secondary",
      );
    }
  };

  // ================== QUẢN LÝ SẢN PHẨM ==================
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productStatusFilter, setProductStatusFilter] = useState("");
  const [productSort, setProductSort] = useState("latest");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({
    name: "",
    sku: "",
    category: "Cà phê Specialty",
    prepTime: "3 - 5 phút",
    price: "",
    salePrice: "",
    cogs: "",
    description: "",
    image: "",
    isBestSeller: false,
    isNew: false,
    isActive: true,
    sizeS: true,
    sizeM: true,
    sizeL: true,
    toppings: [],
  });

  const [productsList, setProductsList] = useState([]);

  // Tải danh sách món từ database
  useEffect(() => {
    fetchProducts()
      .then((res) => {
        if (res && Array.isArray(res)) {
          const categoryNameMap = {
            coffee: "Cà phê Specialty",
            milktea: "Trà sữa & Trà nướng",
            fruittea: "Trà trái cây nhiệt đới",
            special: "Đá xay Velvet Frost",
            toppings: "Topping thủ công",
          };
          const mapped = res.map((p) => {
            const priceNum =
              typeof p.price === "number"
                ? p.price
                : parseInt(String(p.price || 0).replace(/\D/g, "")) || 0;
            return {
              id: p.id,
              name: p.name,
              sku:
                p.sku ||
                `VB-${(p.category || "CF").toUpperCase().slice(0, 3)}-${String(p.id).padStart(3, "0")}`,
              category: p.category || "coffee",
              categoryName: categoryNameMap[p.category] || "Cà phê Specialty",
              price: priceNum ? priceNum.toLocaleString("vi-VN") + " đ" : "0 đ",
              rawPrice: priceNum,
              oldPrice: p.oldPrice
                ? typeof p.oldPrice === "number"
                  ? p.oldPrice.toLocaleString("vi-VN") + " đ"
                  : p.oldPrice
                : null,
              soldCount: p.soldCount !== undefined ? String(p.soldCount) : "0",
              soldTrend: p.soldTrend || "",
              materialName: p.materialName || "Nguyên liệu chính",
              materialStatus: p.materialStatus || "Đầy đủ",
              materialPercent:
                p.materialPercent !== undefined ? p.materialPercent : 100,
              isActive: p.isActive !== false,
              sizes: Array.isArray(p.sizes)
                ? p.sizes
                  .map((s) => (typeof s === "object" ? s.name : String(s)))
                  .filter(Boolean)
                  .join(", ") || "Size: M, L"
                : typeof p.sizes === "string"
                  ? p.sizes
                  : "Size: M, L",
              toppings: Array.isArray(p.toppings)
                ? p.toppings
                  .map((t) =>
                    typeof t === "object"
                      ? t.topping?.name || t.name || ""
                      : String(t),
                  )
                  .filter(Boolean)
                : [],
              image:
                p.image ||
                "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=700&q=85",
              description: p.description || "",
              isBestSeller: p.isBestSeller || false,
              isNew: p.isNew || false,
              tag: p.isBestSeller ? "Best Seller" : p.isNew ? "Mới" : null,
              tagColor: p.isBestSeller
                ? "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                : "bg-surface-container-high text-on-surface-variant",
            };
          });
          setProductsList(mapped);
        }
      })
      .catch((err) => console.warn("Lỗi tải món từ DB:", err));
  }, []);

  const handleToggleProductActive = async (id) => {
    const target = productsList.find((p) => p.id === id);
    if (!target) return;
    const nextStatus = !target.isActive;
    setProductsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: nextStatus } : p)),
    );
    try {
      await adminApi.toggleProductActive(id, nextStatus);
    } catch (e) {
      console.warn("Toggle active backend:", e.message);
    }
  };

  const handleDeleteProduct = (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi thực đơn?")) {
      setProductsList((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductFormData({
      name: prod.name || "",
      sku: prod.sku || "",
      category: prod.categoryName || "Cà phê Specialty",
      prepTime: prod.prepTime || "3 - 5 phút",
      price: prod.rawPrice
        ? String(prod.rawPrice)
        : prod.price
          ? String(prod.price).replace(/[^\d]/g, "")
          : "",
      salePrice: prod.oldPrice
        ? String(prod.oldPrice).replace(/[^\d]/g, "")
        : "",
      cogs: prod.cogs ? String(prod.cogs) : "",
      description: prod.description || "",
      image: prod.image || "",
      isBestSeller: Boolean(
        prod.isBestSeller || prod.tag?.includes("Best Seller"),
      ),
      isNew: Boolean(prod.isNew || prod.tag?.includes("Mới")),
      isActive: Boolean(prod.isActive),
      sizeS: true,
      sizeM: true,
      sizeL: true,
      toppings: Array.isArray(prod.toppings)
        ? prod.toppings
          .map((t) =>
            typeof t === "object"
              ? t.topping?.name || t.name || ""
              : String(t),
          )
          .filter(Boolean)
        : [],
    });
    setIsProductModalOpen(true);
  };

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      name: "",
      sku: `VB-NEW-${String(productsList.length + 1).padStart(3, "0")}`,
      category: "Cà phê Specialty",
      prepTime: "3 - 5 phút",
      price: "",
      salePrice: "",
      cogs: "",
      description: "",
      image: "",
      isBestSeller: false,
      isNew: true,
      isActive: true,
      sizeS: true,
      sizeM: true,
      sizeL: true,
      toppings: [],
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e) => {
    if (e) e.preventDefault();
    if (!productFormData.name.trim()) {
      alert("Vui lòng nhập tên sản phẩm!");
      return;
    }
    if (editingProduct) {
      setProductsList((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
              ...p,
              name: productFormData.name,
              sku: productFormData.sku,
              categoryName: productFormData.category,
              category: productFormData.category.includes("Trà sữa")
                ? "milktea"
                : productFormData.category.includes("Trà trái cây")
                  ? "fruittea"
                  : productFormData.category.includes("Đá xay")
                    ? "special"
                    : productFormData.category.includes("Topping")
                      ? "toppings"
                      : "coffee",
              price: `${productFormData.price} đ`,
              description: productFormData.description,
              image: productFormData.image || p.image,
              isActive: productFormData.isActive,
              tag: productFormData.isBestSeller
                ? "Best Seller"
                : productFormData.isNew
                  ? "Mới"
                  : null,
              tagColor: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
            }
            : p,
        ),
      );
    } else {
      const newProd = {
        id: Date.now(),
        name: productFormData.name,
        sku: productFormData.sku || `VB-NEW-${Date.now().toString().slice(-3)}`,
        category: productFormData.category.includes("Trà sữa")
          ? "milktea"
          : productFormData.category.includes("Trà trái cây")
            ? "fruittea"
            : productFormData.category.includes("Đá xay")
              ? "special"
              : productFormData.category.includes("Topping")
                ? "toppings"
                : "coffee",
        categoryName: productFormData.category,
        price: `${productFormData.price} đ`,
        soldCount: "0",
        soldTrend: "Mới tạo",
        materialName: "Nguyên liệu chuẩn",
        materialStatus: "Đầy đủ",
        materialPercent: 100,
        isActive: productFormData.isActive,
        sizes: "Size: S, M, L",
        image:
          productFormData.image ||
          "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=700&q=85",
        description: productFormData.description,
        tag: productFormData.isBestSeller
          ? "Best Seller"
          : productFormData.isNew
            ? "Mới"
            : null,
        tagColor: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
      };
      setProductsList((prev) => [newProd, ...prev]);
    }
    setIsProductModalOpen(false);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    {
      id: "quan-ly-don-hang",
      label: "Quản lý Đơn hàng",
      icon: "receipt_long",
      badge:
        orders.filter((o) => o.status === "pending").length > 0
          ? String(orders.filter((o) => o.status === "pending").length)
          : null,
    },
    {
      id: "quan-ly-san-pham",
      label: "Quản lý Sản phẩm",
      icon: "local_cafe",
    },
    { id: "khach-hang", label: "Khách hàng", icon: "group" },
    { id: "khuyen-mai", label: "Khuyến mãi", icon: "loyalty" },
    { id: "nhan-vien", label: "Nhân viên", icon: "badge" },
    { id: "cai-dat", label: "Cài đặt", icon: "settings" },
  ];

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface antialiased min-h-screen relative flex">
      {/* ===================== SIDEBAR ===================== */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col justify-between shadow-[0_1px_12px_rgba(62,39,35,0.06)] border-r border-surface-container">
        <div className="flex flex-col">
          {/* Logo & Brand */}
          <div className="h-20 px-space-lg flex items-center justify-between border-b border-surface-container/60">
            <div className="flex items-center gap-space-sm">
              <img
                src={logoIcon}
                alt="Velvet & Brew"
                className="h-10 w-10 object-contain drop-shadow-sm"
              />
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary leading-none font-bold">
                  Velvet &amp; Brew
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase mt-space-2xs">
                  Admin Portal
                </span>
              </div>
            </div>
          </div>

          {/* Nút quay lại trang Web mua hàng */}
          <div className="px-space-md pt-space-sm pb-space-xs">
            <button
              onClick={onBackToStore}
              className="w-full flex items-center justify-center gap-2 px-space-md py-2.5 bg-surface-container-lowest hover:bg-surface-container-high text-primary border border-outline-variant/60 rounded-xl font-label-md text-label-md transition-all shadow-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                storefront
              </span>
              <span>← Về Trang Cửa Hàng</span>
            </button>
          </div>

          <div className="px-space-md py-space-2xs">
            <p className="px-space-sm py-space-2xs font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Quản trị hệ thống
            </p>
          </div>

          {/* Navigation Links */}
          <nav
            className="flex flex-col gap-1.5 px-space-md w-full"
            style={{ width: "100%", boxSizing: "border-box" }}
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left border-0 cursor-pointer ${isActive
                    ? "bg-primary-container text-white shadow-sm"
                    : "bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    }`}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    display: "flex",
                  }}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{
                        width: "24px",
                        textAlign: "center",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>
                    <span
                      style={{
                        fontSize: "13.5px",
                        fontWeight: isActive ? "700" : "500",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-space-xs py-0.5 rounded-full font-label-sm text-label-sm ${isActive
                        ? "bg-white/20 text-white"
                        : "bg-secondary-container text-on-secondary-container"
                        }`}
                      style={{ marginLeft: "auto" }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Store status footer in sidebar */}
        <div className="p-space-md bg-surface-container m-space-md rounded-xl flex items-center justify-between border border-outline-variant/40">
          <div className="flex items-center gap-space-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-primary font-bold">
                Cửa hàng Mở cửa
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Chi nhánh Flagship
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
            storefront
          </span>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT WRAPPER ===================== */}
      <div className="pl-72 flex flex-col min-h-screen w-full">
        {/* TOP HEADER */}
        <header className="fixed top-0 left-72 right-0 h-20 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(62,39,35,0.04)] z-40 px-space-xl flex items-center justify-between border-b border-surface-container">
          {/* Search Bar */}
          <div className="flex items-center gap-space-md flex-1 max-w-lg">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                className="w-full pl-11 pr-space-md py-space-xs bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant rounded-full font-body-md text-body-md outline-none transition-all shadow-[0_2px_8px_rgba(62,39,35,0.04)] focus:shadow-[0_0_0_2px_#3e2723] border border-outline-variant/30"
                placeholder="Tìm đơn hàng, mã thức uống, khách hàng..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Actions & Profile */}
          <div className="flex items-center gap-space-md">
            <div className="hidden lg:flex items-center gap-space-xs">
              <button
                className="flex items-center gap-space-xs px-space-md py-space-xs bg-primary-container text-white rounded-full font-label-md text-label-md hover:bg-primary transition-all shadow-sm cursor-pointer"
                type="button"
                onClick={() => alert("Chức năng tạo đơn nhanh tại quầy")}
              >
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>
                <span>Tạo đơn nhanh</span>
              </button>
              <button
                className="flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-lowest text-on-surface rounded-full font-label-md text-label-md hover:bg-surface-container-high transition-all shadow-sm border border-outline-variant/40 cursor-pointer"
                type="button"
                onClick={() => alert("Mở giao diện POS Thu ngân")}
              >
                <span className="material-symbols-outlined text-[18px]">
                  point_of_sale
                </span>
                <span>POS Thu ngân</span>
              </button>
            </div>

            <div className="h-6 w-px bg-surface-container-highest" />

            <button
              className="relative p-space-xs rounded-full hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              type="button"
              title="Thông báo"
            >
              <span className="material-symbols-outlined text-[22px]">
                notifications
              </span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error" />
            </button>

            {/* Admin Profile */}
            <div className="flex items-center gap-space-sm pl-space-xs">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="font-label-lg text-label-lg text-primary leading-tight font-bold">
                  {user?.fullName || "Nguyễn Anh Thư"}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant leading-none">
                  {user?.role === "ADMIN"
                    ? "Quản trị viên cấp cao"
                    : "Quản lý cửa hàng"}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.fullName
                  ? user.fullName
                    .trim()
                    .split(" ")
                    .map((n) => n[0])
                    .slice(-2)
                    .join("")
                    .toUpperCase()
                  : "AD"}
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="w-full pt-28 px-space-xl pb-space-2xl bg-background flex-1">
          {activeTab === "dashboard" && (
            <div className="flex flex-col w-full">
              {/* Top Greeting & Control Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-xl">
                <div>
                  <div className="flex items-center gap-space-xs mb-space-2xs">
                    <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
                      Hệ thống thời gian thực
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Cập nhật lúc 09:30
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                    Chào buổi sáng, {user?.fullName || "Quản trị viên"}!
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                    Hôm nay hệ thống ghi nhận{" "}
                    <strong className="text-primary font-title-sm">
                      {orders.filter((o) => o.status === "pending").length} đơn
                      hàng mới
                    </strong>{" "}
                    cần chuẩn bị và điều phối giao tức thì.
                  </p>
                </div>

                {/* Quick Action Toolbars */}
                <div className="flex flex-wrap items-center gap-space-xs">
                  {/* Timeframe Filter Pills */}
                  <div className="flex items-center p-1 bg-surface-container rounded-full shadow-inner border border-outline-variant/30">
                    <button
                      className={`filter-btn px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${period === "today"
                        ? "bg-primary text-white shadow-sm"
                        : "text-on-surface-variant hover:text-primary"
                        }`}
                      onClick={() => setPeriod("today")}
                      type="button"
                    >
                      Hôm nay
                    </button>
                    <button
                      className={`filter-btn px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${period === "7d"
                        ? "bg-primary text-white shadow-sm"
                        : "text-on-surface-variant hover:text-primary"
                        }`}
                      onClick={() => setPeriod("7d")}
                      type="button"
                    >
                      7 ngày qua
                    </button>
                    <button
                      className={`filter-btn px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${period === "month"
                        ? "bg-primary text-white shadow-sm"
                        : "text-on-surface-variant hover:text-primary"
                        }`}
                      onClick={() => setPeriod("month")}
                      type="button"
                    >
                      Tháng này
                    </button>
                    <button
                      className={`filter-btn px-space-xs py-1.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1 cursor-pointer ${period === "custom"
                        ? "bg-primary text-white shadow-sm"
                        : "text-on-surface-variant hover:text-primary"
                        }`}
                      onClick={() => setPeriod("custom")}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        tune
                      </span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <button
                    className="flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-lowest text-primary hover:bg-surface-container-high rounded-full font-label-md text-label-md shadow-sm transition-all border border-outline-variant/40 cursor-pointer"
                    type="button"
                    onClick={() => alert("Đang xuất file báo cáo Excel/PDF...")}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      download
                    </span>
                    <span>Xuất báo cáo</span>
                  </button>
                  <button
                    className="flex items-center gap-space-xs px-space-lg py-space-xs bg-primary-container text-white hover:bg-primary rounded-full font-label-md text-label-md shadow-md transition-all cursor-pointer"
                    type="button"
                    onClick={() => alert("Mở form tạo đơn tại quầy")}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      add_circle
                    </span>
                    <span>+ Tạo đơn tại quầy</span>
                  </button>
                </div>
              </div>

              {/* Row 1: 4 Large Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg mb-space-xl">
                {/* Card 1: Doanh thu */}
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group border border-outline-variant/20">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-tertiary-fixed/30 rounded-full blur-2xl group-hover:bg-tertiary-fixed/50 transition-colors" />
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                        Tổng Doanh Thu
                      </span>
                      <div className="font-headline-md text-headline-md text-primary mt-space-2xs tracking-tight font-bold">
                        {loadingRevenue ? (
                          <span className="text-body-md opacity-60">
                            Đang tải...
                          </span>
                        ) : (
                          Number(revenueData.totalRevenue || 0).toLocaleString(
                            "vi-VN",
                          )
                        )}
                        <span className="text-[15px] font-body-sm font-semibold ml-1">
                          đ
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-tertiary-container text-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">
                        payments
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Tổng đơn hàng */}
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group border border-outline-variant/20">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-secondary-fixed/30 rounded-full blur-2xl group-hover:bg-secondary-fixed/50 transition-colors" />
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                        Tổng Đơn Hàng
                      </span>
                      <div className="font-headline-md text-headline-md text-primary mt-space-2xs tracking-tight font-bold">
                        {loadingRevenue ? (
                          <span className="text-body-md opacity-60">...</span>
                        ) : (
                          Number(revenueData.totalOrders || 0).toLocaleString(
                            "vi-VN",
                          )
                        )}{" "}
                        <span className="text-[15px] font-body-sm font-normal text-on-surface-variant">
                          đơn
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">
                        receipt_long
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Khách hàng mới */}
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group border border-outline-variant/20">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-fixed/40 rounded-full blur-2xl group-hover:bg-primary-fixed/60 transition-colors" />
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                        Hội Viên Mới
                      </span>
                      <div className="font-headline-md text-headline-md text-primary mt-space-2xs tracking-tight font-bold">
                        {loadingRevenue ? (
                          <span className="text-body-md opacity-60">...</span>
                        ) : (
                          Number(userData.totalUsers || 0).toLocaleString(
                            "vi-VN",
                          )
                        )}{" "}
                        <span className="text-[14px] font-body-sm font-normal text-on-surface-variant">
                          khách hàng
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">
                        loyalty
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 4: Thực đơn & Cảnh báo */}
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group border border-outline-variant/20">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-error-container/40 rounded-full blur-2xl group-hover:bg-error-container/60 transition-colors" />
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                        Menu Đang Phục Vụ
                      </span>
                      <div className="font-headline-md text-headline-md text-primary mt-space-2xs tracking-tight font-bold">
                        {loadingRevenue ? (
                          <span className="text-body-md opacity-60">...</span>
                        ) : (
                          menuStats.activeCount
                        )}{" "}
                        <span className="text-[14px] font-body-sm font-normal text-on-surface-variant">
                          món active
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">
                        local_cafe
                      </span>
                    </div>
                  </div>
                  <div className="mt-space-md pt-space-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-secondary-container/60 text-on-secondary-container px-space-xs py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[14px] text-secondary font-bold">
                        check_circle
                      </span>
                      <span className="font-label-sm text-label-sm font-bold">
                        {menuStats.totalCount} tổng số món
                      </span>
                    </div>
                    <span
                      className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary cursor-pointer transition-colors"
                      onClick={() => setActiveTab("quan-ly-san-pham")}
                    >
                      Xem kho →
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Charts (Split Panels: Line/Bar chart & Category Donut chart) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
                {/* Top Món Bán Chạy & Topping Đi Kèm (Best-sellers & Matrix) (8 cols) */}
                <div className="lg:col-span-8 bg-surface-container-lowest p-space-xl rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-primary text-[22px]">
                          leaderboard
                        </span>
                        <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                          Top Món Bán Chạy &amp; Topping Đi Kèm (Best-sellers
                          &amp; Matrix)
                        </h2>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        Giúp chuẩn bị sẵn nguyên liệu chủ lực (ủ trà, nấu trân
                        châu, kem cheese) vừa đủ, tránh tồn dư hoặc đứt hàng giờ
                        cao điểm.
                      </p>
                    </div>
                    <div className="flex items-center gap-space-xs shrink-0">
                      <span className="inline-flex items-center gap-1 px-space-xs py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        Thời gian thực
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-md">
                    {topSellingProducts.length === 0 ? (
                      <div className="p-space-xl text-center text-on-surface-variant bg-surface-container-low/30 rounded-xl">
                        <span className="material-symbols-outlined text-[36px] text-outline mb-2">
                          receipt_long
                        </span>
                        <p className="font-title-sm font-semibold">Chưa có dữ liệu bán hàng</p>
                        <p className="font-body-sm text-outline">
                          Khi có đơn hàng được thanh toán, top món bán chạy sẽ tự động cập nhật từ Database.
                        </p>
                      </div>
                    ) : (
                      topSellingProducts.map((item) => (
                        <div
                          key={item.rank}
                          className="p-space-sm rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-space-xs">
                              <span
                                className={`w-6 h-6 rounded-full font-label-sm text-[12px] font-bold flex items-center justify-center shrink-0 ${
                                  item.rank === 1
                                    ? "bg-primary-container text-on-primary"
                                    : item.rank === 2
                                      ? "bg-tertiary-container text-on-tertiary"
                                      : item.rank === 3
                                        ? "bg-secondary text-on-secondary"
                                        : "bg-surface-container-high text-primary"
                                }`}
                              >
                                {item.rank}
                              </span>
                              <span className="font-title-sm text-title-sm text-primary font-bold">
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-space-xs">
                              <span className="font-title-sm text-title-sm text-primary font-bold">
                                {item.soldCount} ly
                              </span>
                              <span className="px-space-xs py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                                {item.percentage}%
                              </span>
                            </div>
                          </div>

                          {/* Thanh phần trăm */}
                          <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden mb-2">
                            <div
                              className="bg-primary-container h-full rounded-full transition-all duration-300"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>

                          {/* Topping đi kèm từ database */}
                          {item.toppings && item.toppings.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 text-body-sm">
                              <span className="font-label-sm text-label-sm text-on-surface-variant">
                                Topping đi kèm:
                              </span>
                              {item.toppings.map((tp, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container text-on-surface text-[12px]"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
                                  {tp.percent}% {tp.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-space-sm mt-space-xs flex flex-wrap items-center justify-between text-body-sm text-on-surface-variant border-t border-surface-container/60">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        inventory
                      </span>
                      Đã đồng bộ công thức định lượng pha chế với hệ thống bếp
                    </span>
                    <span className="text-secondary font-semibold">
                      Cập nhật 5 phút trước
                    </span>
                  </div>
                </div>

                {/* Category Sales Share Donut Card (4 cols) */}
                <div className="lg:col-span-4 bg-surface-container-lowest p-space-xl rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/20">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                      Tỷ Trọng Danh Mục
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Phân bổ doanh số tuần này
                    </p>
                  </div>

                  {/* Donut Graphic */}
                  <div className="my-space-md flex flex-col items-center justify-center relative">
                    <svg
                      className="w-44 h-44 -rotate-90 transform"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        className="text-surface-container"
                        cx="50"
                        cy="50"
                        fill="transparent"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="14"
                      />
                      <circle
                        className="text-primary-container"
                        cx="50"
                        cy="50"
                        fill="transparent"
                        r="40"
                        stroke="currentColor"
                        strokeDasharray="251.2"
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        strokeWidth="14"
                      />
                      <circle
                        className="text-on-tertiary-container"
                        cx="50"
                        cy="50"
                        fill="transparent"
                        r="40"
                        stroke="currentColor"
                        strokeDasharray="87.9 251.2"
                        strokeDashoffset="-108"
                        strokeWidth="14"
                      />
                      <circle
                        className="text-secondary"
                        cx="50"
                        cy="50"
                        fill="transparent"
                        r="40"
                        stroke="currentColor"
                        strokeDasharray="37.6 251.2"
                        strokeDashoffset="-198"
                        strokeWidth="14"
                      />
                      <circle
                        className="text-primary-fixed-dim"
                        cx="50"
                        cy="50"
                        fill="transparent"
                        r="40"
                        stroke="currentColor"
                        strokeDasharray="20 251.2"
                        strokeDashoffset="-238"
                        strokeWidth="14"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                        Best Seller
                      </span>
                      <span className="font-title-lg text-title-lg text-primary font-bold">
                        Cà Phê
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary font-bold">
                        42%
                      </span>
                    </div>
                  </div>

                  {/* Legend List */}
                  <div className="space-y-space-xs text-body-sm">
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-space-xs">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                        <span className="text-on-surface font-medium">
                          Cà phê pha phin &amp; máy
                        </span>
                      </div>
                      <span className="font-title-sm text-title-sm text-primary font-bold">
                        42%{" "}
                        <span className="text-body-sm font-normal text-on-surface-variant">
                          (77.8M)
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-space-xs">
                        <div className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container" />
                        <span className="text-on-surface font-medium">
                          Trà sữa Oolong rang
                        </span>
                      </div>
                      <span className="font-title-sm text-title-sm text-primary font-bold">
                        35%{" "}
                        <span className="text-body-sm font-normal text-on-surface-variant">
                          (64.8M)
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-space-xs">
                        <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                        <span className="text-on-surface font-medium">
                          Trà hoa quả nhiệt đới
                        </span>
                      </div>
                      <span className="font-title-sm text-title-sm text-primary font-bold">
                        15%{" "}
                        <span className="text-body-sm font-normal text-on-surface-variant">
                          (27.8M)
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-space-xs">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim" />
                        <span className="text-on-surface font-medium">
                          Đá xay &amp; Toppings
                        </span>
                      </div>
                      <span className="font-title-sm text-title-sm text-primary font-bold">
                        8%{" "}
                        <span className="text-body-sm font-normal text-on-surface-variant">
                          (14.8M)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Recent Orders & Kitchen Status */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
                {/* Recent Orders Table (8 cols) */}
                <div className="lg:col-span-8 bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/20">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-lg">
                      <div>
                        <div className="flex items-center gap-space-xs">
                          <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                            Đơn Hàng Gần Đây Cần Xử Lý
                          </h2>
                          <span className="px-space-xs py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded-full font-label-sm text-label-sm font-bold">
                            {orders.length} đơn
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          Theo dõi luồng order thời gian thực tại quầy và app
                          giao hàng
                        </p>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <button
                          className="p-2 text-on-surface-variant hover:text-primary rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
                          title="Làm mới danh sách đơn hàng"
                          type="button"
                          onClick={fetchOrders}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            refresh
                          </span>
                        </button>
                        <button
                          className="px-space-md py-1.5 rounded-full bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors cursor-pointer font-semibold"
                          type="button"
                          onClick={() => setActiveTab("quan-ly-don-hang")}
                        >
                          Xem tất cả đơn
                        </button>
                      </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-x-auto -mx-space-lg lg:-mx-space-xl px-space-lg lg:px-space-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                            <th className="py-space-sm px-space-md rounded-l-lg">
                              Mã đơn
                            </th>
                            <th className="py-space-sm px-space-md">
                              Khách hàng
                            </th>
                            <th className="py-space-sm px-space-md">
                              Món đặt (Tùy chọn)
                            </th>
                            <th className="py-space-sm px-space-md">
                              Tổng tiền
                            </th>
                            <th className="py-space-sm px-space-md">
                              Thanh toán
                            </th>
                            <th className="py-space-sm px-space-md">
                              Trạng thái
                            </th>
                            <th className="py-space-sm px-space-md text-right rounded-r-lg">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container text-body-md text-on-surface">
                          {orders.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="py-12 text-center text-on-surface-variant"
                              >
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <span className="material-symbols-outlined text-4xl text-outline-variant">
                                    receipt_long
                                  </span>
                                  <p className="font-semibold text-primary">
                                    Chưa có đơn hàng nào trong hệ thống
                                  </p>
                                  <p className="text-body-sm text-on-surface-variant">
                                    Khi khách hàng đặt món trên web, đơn hàng sẽ
                                    hiển thị tại đây.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            orders.map((order) => (
                              <tr
                                key={order.id}
                                className="hover:bg-surface-container-low/50 transition-colors"
                              >
                                <td className="py-space-md px-space-md">
                                  <span className="font-title-sm text-title-sm text-primary font-bold">
                                    {order.id}
                                  </span>
                                  <div className="font-body-sm text-body-sm text-on-surface-variant">
                                    {order.time}
                                  </div>
                                </td>
                                <td className="py-space-md px-space-md">
                                  <div className="font-title-sm text-title-sm text-on-surface font-semibold">
                                    {order.customer}
                                  </div>
                                  <div className="font-body-sm text-body-sm text-on-surface-variant">
                                    {order.phone}
                                  </div>
                                </td>
                                <td className="py-space-md px-space-md">
                                  <div className="font-title-sm text-title-sm text-primary font-medium line-clamp-1">
                                    {order.items}
                                  </div>
                                  {order.note && (
                                    <div className="font-body-sm text-body-sm text-on-surface-variant italic">
                                      {order.note}
                                    </div>
                                  )}
                                </td>
                                <td className="py-space-md px-space-md font-title-sm text-title-sm text-primary font-bold whitespace-nowrap">
                                  {order.total}
                                </td>
                                <td className="py-space-md px-space-md font-body-sm text-body-sm text-on-surface">
                                  <span className="inline-flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px] text-tertiary">
                                      account_balance_wallet
                                    </span>
                                    {order.payment}
                                  </span>
                                </td>
                                <td className="py-space-md px-space-md">
                                  <span
                                    className={`inline-flex items-center gap-1 px-space-xs py-1 rounded-full font-label-sm text-label-sm font-semibold ${order.statusColor}`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${order.dotColor}`}
                                    />
                                    {order.statusLabel}
                                  </span>
                                </td>
                                <td className="py-space-md px-space-md text-right">
                                  {order.status === "pending" && (
                                    <button
                                      onClick={() => handleQuickStatus(order)}
                                      className="px-space-sm py-1 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm hover:opacity-90 mr-1 border-0 cursor-pointer shadow-xs"
                                      type="button"
                                    >
                                      Nhận đơn
                                    </button>
                                  )}
                                  {order.status === "preparing" && (
                                    <button
                                      onClick={() => handleQuickStatus(order)}
                                      className="px-space-sm py-1 bg-secondary text-on-secondary rounded-lg font-label-sm text-label-sm hover:opacity-90 mr-1 border-0 cursor-pointer shadow-xs"
                                      type="button"
                                    >
                                      Xong pha
                                    </button>
                                  )}
                                  {order.status === "delivering" && (
                                    <button
                                      onClick={() => handleQuickStatus(order)}
                                      className="px-space-sm py-1 bg-surface-container text-primary rounded-lg font-label-sm text-label-sm hover:bg-surface-container-high mr-1 border-0 cursor-pointer shadow-xs"
                                      type="button"
                                    >
                                      Giao xong
                                    </button>
                                  )}
                                  <button
                                    className="p-1 text-on-surface-variant hover:text-primary rounded-full border-0 bg-transparent cursor-pointer inline-flex items-center align-middle"
                                    type="button"
                                    title="Xem chi tiết"
                                    onClick={() => setActiveTab("quan-ly-don-hang")}
                                  >
                                    <span className="material-symbols-outlined text-[20px]">
                                      arrow_forward
                                    </span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Table Footer */}
                  <div className="pt-space-md mt-space-sm flex flex-col sm:flex-row items-center justify-between text-body-sm text-on-surface-variant gap-space-sm border-t border-surface-container/60">
                    <span>
                      Hiển thị {orders.length} đơn hàng gần đây
                    </span>
                    <div className="flex items-center gap-space-xs">
                      <button
                        className="px-space-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors font-label-sm text-label-sm text-primary font-semibold cursor-pointer"
                        type="button"
                      >
                        Trước
                      </button>
                      <span className="font-label-sm text-label-sm px-2 text-primary font-bold">
                        Trang 1 / 7
                      </span>
                      <button
                        className="px-space-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors font-label-sm text-label-sm text-primary font-semibold cursor-pointer"
                        type="button"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Widgets (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-space-lg">
                  {/* Widget 1: Raw Material Inventory Alert */}
                  <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20">
                    <div className="flex items-center justify-between mb-space-md">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-error text-[20px]">
                          inventory_2
                        </span>
                        <h3 className="font-title-md text-title-md text-primary font-bold">
                          Cảnh Báo Kho Nguyên Liệu
                        </h3>
                      </div>
                      <span className="px-space-xs py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">
                        Khẩn cấp
                      </span>
                    </div>

                    <div className="space-y-space-sm">
                      <div className="p-space-sm bg-surface-container-low rounded-xl flex items-center justify-between border border-outline-variant/30">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-9 h-9 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                            <span className="material-symbols-outlined text-[18px]">
                              coffee
                            </span>
                          </div>
                          <div>
                            <h4 className="font-title-sm text-title-sm text-primary leading-tight font-bold">
                              Hạt Arabica Cầu Đất
                            </h4>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                              Rang vừa (Medium Roast)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-title-sm text-title-sm text-error font-bold block">
                            Còn 4.5 kg
                          </span>
                          <span className="block font-label-sm text-label-sm text-on-surface-variant">
                            Mức tối thiểu: 10kg
                          </span>
                        </div>
                      </div>

                      <div className="p-space-sm bg-surface-container-low rounded-xl flex items-center justify-between border border-outline-variant/30">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-9 h-9 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                            <span className="material-symbols-outlined text-[18px]">
                              water_drop
                            </span>
                          </div>
                          <div>
                            <h4 className="font-title-sm text-title-sm text-primary leading-tight font-bold">
                              Sữa tươi Dalat Milk
                            </h4>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                              Thanh trùng nguyên kem
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-title-sm text-title-sm text-error font-bold block">
                            Còn 12 hộp
                          </span>
                          <span className="block font-label-sm text-label-sm text-on-surface-variant">
                            Đủ pha ca trưa
                          </span>
                        </div>
                      </div>

                      <div className="p-space-sm bg-surface-container-low rounded-xl flex items-center justify-between border border-outline-variant/30">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[18px]">
                              spa
                            </span>
                          </div>
                          <div>
                            <h4 className="font-title-sm text-title-sm text-primary leading-tight font-bold">
                              Cốt Trà Oolong Mộc
                            </h4>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                              Ủ lạnh 16h thủ công
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-title-sm text-title-sm text-on-tertiary-container font-bold block">
                            Còn 2.8 Lít
                          </span>
                          <span className="block font-label-sm text-label-sm text-on-surface-variant">
                            Cần ủ đợt mới
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="w-full mt-space-md py-2.5 rounded-full bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5 font-bold cursor-pointer"
                      type="button"
                      onClick={() =>
                        alert("Đã mở form tạo phiếu nhập kho nguyên liệu")
                      }
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        add_shopping_cart
                      </span>
                      <span>Tạo phiếu nhập kho nguyên liệu</span>
                    </button>
                  </div>

                  {/* Widget 2: Active Shippers Delivery Status */}
                  <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between flex-1 border border-outline-variant/20">
                    <div>
                      <div className="flex items-center justify-between mb-space-sm">
                        <div className="flex items-center gap-space-xs">
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            two_wheeler
                          </span>
                          <h3 className="font-title-md text-title-md text-primary font-bold">
                            Đội Giao Hàng Trực Tiếp
                          </h3>
                        </div>
                        <span className="flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold">
                          <span className="w-2 h-2 rounded-full bg-secondary" />{" "}
                          4 đang online
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                        Bán kính giao hàng: 5.0km quanh Flagship Store
                      </p>

                      <div className="space-y-space-xs">
                        <div className="flex items-center justify-between py-1.5 border-b border-surface-container/50">
                          <div className="flex items-center gap-space-xs">
                            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                              account_circle
                            </span>
                            <span className="font-title-sm text-title-sm text-primary font-semibold">
                              Lê Văn Hùng (GrabExpress)
                            </span>
                          </div>
                          <span className="font-body-sm text-body-sm text-secondary font-semibold">
                            Giao đơn #VB-9819 (1.2km)
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-surface-container/50">
                          <div className="flex items-center gap-space-xs">
                            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                              account_circle
                            </span>
                            <span className="font-title-sm text-title-sm text-primary font-semibold">
                              Trần Đình Bảo (Ahamove)
                            </span>
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Đang nhận hàng tại quầy
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-space-xs">
                            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                              account_circle
                            </span>
                            <span className="font-title-sm text-title-sm text-primary font-semibold">
                              Ngô Tuấn Kiệt (In-house)
                            </span>
                          </div>
                          <span className="font-body-sm text-body-sm text-secondary font-semibold">
                            Sẵn sàng điều phối
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-space-md pt-space-xs">
                      <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-secondary h-full rounded-full"
                          style={{ width: "78%" }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1.5 text-label-sm text-label-sm text-on-surface-variant">
                        <span>
                          Tốc độ giao trung bình: <strong>16 phút/đơn</strong>
                        </span>
                        <span className="text-secondary font-bold">
                          Mục tiêu: ≤ 20 phút
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Banner */}
              <div className="bg-gradient-to-r from-primary-container via-tertiary-container to-primary-container text-white rounded-xl p-space-xl shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-space-lg mb-space-lg">
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-on-tertiary-container/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-white/10 backdrop-blur-md text-tertiary-fixed font-label-sm text-label-sm font-semibold mb-space-sm">
                    <span className="material-symbols-outlined text-[16px]">
                      verified
                    </span>
                    <span>
                      Chiến dịch Mùa Hè 2026: &ldquo;Velvet Summer
                      Blossom&rdquo;
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-white font-bold leading-tight">
                    Tối ưu thực đơn theo xu hướng thức uống thủ công
                  </h2>
                  <p className="font-body-md text-body-md text-white/80 mt-space-2xs">
                    Dòng sản phẩm Cold Brew Cam Vàng và Trà Sữa Oolong Sương Sáo
                    đang chiếm hơn 45% lượng đặt trên ứng dụng. Cân nhắc bổ sung
                    thêm size Lớn (L) để gia tăng doanh thu trên mỗi đơn hàng.
                  </p>
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-space-sm shrink-0">
                  <button
                    className="px-space-xl py-space-sm bg-on-tertiary-container text-white rounded-full font-label-md text-label-md hover:opacity-90 shadow-md transition-all font-bold cursor-pointer"
                    type="button"
                    onClick={() => alert("Mở cấu hình Combo Khuyến Mãi")}
                  >
                    Thiết lập Combo Khuyến Mãi
                  </button>
                  <button
                    className="px-space-lg py-space-sm bg-white/15 hover:bg-white/20 text-white rounded-full font-label-md text-label-md backdrop-blur-md transition-all font-bold cursor-pointer"
                    type="button"
                    onClick={() => alert("Đang tải báo cáo món bán chạy nhất")}
                  >
                    Xem báo cáo món bán chạy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB QUẢN LÝ KHÁCH HÀNG ===================== */}
          {activeTab === "khach-hang" && (
            <CustomerManagementTab user={user} />
          )}

          {/* ===================== TAB QUẢN LÝ ĐƠN HÀNG ===================== */}
          {activeTab === "quan-ly-don-hang" && (
            <OrderManagementTab
              orders={orders}
              orderFilter={orderFilter}
              setOrderFilter={setOrderFilter}
              orderSearch={orderSearch}
              setOrderSearch={setOrderSearch}
              handleQuickStatus={handleQuickStatus}
              setActiveTab={setActiveTab}
            />
          )}

          {/* ===================== TAB QUẢN LÝ SẢN PHẨM ===================== */}
          {activeTab === "quan-ly-san-pham" && (
            <div className="flex flex-col w-full">
              {/* Page Header & Metrics Section */}
              <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg mb-space-xl">
                <div className="flex flex-col gap-space-2xs">
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-widest">
                    <span>Kho Dữ Liệu Thực Đơn</span>
                    <span>•</span>
                    <span className="text-tertiary font-bold">
                      Menu Engineering v2.4
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                    Quản Lý Danh Mục &amp; Sản Phẩm
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                    Hệ thống kiểm soát chất lượng, định vị giá niêm yết, công
                    thức pha chế và tính sẵn sàng của thực đơn Velvet &amp; Brew
                    toàn hệ thống.
                  </p>
                </div>
                {/* Quick Actions Bar */}
                <div className="flex flex-wrap items-center gap-space-sm">
                  <button
                    className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface hover:bg-surface-variant transition-all shadow-sm font-label-md text-label-md border-0 cursor-pointer"
                    type="button"
                    onClick={() =>
                      alert("Chức năng nhập từ file Excel (.xlsx)")
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      file_upload
                    </span>
                    <span>Nhập File Excel</span>
                  </button>
                  <button
                    className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface hover:bg-surface-variant transition-all shadow-sm font-label-md text-label-md border-0 cursor-pointer"
                    type="button"
                    onClick={() => alert("Đang xuất danh sách sản phẩm...")}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      download
                    </span>
                    <span>Xuất Danh Sách</span>
                  </button>
                  <button
                    className="flex items-center gap-space-xs px-space-lg py-space-xs rounded-full bg-primary-container text-on-primary hover:bg-primary transition-all shadow-md hover:shadow-lg font-label-lg text-label-lg active:scale-95 border-0 cursor-pointer font-bold"
                    onClick={handleOpenNewProduct}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      add
                    </span>
                    <span>+ Thêm Sản Phẩm Mới</span>
                  </button>
                </div>
              </section>

              {/* Metric Summary KPI Cards (Bento Ribbon) */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-xl">
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-outline-variant/20">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Tổng sản phẩm
                    </span>
                    <span className="font-headline-md text-headline-md text-primary mt-space-2xs font-bold">
                      {productsList.length}{" "}
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                        món
                      </span>
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[24px]">
                      coffee
                    </span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-outline-variant/20">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Đang phục vụ
                    </span>
                    <div className="flex items-baseline gap-space-xs mt-space-2xs">
                      <span className="font-headline-md text-headline-md text-secondary font-bold">
                        {productsList.filter((p) => p.isActive).length}
                      </span>
                      <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
                        {(
                          (productsList.filter((p) => p.isActive).length /
                            (productsList.length || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-secondary-container/40 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[24px]">
                      check_circle
                    </span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-outline-variant/20">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Tạm ngưng / Hết kho
                    </span>
                    <div className="flex items-baseline gap-space-xs mt-space-2xs">
                      <span className="font-headline-md text-headline-md text-error font-bold">
                        {productsList
                          .filter((p) => !p.isActive)
                          .length.toString()
                          .padStart(2, "0")}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                        cần nhập vị
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-error-container/60 flex items-center justify-center text-error">
                    <span className="material-symbols-outlined text-[24px]">
                      pause_circle
                    </span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-outline-variant/20">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Phân nhóm thực đơn
                    </span>
                    <span className="font-headline-md text-headline-md text-primary mt-space-2xs font-bold">
                      {new Set(productsList.map((p) => p.category)).size
                        .toString()
                        .padStart(2, "0")}{" "}
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                        category
                      </span>
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[24px]">
                      category
                    </span>
                  </div>
                </div>
              </section>

              {/* Control & Filter Deck */}
              <section className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm mb-space-lg flex flex-col gap-space-md border border-outline-variant/20">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
                  <div className="relative flex-1 max-w-xl">
                    <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                      search
                    </span>
                    <input
                      className="w-full pl-11 pr-space-md py-space-xs bg-surface-container-low text-on-surface placeholder:text-on-surface-variant rounded-full font-body-md text-body-md outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#3e2723]"
                      placeholder="Tìm theo tên đồ uống, mã SKU hoặc thành phần..."
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-space-sm">
                    <div className="flex items-center gap-space-xs bg-surface-container-low px-space-md py-space-xs rounded-full">
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                        tune
                      </span>
                      <select
                        className="bg-transparent font-label-md text-label-md text-on-surface outline-none cursor-pointer pr-space-xs border-0"
                        value={productStatusFilter}
                        onChange={(e) => setProductStatusFilter(e.target.value)}
                      >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang kinh doanh</option>
                        <option value="paused">Tạm ngưng phục vụ</option>
                        <option value="out_of_stock">
                          Cháy hàng / Thiếu nguyên liệu
                        </option>
                      </select>
                    </div>
                    <div className="flex items-center gap-space-xs bg-surface-container-low px-space-md py-space-xs rounded-full">
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                        swap_vert
                      </span>
                      <select
                        className="bg-transparent font-label-md text-label-md text-on-surface outline-none cursor-pointer pr-space-xs border-0"
                        value={productSort}
                        onChange={(e) => setProductSort(e.target.value)}
                      >
                        <option value="latest">Mới cập nhật nhất</option>
                        <option value="bestseller">
                          Bán chạy nhất (Top volume)
                        </option>
                        <option value="price_asc">Giá tăng dần</option>
                        <option value="price_desc">Giá giảm dần</option>
                      </select>
                    </div>
                    <button
                      className="p-space-xs rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant transition-colors border-0 cursor-pointer"
                      title="Làm mới bộ lọc"
                      type="button"
                      onClick={() => {
                        setProductSearch("");
                        setProductCategoryFilter("all");
                        setProductStatusFilter("");
                        setProductSort("latest");
                      }}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        refresh
                      </span>
                    </button>
                  </div>
                </div>

                {/* Category Pills Tabs */}
                <div className="flex items-center gap-space-xs overflow-x-auto pb-space-2xs">
                  {[
                    { id: "all", label: `Tất cả (${productsList.length})` },
                    {
                      id: "coffee",
                      label: `☕ Cà phê Specialty (${productsList.filter((p) => p.category === "coffee").length})`,
                    },
                    {
                      id: "milktea",
                      label: `🍃 Trà sữa & Trà nướng (${productsList.filter((p) => p.category === "milktea").length})`,
                    },
                    {
                      id: "fruittea",
                      label: `🍹 Trà trái cây nhiệt đới (${productsList.filter((p) => p.category === "fruittea").length})`,
                    },
                    {
                      id: "special",
                      label: `❄️ Đá xay Velvet Frost (${productsList.filter((p) => p.category === "special").length})`,
                    },
                    {
                      id: "toppings",
                      label: `🧋 Topping thủ công (${productsList.filter((p) => p.category === "toppings").length})`,
                    },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setProductCategoryFilter(cat.id)}
                      className={`px-space-md py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors border-0 cursor-pointer ${productCategoryFilter === cat.id
                        ? "bg-primary-container text-on-primary shadow-sm"
                        : "bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant"
                        }`}
                      type="button"
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Products Data Table Section */}
              <section className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden mb-space-xl border border-outline-variant/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                        <th className="py-space-md pl-space-lg pr-space-xs w-12 text-center">
                          <input
                            className="w-4 h-4 rounded accent-primary cursor-pointer"
                            type="checkbox"
                          />
                        </th>
                        <th className="py-space-md px-space-sm min-w-[280px]">
                          Sản phẩm &amp; Mã SKU
                        </th>
                        <th className="py-space-md px-space-sm">Phân Loại</th>
                        <th className="py-space-md px-space-sm">
                          Giá Bán / Khuyến Mãi
                        </th>
                        <th className="py-space-md px-space-sm text-center">
                          Đã Bán
                        </th>
                        <th className="py-space-md px-space-sm">
                          Nguyên Liệu / Kho
                        </th>
                        <th className="py-space-md px-space-sm text-center">
                          Trạng Thái
                        </th>
                        <th className="py-space-md pr-space-lg pl-space-sm text-right">
                          Thao Tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-0">
                      {productsList
                        .filter((p) => {
                          if (
                            productCategoryFilter !== "all" &&
                            p.category !== productCategoryFilter
                          )
                            return false;
                          if (productStatusFilter === "active" && !p.isActive)
                            return false;
                          if (productStatusFilter === "paused" && p.isActive)
                            return false;
                          if (
                            productStatusFilter === "out_of_stock" &&
                            p.materialPercent > 0
                          )
                            return false;
                          if (productSearch.trim()) {
                            const q = productSearch.trim().toLowerCase();
                            return (
                              p.name.toLowerCase().includes(q) ||
                              p.sku.toLowerCase().includes(q) ||
                              (p.description &&
                                p.description.toLowerCase().includes(q))
                            );
                          }
                          return true;
                        })
                        .sort((a, b) => {
                          if (productSort === "price_asc") {
                            const pA =
                              Number(String(a.price).replace(/[^\d]/g, "")) ||
                              0;
                            const pB =
                              Number(String(b.price).replace(/[^\d]/g, "")) ||
                              0;
                            return pA - pB;
                          }
                          if (productSort === "price_desc") {
                            const pA =
                              Number(String(a.price).replace(/[^\d]/g, "")) ||
                              0;
                            const pB =
                              Number(String(b.price).replace(/[^\d]/g, "")) ||
                              0;
                            return pB - pA;
                          }
                          if (productSort === "bestseller") {
                            const sA =
                              Number(
                                String(a.soldCount).replace(/[^\d]/g, ""),
                              ) || 0;
                            const sB =
                              Number(
                                String(b.soldCount).replace(/[^\d]/g, ""),
                              ) || 0;
                            return sB - sA;
                          }
                          return 0;
                        })
                        .map((product) => (
                          <tr
                            key={product.id}
                            className={`hover:bg-surface-container-low/60 transition-colors group ${!product.isActive
                              ? "bg-surface-container-low/30"
                              : ""
                              }`}
                          >
                            <td className="py-space-md pl-space-lg pr-space-xs text-center">
                              <input
                                className="w-4 h-4 rounded accent-primary cursor-pointer"
                                type="checkbox"
                              />
                            </td>
                            <td className="py-space-md px-space-sm">
                              <div className="flex items-center gap-space-sm">
                                <img
                                  className={`w-14 h-14 rounded-xl object-cover bg-surface-container-high shadow-sm ${!product.isActive ? "opacity-70" : ""
                                    }`}
                                  src={product.image}
                                  alt={product.name}
                                />
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-space-xs">
                                    <span
                                      className={`font-title-md text-title-md text-primary font-headline-sm group-hover:text-tertiary transition-colors truncate ${!product.isActive
                                        ? "line-through text-on-surface-variant"
                                        : ""
                                        }`}
                                    >
                                      {product.name}
                                    </span>
                                    {product.tag && (
                                      <span
                                        className={`px-1.5 py-0.5 rounded-full font-label-sm text-[10px] uppercase font-bold ${product.tagColor ||
                                          "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                                          }`}
                                      >
                                        {product.tag}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-space-xs mt-space-2xs">
                                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                                      SKU: {product.sku}
                                    </span>
                                    <span className="text-outline-variant">
                                      •
                                    </span>
                                    <span
                                      className={`font-body-sm text-body-sm ${!product.isActive
                                        ? "text-error font-medium"
                                        : "text-on-surface-variant"
                                        }`}
                                    >
                                      {typeof product.sizes === "string"
                                        ? product.sizes
                                        : Array.isArray(product.sizes)
                                          ? product.sizes
                                            .map((s) =>
                                              typeof s === "object"
                                                ? s.name
                                                : String(s),
                                            )
                                            .filter(Boolean)
                                            .join(", ")
                                          : "Size: M, L"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-space-md px-space-sm">
                              <span className="px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm whitespace-nowrap">
                                {product.categoryName}
                              </span>
                            </td>
                            <td className="py-space-md px-space-sm">
                              <div className="flex flex-col">
                                <span className="font-title-md text-title-md text-primary font-bold">
                                  {product.price}
                                </span>
                                {product.oldPrice && (
                                  <span className="font-body-sm text-body-sm text-on-surface-variant line-through">
                                    {product.oldPrice}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-space-md px-space-sm text-center">
                              <div className="inline-flex flex-col items-center">
                                <span className="font-title-sm text-title-sm text-primary font-bold">
                                  {product.soldCount}
                                </span>
                                <span className="font-label-sm text-[11px] text-secondary font-medium">
                                  {product.soldTrend}
                                </span>
                              </div>
                            </td>
                            <td className="py-space-md px-space-sm">
                              <div className="flex flex-col gap-1 w-32">
                                <div className="flex justify-between font-label-sm text-label-sm">
                                  <span className="text-on-surface">
                                    {product.materialName}
                                  </span>
                                  <span
                                    className={`font-bold ${product.materialPercent === 0
                                      ? "text-error"
                                      : product.materialPercent < 40
                                        ? "text-tertiary"
                                        : "text-secondary"
                                      }`}
                                  >
                                    {product.materialStatus}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${product.materialPercent === 0
                                      ? "bg-error"
                                      : product.materialPercent < 40
                                        ? "bg-tertiary"
                                        : "bg-secondary"
                                      }`}
                                    style={{
                                      width: `${product.materialPercent}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-space-md px-space-sm text-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={product.isActive}
                                  onChange={() =>
                                    handleToggleProductActive(product.id)
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
                              </label>
                            </td>
                            <td className="py-space-md pr-space-lg pl-space-sm text-right">
                              <div className="flex items-center justify-end gap-space-2xs">
                                <button
                                  className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors border-0 bg-transparent cursor-pointer"
                                  title="Xem công thức &amp; chi tiết"
                                  type="button"
                                  onClick={() => handleOpenEditProduct(product)}
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    visibility
                                  </span>
                                </button>
                                <button
                                  className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors border-0 bg-transparent cursor-pointer"
                                  title="Chỉnh sửa"
                                  type="button"
                                  onClick={() => handleOpenEditProduct(product)}
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    edit
                                  </span>
                                </button>
                                <button
                                  className="p-1.5 rounded-lg hover:bg-error-container text-error transition-colors border-0 bg-transparent cursor-pointer"
                                  title="Xóa món"
                                  type="button"
                                  onClick={() =>
                                    handleDeleteProduct(product.id)
                                  }
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    delete
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Deck */}
                <div className="px-space-lg py-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-md">
                  <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    <span>Hiển thị</span>
                    <span className="font-bold text-primary">
                      1 - {productsList.length}
                    </span>
                    <span>trong</span>
                    <span className="font-bold text-primary">
                      {productsList.length}
                    </span>
                    <span>sản phẩm trên toàn bộ chi nhánh</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <button
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface-variant opacity-40 cursor-not-allowed border-0"
                      disabled
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        chevron_left
                      </span>
                    </button>
                    <button
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-bold shadow-sm border-0"
                      type="button"
                    >
                      1
                    </button>
                    <button
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors border-0 cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Visual Dialog / Drawer: "Thêm / Chỉnh Sửa Sản Phẩm" */}
              {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md sm:p-space-xl bg-primary/40 backdrop-blur-sm transition-opacity">
                  <div className="relative w-full max-w-4xl max-h-[942px] bg-surface-container-lowest rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Modal Header */}
                    <div className="px-space-xl py-space-lg bg-surface-container-low flex items-center justify-between border-b border-surface-container">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary font-bold">
                          Thao Tác Thực Đơn
                        </span>
                        <h2 className="font-headline-md text-headline-md text-primary font-headline-md">
                          {editingProduct
                            ? "Chỉnh Sửa Sản Phẩm"
                            : "Thêm Sản Phẩm Mới"}
                        </h2>
                      </div>
                      <button
                        className="w-10 h-10 rounded-full hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors border-0 bg-transparent cursor-pointer"
                        onClick={() => setIsProductModalOpen(false)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[24px]">
                          close
                        </span>
                      </button>
                    </div>

                    {/* Modal Body */}
                    <form
                      onSubmit={handleSaveProduct}
                      className="flex flex-col flex-1 overflow-hidden"
                    >
                      <div className="p-space-xl overflow-y-auto space-y-space-lg flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-lg">
                          {/* Left Column: Image Upload & switches */}
                          <div className="md:col-span-4 flex flex-col gap-space-md">
                            <label className="font-label-md text-label-md text-primary">
                              Ảnh đại diện sản phẩm
                            </label>
                            <div className="group relative w-full aspect-square rounded-2xl bg-surface-container-low hover:bg-surface-container flex flex-col items-center justify-center p-space-md text-center transition-all cursor-pointer shadow-inner overflow-hidden">
                              {productFormData.image ? (
                                <img
                                  src={productFormData.image}
                                  alt="Preview"
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                <>
                                  <div className="w-14 h-14 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-tertiary mb-space-xs group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-[28px]">
                                      add_a_photo
                                    </span>
                                  </div>
                                  <span className="font-label-md text-label-md text-primary font-bold">
                                    Kéo thả ảnh hoặc click tải lên
                                  </span>
                                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                                    Định dạng PNG, JPG, WEBP (tối đa 4MB)
                                  </span>
                                </>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="Hoặc dán URL ảnh tại đây..."
                              className="w-full px-space-sm py-1.5 bg-surface-container-low text-on-surface rounded-xl font-body-sm text-body-sm outline-none border border-outline-variant/30"
                              value={productFormData.image}
                              onChange={(e) =>
                                setProductFormData({
                                  ...productFormData,
                                  image: e.target.value,
                                })
                              }
                            />

                            {/* Promotion Switches */}
                            <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-sm">
                              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">
                                Huy hiệu tiếp thị
                              </span>
                              <div className="flex items-center justify-between">
                                <span className="font-body-md text-body-md text-on-surface">
                                  Món bán chạy (Best Seller)
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={productFormData.isBestSeller}
                                    onChange={(e) =>
                                      setProductFormData({
                                        ...productFormData,
                                        isBestSeller: e.target.checked,
                                      })
                                    }
                                    className="sr-only peer"
                                  />
                                  <div className="w-10 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary" />
                                </label>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-body-md text-body-md text-on-surface">
                                  Gắn nhãn "Món Mới"
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={productFormData.isNew}
                                    onChange={(e) =>
                                      setProductFormData({
                                        ...productFormData,
                                        isNew: e.target.checked,
                                      })
                                    }
                                    className="sr-only peer"
                                  />
                                  <div className="w-10 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary" />
                                </label>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-body-md text-body-md text-on-surface">
                                  Kích hoạt trên Web / App
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={productFormData.isActive}
                                    onChange={(e) =>
                                      setProductFormData({
                                        ...productFormData,
                                        isActive: e.target.checked,
                                      })
                                    }
                                    className="sr-only peer"
                                  />
                                  <div className="w-10 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary" />
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Details & Pricing */}
                          <div className="md:col-span-8 flex flex-col gap-space-md">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                              <div className="flex flex-col gap-space-2xs">
                                <label className="font-label-md text-label-md text-primary">
                                  Tên sản phẩm *
                                </label>
                                <input
                                  className="w-full px-space-md py-space-xs bg-surface-container-low text-on-surface rounded-xl font-body-md text-body-md outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#3e2723] border border-outline-variant/30"
                                  type="text"
                                  value={productFormData.name}
                                  onChange={(e) =>
                                    setProductFormData({
                                      ...productFormData,
                                      name: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                              <div className="flex flex-col gap-space-2xs">
                                <label className="font-label-md text-label-md text-primary">
                                  Mã SKU *
                                </label>
                                <input
                                  className="w-full px-space-md py-space-xs bg-surface-container-low text-on-surface rounded-xl font-body-md text-body-md outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#3e2723] border border-outline-variant/30"
                                  type="text"
                                  value={productFormData.sku}
                                  onChange={(e) =>
                                    setProductFormData({
                                      ...productFormData,
                                      sku: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                              <div className="flex flex-col gap-space-2xs">
                                <label className="font-label-md text-label-md text-primary">
                                  Nhóm danh mục *
                                </label>
                                <select
                                  className="w-full px-space-md py-space-xs bg-surface-container-low text-on-surface rounded-xl font-body-md text-body-md outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#3e2723] border border-outline-variant/30"
                                  value={productFormData.category}
                                  onChange={(e) =>
                                    setProductFormData({
                                      ...productFormData,
                                      category: e.target.value,
                                    })
                                  }
                                >
                                  <option>Cà phê Specialty</option>
                                  <option>Trà sữa &amp; Trà nướng</option>
                                  <option>Trà trái cây nhiệt đới</option>
                                  <option>Đá xay Velvet Frost</option>
                                  <option>Topping thủ công</option>
                                </select>
                              </div>
                              <div className="flex flex-col gap-space-2xs">
                                <label className="font-label-md text-label-md text-primary">
                                  Thời gian pha chế chuẩn
                                </label>
                                <div className="relative">
                                  <input
                                    className="w-full px-space-md py-space-xs bg-surface-container-low text-on-surface rounded-xl font-body-md text-body-md outline-none border border-outline-variant/30"
                                    type="text"
                                    value={productFormData.prepTime}
                                    onChange={(e) =>
                                      setProductFormData({
                                        ...productFormData,
                                        prepTime: e.target.value,
                                      })
                                    }
                                  />
                                  <span className="material-symbols-outlined absolute right-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                                    timer
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Pricing Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm p-space-md bg-surface-container-low rounded-2xl">
                              <div className="flex flex-col gap-space-2xs">
                                <label className="font-label-sm text-label-sm text-on-surface-variant">
                                  Giá niêm yết (VNĐ) *
                                </label>
                                <input
                                  className="w-full px-space-sm py-space-xs bg-surface-container-lowest text-primary font-bold rounded-lg font-body-md text-body-md outline-none border border-outline-variant/30"
                                  type="text"
                                  value={productFormData.price}
                                  onChange={(e) =>
                                    setProductFormData({
                                      ...productFormData,
                                      price: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                              <div className="flex flex-col gap-space-2xs">
                                <label className="font-label-sm text-label-sm text-on-surface-variant">
                                  Giá khuyến mãi (VNĐ)
                                </label>
                                <input
                                  className="w-full px-space-sm py-space-xs bg-surface-container-lowest text-secondary font-bold rounded-lg font-body-md text-body-md outline-none border border-outline-variant/30"
                                  type="text"
                                  value={productFormData.salePrice}
                                  onChange={(e) =>
                                    setProductFormData({
                                      ...productFormData,
                                      salePrice: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex flex-col gap-space-2xs">
                                <label className="font-label-sm text-label-sm text-on-surface-variant">
                                  Giá vốn Recipe (COGS)
                                </label>
                                <input
                                  className="w-full px-space-sm py-space-xs bg-surface-container-lowest text-on-surface-variant rounded-lg font-body-md text-body-md outline-none border border-outline-variant/30"
                                  type="text"
                                  value={productFormData.cogs}
                                  onChange={(e) =>
                                    setProductFormData({
                                      ...productFormData,
                                      cogs: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>

                            {/* Taste Profile Description */}
                            <div className="flex flex-col gap-space-2xs">
                              <label className="font-label-md text-label-md text-primary">
                                Mô tả hương vị &amp; Cảm hứng sản phẩm
                              </label>
                              <textarea
                                className="w-full px-space-md py-space-xs bg-surface-container-low text-on-surface rounded-xl font-body-md text-body-md outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#3e2723] border border-outline-variant/30"
                                rows="3"
                                value={productFormData.description}
                                onChange={(e) =>
                                  setProductFormData({
                                    ...productFormData,
                                    description: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* Modifiers: Sizes and Toppings */}
                        <div className="bg-surface-container-low/50 p-space-lg rounded-2xl flex flex-col gap-space-md border border-outline-variant/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-space-xs">
                              <span className="material-symbols-outlined text-tertiary text-[22px]">
                                tune
                              </span>
                              <span className="font-title-md text-title-md text-primary font-headline-sm">
                                Cấu Hình Định Lượng &amp; Tùy Biến (Modifiers)
                              </span>
                            </div>
                            <span className="font-label-sm text-label-sm text-secondary bg-secondary-container px-space-sm py-0.5 rounded-full font-bold">
                              Đã đồng bộ App Khách
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
                            <div className="p-space-sm bg-surface-container-lowest rounded-xl flex items-center justify-between shadow-sm border border-outline-variant/20">
                              <div className="flex items-center gap-space-xs">
                                <input
                                  type="checkbox"
                                  checked={productFormData.sizeS}
                                  onChange={(e) =>
                                    setProductFormData({
                                      ...productFormData,
                                      sizeS: e.target.checked,
                                    })
                                  }
                                  className="accent-primary w-4 h-4 cursor-pointer"
                                />
                                <span className="font-label-md text-label-md text-on-surface">
                                  Size Nhỏ (S)
                                </span>
                              </div>
                              <span className="font-label-sm text-label-sm text-on-surface-variant">
                                -5.000 đ
                              </span>
                            </div>
                            <div className="p-space-sm bg-surface-container-lowest rounded-xl flex items-center justify-between shadow-sm border border-outline-variant/20">
                              <div className="flex items-center gap-space-xs">
                                <input
                                  type="checkbox"
                                  checked={productFormData.sizeM}
                                  onChange={(e) =>
                                    setProductFormData({
                                      ...productFormData,
                                      sizeM: e.target.checked,
                                    })
                                  }
                                  className="accent-primary w-4 h-4 cursor-pointer"
                                />
                                <span className="font-label-md text-label-md text-on-surface font-bold">
                                  Size Vừa (M)
                                </span>
                              </div>
                              <span className="font-label-sm text-label-sm text-secondary font-bold">
                                Giá Gốc
                              </span>
                            </div>
                            <div className="p-space-sm bg-surface-container-lowest rounded-xl flex items-center justify-between shadow-sm border border-outline-variant/20">
                              <div className="flex items-center gap-space-xs">
                                <input
                                  type="checkbox"
                                  checked={productFormData.sizeL}
                                  onChange={(e) =>
                                    setProductFormData({
                                      ...productFormData,
                                      sizeL: e.target.checked,
                                    })
                                  }
                                  className="accent-primary w-4 h-4 cursor-pointer"
                                />
                                <span className="font-label-md text-label-md text-on-surface">
                                  Size Lớn (L)
                                </span>
                              </div>
                              <span className="font-label-sm text-label-sm text-tertiary font-bold">
                                +10.000 đ
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-space-2xs">
                            <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                              Topping đề xuất đi kèm
                            </label>
                            <div className="flex flex-wrap gap-space-xs">
                              {productFormData.toppings.map((top, idx) => (
                                <span
                                  key={idx}
                                  className="px-space-md py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm flex items-center gap-1"
                                >
                                  + {top}
                                  <span
                                    className="material-symbols-outlined text-[14px] cursor-pointer"
                                    onClick={() =>
                                      setProductFormData({
                                        ...productFormData,
                                        toppings:
                                          productFormData.toppings.filter(
                                            (_, i) => i !== idx,
                                          ),
                                      })
                                    }
                                  >
                                    close
                                  </span>
                                </span>
                              ))}
                              <button
                                className="px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm hover:text-primary border-0 cursor-pointer"
                                type="button"
                                onClick={() => {
                                  const name = prompt(
                                    "Nhập tên Topping kèm giá (VD: Thạch Nha Đam (+10k)):",
                                  );
                                  if (name && name.trim()) {
                                    setProductFormData({
                                      ...productFormData,
                                      toppings: [
                                        ...productFormData.toppings,
                                        name.trim(),
                                      ],
                                    });
                                  }
                                }}
                              >
                                + Gán thêm
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="px-space-xl py-space-md bg-surface-container-low flex items-center justify-between border-t border-surface-container">
                        <button
                          className="font-label-md text-label-md text-error hover:underline flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                          type="button"
                          onClick={() => alert("Chưa có lịch sử thay đổi giá.")}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            history
                          </span>
                          <span>Xem lịch sử chỉnh sửa giá</span>
                        </button>
                        <div className="flex items-center gap-space-sm">
                          <button
                            className="px-space-lg py-space-xs rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-high font-label-lg text-label-lg transition-colors border-0 cursor-pointer"
                            onClick={() => setIsProductModalOpen(false)}
                            type="button"
                          >
                            Hủy Bỏ
                          </button>
                          <button
                            className="px-space-xl py-space-xs rounded-full bg-primary-container text-on-primary hover:bg-primary font-label-lg text-label-lg shadow-md hover:shadow-lg transition-all active:scale-95 border-0 cursor-pointer font-bold"
                            type="submit"
                          >
                            Lưu Sản Phẩm &amp; Xuất Bản
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-views if user clicks other sidebar tabs (Khuyến mãi, Nhân viên, Cài đặt) */}
          {activeTab !== "dashboard" &&
            activeTab !== "khach-hang" &&
            activeTab !== "quan-ly-don-hang" &&
            activeTab !== "quan-ly-san-pham" && (
              <div className="bg-surface-container-lowest p-space-2xl rounded-2xl shadow-sm border border-outline-variant/30 text-center py-16">
                <span className="material-symbols-outlined text-[48px] text-primary mb-3">
                  {navItems.find((n) => n.id === activeTab)?.icon || "layers"}
                </span>
                <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                  {navItems.find((n) => n.id === activeTab)?.label}
                </h2>
                <p className="text-on-surface-variant max-w-md mx-auto mt-2 font-body-md">
                  Phân hệ {navItems.find((n) => n.id === activeTab)?.label} đang
                  được đồng bộ dữ liệu trực tiếp từ cửa hàng Flagship Velvet
                  &amp; Brew.
                </p>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="mt-6 px-space-xl py-2.5 bg-primary-container text-white font-label-md text-label-md rounded-full hover:bg-primary transition-all cursor-pointer font-bold shadow-sm border-0"
                  type="button"
                >
                  ← Quay lại Tổng quan Dashboard
                </button>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
