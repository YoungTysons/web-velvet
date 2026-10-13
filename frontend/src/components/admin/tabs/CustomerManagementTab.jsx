import React, { useState, useEffect } from "react";
import adminApi from "../../../api/adminApi";

export default function CustomerManagementTab({ user }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState("ALL");
  const [selectedRole, setSelectedRole] = useState("all"); // 'all' | 'CUSTOMER' | 'ADMIN' | 'STAFF'
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    vipCount: 0,
    totalBrewPoints: 0,
    repeatRate: 78.4,
  });

  // State xem chi tiết khách hàng
  const [detailCustomer, setDetailCustomer] = useState(null);

  // Load danh sách khách hàng từ API backend
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedTier !== "ALL") params.tier = selectedTier;
      if (selectedRole) params.role = selectedRole;

      const res = await adminApi.getCustomers(params);
      // axiosClient có thể unwrap trực tiếp response.data
      const payload = res && res.data ? res.data : res;
      const list = payload?.customers || (Array.isArray(payload) ? payload : []);

      setCustomers(list);
      if (payload?.summary) {
        setSummary(payload.summary);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách khách hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [selectedTier, selectedRole]);

  // Tìm kiếm khi nhấn Enter hoặc bấm tìm
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  // Format badge Hạng hội viên
  const renderMembershipBadge = (tier) => {
    switch (tier) {
      case "DIAMOND":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-purple-100 text-purple-900 border border-purple-200 inline-flex items-center gap-1 shadow-2xs">
            💎 VIP Kim Cương
          </span>
        );
      case "GOLD":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-amber-100 text-amber-900 border border-amber-200 inline-flex items-center gap-1 shadow-2xs">
            ⭐️ Hội Viên Vàng
          </span>
        );
      case "SILVER":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-slate-100 text-slate-800 border border-slate-200 inline-flex items-center gap-1 shadow-2xs">
            🥈 Hội Viên Bạc
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1 shadow-2xs">
            ☕ Hội Viên Mới
          </span>
        );
    }
  };

  // Tạo avatar màu ngẫu nhiên hài hòa cho initials
  const getAvatarColor = (index) => {
    const colors = [
      "bg-primary-container text-white",
      "bg-secondary text-white",
      "bg-amber-600 text-white",
      "bg-purple-600 text-white",
      "bg-teal-600 text-white",
    ];
    return colors[index % colors.length];
  };

  return (
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
            Theo dõi danh sách khách hàng thực tế, điểm tích lũy BrewClub và tổng chi tiêu toàn hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-space-xs flex-wrap">
          <button
            onClick={() => alert("Đang xuất danh sách khách hàng ra file Excel...")}
            className="px-space-md py-2 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl font-label-md font-semibold border-0 cursor-pointer flex items-center gap-1.5 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={() => alert("Mở form thêm hồ sơ khách hàng mới")}
            className="px-space-md py-2 bg-primary-container hover:bg-primary text-white rounded-xl font-label-md font-bold border-0 cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              person_add
            </span>
            <span>Thêm khách hàng</span>
          </button>
        </div>
      </div>

      {/* 4 Thẻ chỉ số khách hàng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="p-space-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Tổng khách hàng
            </span>
            <strong className="font-headline-sm text-headline-sm text-primary mt-1">
              {summary.totalCustomers > 0 ? summary.totalCustomers.toLocaleString("vi-VN") : "0"}
            </strong>
            <span className="text-[12px] text-secondary font-semibold mt-1">
              ↑ Dữ liệu trực tiếp từ DB
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">
              group
            </span>
          </div>
        </div>

        <div className="p-space-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Hội viên VIP / Vàng
            </span>
            <strong className="font-headline-sm text-headline-sm text-primary mt-1">
              {summary.vipCount}
            </strong>
            <span className="text-[12px] text-secondary font-semibold mt-1">
              {summary.totalCustomers > 0
                ? `${Math.round((summary.vipCount / summary.totalCustomers) * 100)}% tổng khách`
                : "Hạng Gold & Diamond"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary-container">
            <span className="material-symbols-outlined text-[24px]">
              military_tech
            </span>
          </div>
        </div>

        <div className="p-space-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Điểm Brew tích lũy
            </span>
            <strong className="font-headline-sm text-headline-sm text-primary mt-1">
              {summary.totalBrewPoints.toLocaleString("vi-VN")}
            </strong>
            <span className="text-[12px] text-on-surface-variant mt-1">
              Quy đổi ~ {(summary.totalBrewPoints * 1000).toLocaleString("vi-VN")} đ voucher
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined text-[24px]">
              stars
            </span>
          </div>
        </div>

        <div className="p-space-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Tỷ lệ quay lại
            </span>
            <strong className="font-headline-sm text-headline-sm text-primary mt-1">
              {summary.repeatRate}%
            </strong>
            <span className="text-[12px] text-secondary font-semibold mt-1">
              Khách hàng trung thành cao
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined text-[24px]">
              repeat
            </span>
          </div>
        </div>
      </div>

      {/* Thanh công cụ tìm kiếm và lọc */}
      <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-space-xs">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo họ tên, số điện thoại, email..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-primary font-body-sm focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-secondary text-white rounded-xl font-label-md font-semibold hover:bg-secondary-container transition-colors flex items-center gap-1 cursor-pointer border-0"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="flex items-center gap-space-xs flex-wrap">
          <span className="font-label-sm text-on-surface-variant font-semibold whitespace-nowrap">
            Vai trò:
          </span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/30 text-primary font-body-sm font-medium focus:outline-none focus:border-secondary cursor-pointer"
          >
            <option value="all">🌐 Tất cả tài khoản</option>
            <option value="CUSTOMER">👤 Khách hàng</option>
            <option value="ADMIN">🛡️ Quản trị viên</option>
            <option value="STAFF">☕ Nhân viên</option>
          </select>

          <span className="font-label-sm text-on-surface-variant font-semibold whitespace-nowrap ml-1">
            Hạng:
          </span>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/30 text-primary font-body-sm font-medium focus:outline-none focus:border-secondary cursor-pointer"
          >
            <option value="ALL">Tất cả hạng</option>
            <option value="DIAMOND">💎 VIP Kim Cương</option>
            <option value="GOLD">⭐️ Hội Viên Vàng</option>
            <option value="SILVER">🥈 Hội Viên Bạc</option>
            <option value="MEMBER">☕ Hội Viên Mới</option>
          </select>
          <button
            type="button"
            onClick={fetchCustomers}
            title="Làm mới dữ liệu"
            className="p-2.5 bg-surface-container hover:bg-surface-container-high rounded-xl text-primary border-0 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Bảng danh sách khách hàng */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs overflow-hidden">
        <div className="p-space-md border-b border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <h2 className="font-title-lg text-title-lg text-primary font-bold m-0 flex items-center gap-2">
            <span>Danh Sách Khách Hàng Hoạt Động</span>
            <span className="text-xs font-normal text-on-surface-variant">
              ({customers.length} khách hàng)
            </span>
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-space-xs py-1 rounded-full font-semibold">
            {loading ? "Đang đồng bộ..." : `Đang hiển thị ${customers.length} khách hàng`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container font-semibold">
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-[32px] text-secondary">
                        progress_activity
                      </span>
                      <span>Đang tải danh sách khách hàng từ cơ sở dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[40px] text-outline">
                        person_off
                      </span>
                      <span>Không tìm thấy khách hàng nào phù hợp với bộ lọc.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c, index) => {
                  const initials = c.fullName
                    ? c.fullName
                        .trim()
                        .split(" ")
                        .map((n) => n[0])
                        .slice(-2)
                        .join("")
                        .toUpperCase()
                    : "KH";

                  const isCurrentAuth = user?.id === c.id;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-surface-container-low/60 transition-colors group"
                    >
                      {/* Khách hàng */}
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-space-sm">
                          {c.avatar ? (
                            <img
                              src={c.avatar}
                              alt={c.fullName}
                              className="w-10 h-10 rounded-full object-cover border border-outline-variant/40"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${getAvatarColor(
                                index
                              )}`}
                            >
                              {initials}
                            </div>
                          )}
                          <div>
                            <strong className="text-primary font-title-sm block flex items-center gap-1.5 flex-wrap">
                              <span>{c.fullName}</span>
                              {c.role === "ADMIN" && (
                                <span className="text-[10px] bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded-full font-bold">
                                  Admin
                                </span>
                              )}
                              {c.role === "STAFF" && (
                                <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded-full font-bold">
                                  Staff
                                </span>
                              )}
                              {isCurrentAuth && (
                                <span className="text-[10px] bg-secondary/15 text-secondary px-1.5 py-0.5 rounded-full font-bold">
                                  Bạn
                                </span>
                              )}
                            </strong>
                            <span className="text-[11.5px] text-on-surface-variant">
                              Mã: #KH-{c.id} {c.nickname ? `• ${c.nickname}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Liên hệ */}
                      <td className="py-3.5 px-space-md">
                        <div>
                          <span className="text-primary font-medium block">
                            {c.phoneNumber || "Chưa có SĐT"}
                          </span>
                          <span className="text-[11.5px] text-on-surface-variant block truncate max-w-[180px]">
                            {c.email || "Chưa cập nhật email"}
                          </span>
                        </div>
                      </td>

                      {/* Hạng hội viên */}
                      <td className="py-3.5 px-space-md">
                        {renderMembershipBadge(c.membershipTier)}
                      </td>

                      {/* Tổng chi tiêu */}
                      <td className="py-3.5 px-space-md text-right font-bold text-primary">
                        {(c.totalSpent || 0).toLocaleString("vi-VN")} đ
                      </td>

                      {/* Đơn hàng */}
                      <td className="py-3.5 px-space-md text-center font-semibold">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-surface-container-low text-primary font-bold">
                          {c.orderCount || 0} đơn
                        </span>
                      </td>

                      {/* Điểm Brew */}
                      <td className="py-3.5 px-space-md text-center font-bold text-secondary">
                        {(c.brewPoints || 0).toLocaleString("vi-VN")} Hạt
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-space-md text-center">
                        {c.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800 border border-green-200">
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                            Tạm khóa
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-space-md text-right">
                        <button
                          type="button"
                          onClick={() => setDetailCustomer(c)}
                          title={`Xem chi tiết khách hàng ${c.fullName}`}
                          className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-xl text-primary text-[12px] font-semibold border-0 cursor-pointer transition-colors shadow-2xs"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL CHI TIẾT KHÁCH HÀNG ================= */}
      {detailCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">
                  badge
                </span>
                <h3 className="font-title-md font-bold text-white m-0">
                  Hồ Sơ Khách Hàng #KH-{detailCustomer.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailCustomer(null)}
                className="p-1 text-white/80 hover:text-white border-0 cursor-pointer bg-transparent"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                {detailCustomer.avatar ? (
                  <img
                    src={detailCustomer.avatar}
                    alt={detailCustomer.fullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xl">
                    {detailCustomer.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-title-lg text-primary font-bold m-0">
                    {detailCustomer.fullName}
                  </h4>
                  <div className="mt-1">
                    {renderMembershipBadge(detailCustomer.membershipTier)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-4 rounded-xl text-[13px]">
                <div>
                  <span className="text-on-surface-variant block">Số điện thoại:</span>
                  <strong className="text-primary">{detailCustomer.phoneNumber || "Chưa có"}</strong>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Email:</span>
                  <strong className="text-primary truncate block">{detailCustomer.email || "Chưa có"}</strong>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Điểm Brew tích lũy:</span>
                  <strong className="text-secondary">{detailCustomer.brewPoints} Hạt</strong>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Tổng số đơn hàng:</span>
                  <strong className="text-primary">{detailCustomer.orderCount || 0} đơn</strong>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Tổng chi tiêu:</span>
                  <strong className="text-primary">{(detailCustomer.totalSpent || 0).toLocaleString("vi-VN")} đ</strong>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Trạng thái:</span>
                  <strong className={detailCustomer.isActive ? "text-green-700" : "text-red-700"}>
                    {detailCustomer.isActive ? "Đang hoạt động" : "Tạm khóa"}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setDetailCustomer(null)}
                  className="px-4 py-2 bg-surface-container text-primary rounded-xl font-label-md font-semibold border-0 cursor-pointer hover:bg-surface-container-high transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
