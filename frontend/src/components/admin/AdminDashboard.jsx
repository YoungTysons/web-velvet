import { useState, useEffect } from "react";
import logoIcon from "../../assets/logo-icon.png";
import adminApi from "../../api/adminApi";

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
  });
  const [menuStats, setMenuStats] = useState({
    activeCount: 0,
    totalCount: 0,
    inactiveCount: 0,
  });
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  // Gọi API lấy doanh thu, người dùng và thực đơn mỗi khi thay đổi kỳ thời gian
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoadingRevenue(true);
        const [revRes, userRes, menuRes] = await Promise.all([
          adminApi.getRevenueStats({
            period: period === "custom" ? "all" : period,
          }),
          adminApi.getUsers({
            period: period === "custom" ? "all" : period,
          }),
          adminApi.getMenuStats(),
        ]);

        if (revRes && revRes.success && revRes.data) {
          setRevenueData(revRes.data);
        }
        if (userRes && userRes.success && userRes.data) {
          setUserData(userRes.data);
        }
        if (menuRes && menuRes.success) {
          const mData = menuRes.data || {};
          setMenuStats({
            activeCount: mData.activeCount ?? menuRes.menuCount ?? 0,
            totalCount: mData.totalCount ?? menuRes.menuCount ?? 0,
            inactiveCount: mData.inactiveCount ?? 0,
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải thống kê dashboard:", error);
      } finally {
        setLoadingRevenue(false);
      }
    };

    fetchDashboardStats();
  }, [period]);

  // Dữ liệu đơn hàng gần đây
  const [orders, setOrders] = useState([
    {
      id: "#VB-9821",
      time: "09:28 sáng",
      customer: "Hoàng Minh Trí",
      phone: "0903 ••• 882",
      items: "2x Trà Sữa Oolong Nướng L",
      note: "50% Đường, 70% Đá, Trân châu hoàng kim",
      total: "128.000 đ",
      payment: "VietQR",
      status: "pending",
      statusLabel: "Chờ xác nhận",
      statusColor: "bg-tertiary-fixed text-on-tertiary-fixed",
      dotColor: "bg-on-tertiary-container",
    },
    {
      id: "#VB-9820",
      time: "09:22 sáng",
      customer: "Nguyễn Thảo My",
      phone: "0978 ••• 314",
      items: "1x Cà Phê Muối Cố Đô (Size M)",
      note: "Ít ngọt, Kem béo mặn đặc trưng",
      total: "52.000 đ",
      payment: "Thẻ POS",
      status: "preparing",
      statusLabel: "Đang pha chế",
      statusColor: "bg-surface-container-highest text-on-surface",
      dotColor: "bg-primary-container animate-pulse",
    },
    {
      id: "#VB-9819",
      time: "09:14 sáng",
      customer: "Vũ Quốc Cường",
      phone: "0912 ••• 449",
      items: "3x Cold Brew Cam Vàng Rosemary",
      note: "Không đường, Đá riêng",
      total: "195.000 đ",
      payment: "COD",
      status: "delivering",
      statusLabel: "Đang giao hàng",
      statusColor: "bg-secondary-fixed text-on-secondary-fixed",
      dotColor: "bg-secondary",
    },
    {
      id: "#VB-9818",
      time: "09:05 sáng",
      customer: "Lê Quỳnh Trâm",
      phone: "0935 ••• 102",
      items: "1x Matcha Latte Yến Mạch + 1x Croissant",
      note: "Sữa Oatly, Ít đá, Hâm nóng bánh",
      total: "115.000 đ",
      payment: "VietQR",
      status: "completed",
      statusLabel: "Hoàn thành",
      statusColor: "bg-secondary-container text-on-secondary-container",
      dotColor: "bg-secondary",
    },
  ]);

  // Cập nhật trạng thái đơn hàng khi bấm nút thao tác
  const handleUpdateStatus = (orderId, newStatus, newLabel, newColor, newDot) => {
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
          : o
      )
    );
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    {
      id: "quan-ly-don-hang",
      label: "Quản lý Đơn hàng",
      icon: "receipt_long",
      badge: "12",
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left border-0 cursor-pointer ${
                    isActive
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
                      className={`px-space-xs py-0.5 rounded-full font-label-sm text-label-sm ${
                        isActive
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
                <span className="material-symbols-outlined text-[18px]">add</span>
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
                  {user?.role === "ADMIN" ? "Quản trị viên cấp cao" : "Quản lý cửa hàng"}
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
                      28 đơn hàng mới
                    </strong>{" "}
                    cần chuẩn bị và điều phối giao tức thì.
                  </p>
                </div>

                {/* Quick Action Toolbars */}
                <div className="flex flex-wrap items-center gap-space-xs">
                  {/* Timeframe Filter Pills */}
                  <div className="flex items-center p-1 bg-surface-container rounded-full shadow-inner border border-outline-variant/30">
                    <button
                      className={`filter-btn px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                        period === "today"
                          ? "bg-primary text-white shadow-sm"
                          : "text-on-surface-variant hover:text-primary"
                      }`}
                      onClick={() => setPeriod("today")}
                      type="button"
                    >
                      Hôm nay
                    </button>
                    <button
                      className={`filter-btn px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                        period === "7d"
                          ? "bg-primary text-white shadow-sm"
                          : "text-on-surface-variant hover:text-primary"
                      }`}
                      onClick={() => setPeriod("7d")}
                      type="button"
                    >
                      7 ngày qua
                    </button>
                    <button
                      className={`filter-btn px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                        period === "month"
                          ? "bg-primary text-white shadow-sm"
                          : "text-on-surface-variant hover:text-primary"
                      }`}
                      onClick={() => setPeriod("month")}
                      type="button"
                    >
                      Tháng này
                    </button>
                    <button
                      className={`filter-btn px-space-xs py-1.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1 cursor-pointer ${
                        period === "custom"
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
                          <span className="text-body-md opacity-60">Đang tải...</span>
                        ) : (
                          Number(revenueData.totalRevenue || 0).toLocaleString("vi-VN")
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
                          Number(revenueData.totalOrders || 0).toLocaleString("vi-VN")
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
                          Number(userData.totalUsers || 0).toLocaleString("vi-VN")
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
                {/* Big Growth Chart (8 cols) */}
                <div className="lg:col-span-8 bg-surface-container-lowest p-space-xl rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-lg">
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                          Tăng Trưởng Doanh Thu &amp; Lượng Đơn 7 Ngày
                        </h2>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        So sánh hiệu suất giữa Cà phê Đặc Sản (Specialty) và Trà Sữa Oolong
                      </p>
                    </div>
                    <div className="flex items-center gap-space-md">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-primary-container" />
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                          Cà phê Specialty
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-on-tertiary-container" />
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                          Trà sữa Oolong
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Simulated SVG Bar / Trend Chart */}
                  <div className="w-full h-64 relative flex items-end pt-4 pb-6 px-2">
                    <div className="absolute inset-x-0 top-6 h-px bg-surface-container-high opacity-70" />
                    <div className="absolute inset-x-0 top-24 h-px bg-surface-container-high opacity-70" />
                    <div className="absolute inset-x-0 top-44 h-px bg-surface-container-high opacity-70" />

                    <div className="grid grid-cols-7 w-full h-full items-end gap-2 sm:gap-6 z-10">
                      {/* T2 */}
                      <div className="flex flex-col items-center h-full justify-end group cursor-pointer">
                        <div className="flex items-end gap-1.5 h-full w-full max-w-[48px] justify-center">
                          <div
                            className="w-3 sm:w-4 bg-primary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                            style={{ height: "55%" }}
                          />
                          <div
                            className="w-3 sm:w-4 bg-on-tertiary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                            style={{ height: "40%" }}
                          />
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                          Thứ 2
                        </span>
                      </div>
                      {/* T3 */}
                      <div className="flex flex-col items-center h-full justify-end group cursor-pointer">
                        <div className="flex items-end gap-1.5 h-full w-full max-w-[48px] justify-center">
                          <div
                            className="w-3 sm:w-4 bg-primary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                            style={{ height: "65%" }}
                          />
                          <div
                            className="w-3 sm:w-4 bg-on-tertiary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                            style={{ height: "48%" }}
                          />
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                          Thứ 3
                        </span>
                      </div>
                      {/* T4 */}
                      <div className="flex flex-col items-center h-full justify-end group cursor-pointer">
                        <div className="flex items-end gap-1.5 h-full w-full max-w-[48px] justify-center">
                          <div
                            className="w-3 sm:w-4 bg-primary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                            style={{ height: "50%" }}
                          />
                          <div
                            className="w-3 sm:w-4 bg-on-tertiary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                            style={{ height: "60%" }}
                          />
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                          Thứ 4
                        </span>
                      </div>
                      {/* T5 */}
                      <div className="flex flex-col items-center h-full justify-end group cursor-pointer">
                        <div className="flex items-end gap-1.5 h-full w-full max-w-[48px] justify-center">
                          <div
                            className="w-3 sm:w-4 bg-primary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                            style={{ height: "72%" }}
                          />
                          <div
                            className="w-3 sm:w-4 bg-on-tertiary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                            style={{ height: "55%" }}
                          />
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                          Thứ 5
                        </span>
                      </div>
                      {/* T6 */}
                      <div className="flex flex-col items-center h-full justify-end group cursor-pointer">
                        <div className="flex items-end gap-1.5 h-full w-full max-w-[48px] justify-center">
                          <div
                            className="w-3 sm:w-4 bg-primary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                            style={{ height: "84%" }}
                          />
                          <div
                            className="w-3 sm:w-4 bg-on-tertiary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                            style={{ height: "70%" }}
                          />
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                          Thứ 6
                        </span>
                      </div>
                      {/* T7 Peak */}
                      <div className="flex flex-col items-center h-full justify-end group cursor-pointer relative">
                        <div className="absolute -top-7 px-1.5 py-0.5 rounded bg-primary text-white font-label-sm text-[10px] whitespace-nowrap shadow-sm font-bold">
                          Peak: 38.2M
                        </div>
                        <div className="flex items-end gap-1.5 h-full w-full max-w-[48px] justify-center">
                          <div
                            className="w-3 sm:w-4 bg-primary rounded-t-sm transition-all duration-300 shadow-sm"
                            style={{ height: "96%" }}
                          />
                          <div
                            className="w-3 sm:w-4 bg-on-tertiary-container rounded-t-sm transition-all duration-300"
                            style={{ height: "88%" }}
                          />
                        </div>
                        <span className="font-label-sm text-label-sm text-primary font-bold mt-2">
                          Thứ 7
                        </span>
                      </div>
                      {/* CN */}
                      <div className="flex flex-col items-center h-full justify-end group cursor-pointer">
                        <div className="flex items-end gap-1.5 h-full w-full max-w-[48px] justify-center">
                          <div
                            className="w-3 sm:w-4 bg-primary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                            style={{ height: "90%" }}
                          />
                          <div
                            className="w-3 sm:w-4 bg-on-tertiary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                            style={{ height: "82%" }}
                          />
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                          Chủ Nhật
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-space-sm mt-space-xs flex flex-wrap items-center justify-between text-body-sm text-on-surface-variant border-t border-surface-container/60">
                    <span>
                      Doanh thu trung bình theo ca sáng:{" "}
                      <strong className="text-primary font-semibold">
                        18.400.000đ
                      </strong>
                    </span>
                    <span className="flex items-center gap-1 text-secondary font-medium">
                      <span className="material-symbols-outlined text-[16px]">
                        verified
                      </span>
                      Khung giờ cao điểm: 08:00 - 10:30 &amp; 14:00 - 16:30
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
                    <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 100 100">
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
                          Theo dõi luồng order thời gian thực tại quầy và app giao hàng
                        </p>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <button
                          className="p-2 text-on-surface-variant hover:text-primary rounded-lg bg-surface-container transition-colors cursor-pointer"
                          title="Làm mới dữ liệu"
                          type="button"
                          onClick={() => alert("Dữ liệu đã được làm mới!")}
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
                            <th className="py-space-sm px-space-md">Khách hàng</th>
                            <th className="py-space-sm px-space-md">
                              Món đặt (Tùy chọn)
                            </th>
                            <th className="py-space-sm px-space-md">Tổng tiền</th>
                            <th className="py-space-sm px-space-md">Thanh toán</th>
                            <th className="py-space-sm px-space-md">Trạng thái</th>
                            <th className="py-space-sm px-space-md text-right rounded-r-lg">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container text-body-md text-on-surface">
                          {orders.map((order) => (
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
                                <div className="font-title-sm text-title-sm text-primary line-clamp-1 font-semibold">
                                  {order.items}
                                </div>
                                <div className="font-body-sm text-body-sm text-on-surface-variant">
                                  {order.note}
                                </div>
                              </td>
                              <td className="py-space-md px-space-md font-title-sm text-title-sm text-primary font-bold whitespace-nowrap">
                                {order.total}
                              </td>
                              <td className="py-space-md px-space-md">
                                <span className="inline-flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant font-medium">
                                  <span className="material-symbols-outlined text-[16px] text-primary">
                                    {order.payment === "VietQR"
                                      ? "qr_code_2"
                                      : order.payment === "COD"
                                      ? "payments"
                                      : "credit_card"}
                                  </span>{" "}
                                  {order.payment}
                                </span>
                              </td>
                              <td className="py-space-md px-space-md">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-space-xs py-1 rounded-full font-label-sm text-label-sm font-semibold ${order.statusColor}`}
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
                                    className="p-1.5 text-primary hover:bg-surface-container rounded-full transition-colors cursor-pointer mr-1"
                                    title="Xác nhận nhận đơn"
                                    type="button"
                                    onClick={() =>
                                      handleUpdateStatus(
                                        order.id,
                                        "preparing",
                                        "Đang pha chế",
                                        "bg-surface-container-highest text-on-surface",
                                        "bg-primary-container animate-pulse"
                                      )
                                    }
                                  >
                                    <span className="material-symbols-outlined text-[20px] text-green-700">
                                      check
                                    </span>
                                  </button>
                                )}
                                {order.status === "preparing" && (
                                  <button
                                    className="p-1.5 text-primary hover:bg-surface-container rounded-full transition-colors cursor-pointer mr-1"
                                    title="Hoàn thành pha chế"
                                    type="button"
                                    onClick={() =>
                                      handleUpdateStatus(
                                        order.id,
                                        "delivering",
                                        "Đang giao hàng",
                                        "bg-secondary-fixed text-on-secondary-fixed",
                                        "bg-secondary"
                                      )
                                    }
                                  >
                                    <span className="material-symbols-outlined text-[20px] text-amber-700">
                                      local_cafe
                                    </span>
                                  </button>
                                )}
                                <button
                                  className="p-1.5 text-on-surface-variant hover:text-primary rounded-full transition-colors cursor-pointer"
                                  title="Chi tiết đơn hàng"
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `Chi tiết đơn ${order.id}:\nKhách hàng: ${order.customer}\nMón: ${order.items}\nTổng tiền: ${order.total}`
                                    )
                                  }
                                >
                                  <span className="material-symbols-outlined text-[20px]">
                                    more_vert
                                  </span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Table Footer */}
                  <div className="pt-space-md mt-space-sm flex flex-col sm:flex-row items-center justify-between text-body-sm text-on-surface-variant gap-space-sm border-t border-surface-container/60">
                    <span>
                      Hiển thị {orders.length} trong số 28 đơn hàng ngày hôm nay
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
                      onClick={() => alert("Đã mở form tạo phiếu nhập kho nguyên liệu")}
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
                          <span className="w-2 h-2 rounded-full bg-secondary" /> 4
                          đang online
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
                    <span>Chiến dịch Mùa Hè 2026: &ldquo;Velvet Summer Blossom&rdquo;</span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-white font-bold leading-tight">
                    Tối ưu thực đơn theo xu hướng thức uống thủ công
                  </h2>
                  <p className="font-body-md text-body-md text-white/80 mt-space-2xs">
                    Dòng sản phẩm Cold Brew Cam Vàng và Trà Sữa Oolong Sương Sáo đang
                    chiếm hơn 45% lượng đặt trên ứng dụng. Cân nhắc bổ sung thêm size
                    Lớn (L) để gia tăng doanh thu trên mỗi đơn hàng.
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

          {/* TAB QUẢN LÝ KHÁCH HÀNG */}
          {activeTab === "khach-hang" && (
            <div className="flex flex-col w-full gap-space-lg">
              {/* Header Tab */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                <div>
                  <div className="flex items-center gap-space-xs mb-1">
                    <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
                      Dữ liệu hội viên Velvet Club
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                    Quản Lý Khách Hàng
                  </h1>
                  <p className="font-body-md text-on-surface-variant mt-1">
                    Theo dõi danh sách khách hàng, điểm tích lũy BrewClub và tổng chi tiêu toàn hệ thống.
                  </p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <button
                    onClick={() => alert("Đang xuất danh sách khách hàng ra file Excel...")}
                    className="px-space-md py-2 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl font-label-md font-semibold border-0 cursor-pointer flex items-center gap-1.5 transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span>Xuất Excel</span>
                  </button>
                  <button
                    onClick={() => alert("Mở form thêm hồ sơ khách hàng mới")}
                    className="px-space-md py-2 bg-primary-container hover:bg-primary text-white rounded-xl font-label-md font-bold border-0 cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>Thêm khách hàng</span>
                  </button>
                </div>
              </div>

              {/* 4 Thẻ chỉ số khách hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
                <div className="p-space-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Tổng khách hàng
                    </span>
                    <strong className="font-headline-sm text-headline-sm text-primary mt-1">
                      1.428
                    </strong>
                    <span className="text-[12px] text-secondary font-semibold mt-1">
                      ↑ +14.2% so với tháng trước
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[24px]">group</span>
                  </div>
                </div>

                <div className="p-space-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Hội viên VIP / Vàng
                    </span>
                    <strong className="font-headline-sm text-headline-sm text-primary mt-1">
                      356
                    </strong>
                    <span className="text-[12px] text-secondary font-semibold mt-1">
                      ↑ 25% tổng khách
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary-container">
                    <span className="material-symbols-outlined text-[24px]">military_tech</span>
                  </div>
                </div>

                <div className="p-space-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Điểm Brew tích lũy
                    </span>
                    <strong className="font-headline-sm text-headline-sm text-primary mt-1">
                      48.650
                    </strong>
                    <span className="text-[12px] text-on-surface-variant mt-1">
                      Quy đổi ~ 48.6 tr voucher
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
                    <span className="material-symbols-outlined text-[24px]">stars</span>
                  </div>
                </div>

                <div className="p-space-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Tỷ lệ quay lại
                    </span>
                    <strong className="font-headline-sm text-headline-sm text-primary mt-1">
                      78.4%
                    </strong>
                    <span className="text-[12px] text-secondary font-semibold mt-1">
                      Khách hàng trung thành cao
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined text-[24px]">repeat</span>
                  </div>
                </div>
              </div>

              {/* Bảng danh sách khách hàng */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs overflow-hidden">
                <div className="p-space-md border-b border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <h2 className="font-title-lg text-title-lg text-primary font-bold m-0">
                    Danh Sách Khách Hàng Hoạt Động
                  </h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-space-xs py-1 rounded-full">
                    Hiển thị 5 khách hàng gần nhất
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container">
                        <th className="py-3 px-space-md">Khách hàng</th>
                        <th className="py-3 px-space-md">Liên hệ</th>
                        <th className="py-3 px-space-md">Hạng hội viên</th>
                        <th className="py-3 px-space-md text-right">Tổng chi tiêu</th>
                        <th className="py-3 px-space-md text-center">Đơn hàng</th>
                        <th className="py-3 px-space-md text-center">Điểm Brew</th>
                        <th className="py-3 px-space-md text-center">Trạng thái</th>
                        <th className="py-3 px-space-md text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container font-body-sm text-body-sm">
                      {/* Khách hàng 1: Thông tin người dùng hiện tại nếu có */}
                      <tr className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="py-3.5 px-space-md">
                          <div className="flex items-center gap-space-sm">
                            <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                              {user?.fullName
                                ? user.fullName.slice(0, 2).toUpperCase()
                                : "HT"}
                            </div>
                            <div>
                              <strong className="text-primary font-title-sm block">
                                {user?.fullName || "Hoàng Minh Trí"}
                              </strong>
                              <span className="text-[11.5px] text-on-surface-variant">
                                Mã: #KH-{user?.id || "9821"} (Tài khoản hiện tại)
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div>
                            <span className="text-primary font-medium block">
                              {user?.phoneNumber || "0903 888 882"}
                            </span>
                            <span className="text-[11.5px] text-on-surface-variant">
                              {user?.email || "minhtri@velvetbrew.vn"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <span className="px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            ⭐️ Hội Viên Vàng
                          </span>
                        </td>
                        <td className="py-3.5 px-space-md text-right font-bold text-primary">
                          2.450.000 đ
                        </td>
                        <td className="py-3.5 px-space-md text-center font-semibold">
                          18 đơn
                        </td>
                        <td className="py-3.5 px-space-md text-center font-bold text-secondary">
                          245 Hạt
                        </td>
                        <td className="py-3.5 px-space-md text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
                            Đang hoạt động
                          </span>
                        </td>
                        <td className="py-3.5 px-space-md text-right">
                          <button
                            onClick={() => alert(`Xem chi tiết khách hàng ${user?.fullName || "Hoàng Minh Trí"}`)}
                            className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-lg text-primary text-[12px] font-semibold border-0 cursor-pointer"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>

                      {/* Khách hàng 2 */}
                      <tr className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="py-3.5 px-space-md">
                          <div className="flex items-center gap-space-sm">
                            <div className="w-9 h-9 rounded-full bg-tertiary-container text-white flex items-center justify-center font-bold text-xs">
                              TM
                            </div>
                            <div>
                              <strong className="text-primary font-title-sm block">
                                Nguyễn Thảo My
                              </strong>
                              <span className="text-[11.5px] text-on-surface-variant">
                                Mã: #KH-9820
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div>
                            <span className="text-primary font-medium block">
                              0978 314 552
                            </span>
                            <span className="text-[11.5px] text-on-surface-variant">
                              thaomy.nguyen@gmail.com
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <span className="px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                            💎 VIP Kim Cương
                          </span>
                        </td>
                        <td className="py-3.5 px-space-md text-right font-bold text-primary">
                          5.120.000 đ
                        </td>
                        <td className="py-3.5 px-space-md text-center font-semibold">
                          32 đơn
                        </td>
                        <td className="py-3.5 px-space-md text-center font-bold text-secondary">
                          512 Hạt
                        </td>
                        <td className="py-3.5 px-space-md text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
                            Đang hoạt động
                          </span>
                        </td>
                        <td className="py-3.5 px-space-md text-right">
                          <button
                            onClick={() => alert("Xem chi tiết khách hàng Nguyễn Thảo My")}
                            className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-lg text-primary text-[12px] font-semibold border-0 cursor-pointer"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>

                      {/* Khách hàng 3 */}
                      <tr className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="py-3.5 px-space-md">
                          <div className="flex items-center gap-space-sm">
                            <div className="w-9 h-9 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-xs">
                              QC
                            </div>
                            <div>
                              <strong className="text-primary font-title-sm block">
                                Vũ Quốc Cường
                              </strong>
                              <span className="text-[11.5px] text-on-surface-variant">
                                Mã: #KH-9819
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div>
                            <span className="text-primary font-medium block">
                              0912 449 203
                            </span>
                            <span className="text-[11.5px] text-on-surface-variant">
                              cuong.vu@techcorp.vn
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <span className="px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            🥈 Hội Viên Bạc
                          </span>
                        </td>
                        <td className="py-3.5 px-space-md text-right font-bold text-primary">
                          980.000 đ
                        </td>
                        <td className="py-3.5 px-space-md text-center font-semibold">
                          8 đơn
                        </td>
                        <td className="py-3.5 px-space-md text-center font-bold text-secondary">
                          98 Hạt
                        </td>
                        <td className="py-3.5 px-space-md text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
                            Đang hoạt động
                          </span>
                        </td>
                        <td className="py-3.5 px-space-md text-right">
                          <button
                            onClick={() => alert("Xem chi tiết khách hàng Vũ Quốc Cường")}
                            className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-lg text-primary text-[12px] font-semibold border-0 cursor-pointer"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>

                      {/* Khách hàng 4 */}
                      <tr className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="py-3.5 px-space-md">
                          <div className="flex items-center gap-space-sm">
                            <div className="w-9 h-9 rounded-full bg-surface-container-highest text-primary flex items-center justify-center font-bold text-xs">
                              QT
                            </div>
                            <div>
                              <strong className="text-primary font-title-sm block">
                                Lê Quỳnh Trâm
                              </strong>
                              <span className="text-[11.5px] text-on-surface-variant">
                                Mã: #KH-9818
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div>
                            <span className="text-primary font-medium block">
                              0935 102 771
                            </span>
                            <span className="text-[11.5px] text-on-surface-variant">
                              tram.le@studio.com
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <span className="px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            ⭐️ Hội Viên Vàng
                          </span>
                        </td>
                        <td className="py-3.5 px-space-md text-right font-bold text-primary">
                          1.850.000 đ
                        </td>
                        <td className="py-3.5 px-space-md text-center font-semibold">
                          15 đơn
                        </td>
                        <td className="py-3.5 px-space-md text-center font-bold text-secondary">
                          185 Hạt
                        </td>
                        <td className="py-3.5 px-space-md text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
                            Đang hoạt động
                          </span>
                        </td>
                        <td className="py-3.5 px-space-md text-right">
                          <button
                            onClick={() => alert("Xem chi tiết khách hàng Lê Quỳnh Trâm")}
                            className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-lg text-primary text-[12px] font-semibold border-0 cursor-pointer"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sub-views if user clicks other sidebar tabs */}
          {activeTab !== "dashboard" && activeTab !== "khach-hang" && (
            <div className="bg-surface-container-lowest p-space-2xl rounded-2xl shadow-sm border border-outline-variant/30 text-center py-16">
              <span className="material-symbols-outlined text-[48px] text-primary mb-3">
                {navItems.find((n) => n.id === activeTab)?.icon || "layers"}
              </span>
              <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h2>
              <p className="text-on-surface-variant max-w-md mx-auto mt-2 font-body-md">
                Phân hệ {navItems.find((n) => n.id === activeTab)?.label} đang được đồng bộ
                dữ liệu trực tiếp từ cửa hàng Flagship Velvet &amp; Brew.
              </p>
              <button
                onClick={() => setActiveTab("dashboard")}
                className="mt-6 px-space-xl py-2.5 bg-primary-container text-white font-label-md text-label-md rounded-full hover:bg-primary transition-all cursor-pointer font-bold shadow-sm"
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
