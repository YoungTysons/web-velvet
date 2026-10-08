import React from "react";

export default function OrderManagementTab({
  orders = [],
  orderFilter = "all",
  setOrderFilter,
  orderSearch = "",
  setOrderSearch,
  handleQuickStatus,
  setActiveTab,
}) {
  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== "all" && o.status !== orderFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.trim().toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-xl">
        <div>
          <div className="flex items-center gap-space-xs mb-space-2xs">
            <button
              onClick={() => setActiveTab("dashboard")}
              className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              <span>Quay lại Dashboard</span>
            </button>
            <span className="text-outline-variant">/</span>
            <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
              Đơn hàng trực tuyến &amp; tại quầy
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
            Quản lý Đơn hàng
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Theo dõi, điều phối pha chế và tiến độ giao hàng toàn hệ thống chi nhánh.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-xs">
          <button
            className="flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-lowest text-primary hover:bg-surface-container-high rounded-full font-label-md text-label-md shadow-sm transition-all border-0 cursor-pointer"
            type="button"
            onClick={() => alert("Đang xuất danh sách đơn hàng sang Excel...")}
          >
            <span className="material-symbols-outlined text-[18px]">
              file_download
            </span>
            <span>Xuất danh sách</span>
          </button>
          <button
            className="flex items-center gap-space-xs px-space-lg py-space-xs bg-primary-container text-on-primary hover:bg-primary rounded-full font-label-md text-label-md shadow-md transition-all border-0 cursor-pointer font-bold"
            type="button"
            onClick={() => alert("Mở giao diện tạo đơn POS tại quầy...")}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ Tạo đơn mới</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg mb-space-xl">
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-outline-variant/20">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
              Đang xử lý
            </span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold mt-1">
              {orders.filter((o) => o.status === "pending").length} đơn
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">
              pending_actions
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-outline-variant/20">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
              Đang pha chế
            </span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold mt-1">
              {orders.filter((o) => o.status === "preparing").length} đơn
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">
              local_cafe
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-outline-variant/20">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
              Đang giao hàng
            </span>
            <span className="font-headline-sm text-headline-sm text-secondary font-bold mt-1">
              {orders.filter((o) => o.status === "delivering").length} đơn
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">moped</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-outline-variant/20">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
              Hoàn tất hôm nay
            </span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold mt-1">
              {orders.filter((o) => o.status === "completed").length} đơn
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">
              check_circle
            </span>
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-xl shadow-sm flex flex-col gap-space-md border border-outline-variant/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "all", label: `Tất cả (${orders.length})` },
              {
                id: "pending",
                label: `Chờ xác nhận (${orders.filter((o) => o.status === "pending").length})`,
              },
              {
                id: "preparing",
                label: `Đang pha chế (${orders.filter((o) => o.status === "preparing").length})`,
              },
              {
                id: "delivering",
                label: `Đang giao (${orders.filter((o) => o.status === "delivering").length})`,
              },
              {
                id: "completed",
                label: `Hoàn tất (${orders.filter((o) => o.status === "completed").length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setOrderFilter(tab.id)}
                className={`px-space-md py-1.5 rounded-full font-label-md text-label-md transition-colors border-0 cursor-pointer whitespace-nowrap font-medium ${
                  orderFilter === tab.id
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                }`}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-space-xs">
            <div className="relative flex-1 md:w-64">
              <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                className="w-full pl-9 pr-space-sm py-1.5 bg-surface-container-low text-on-surface rounded-full font-body-sm text-body-sm outline-none focus:shadow-[0_0_0_2px_#3e2723]"
                placeholder="Lọc theo mã hoặc tên..."
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </div>
            <button
              className="p-2 rounded-full bg-surface-container text-on-surface-variant hover:text-primary transition-colors border-0 cursor-pointer"
              type="button"
              title="Bộ lọc chi tiết"
            >
              <span className="material-symbols-outlined text-[18px]">
                tune
              </span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                <th className="py-space-sm px-space-md rounded-l-lg">Mã đơn</th>
                <th className="py-space-sm px-space-md">Khách hàng</th>
                <th className="py-space-sm px-space-md">Chi tiết món</th>
                <th className="py-space-sm px-space-md">Tổng tiền</th>
                <th className="py-space-sm px-space-md">Kênh đặt</th>
                <th className="py-space-sm px-space-md">Trạng thái</th>
                <th className="py-space-sm px-space-md text-right rounded-r-lg">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-body-md text-on-surface">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-outline-variant">
                        inbox
                      </span>
                      <p className="font-semibold text-primary">
                        Không tìm thấy đơn hàng nào phù hợp
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
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
                      <div className="font-title-sm text-title-sm text-primary line-clamp-1 font-medium">
                        {order.items}
                      </div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant italic">
                        {order.note}
                      </div>
                    </td>
                    <td className="py-space-md px-space-md font-title-sm text-title-sm text-primary font-bold whitespace-nowrap">
                      {order.total}
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="inline-flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          {order.channelIcon || "phone_iphone"}
                        </span>{" "}
                        {order.channel || "App Mobile"}
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
                          className="px-space-sm py-1 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm hover:opacity-90 mr-1 border-0 cursor-pointer shadow-xs font-semibold"
                          type="button"
                        >
                          Nhận đơn
                        </button>
                      )}
                      {order.status === "preparing" && (
                        <button
                          onClick={() => handleQuickStatus(order)}
                          className="px-space-sm py-1 bg-secondary text-on-secondary rounded-lg font-label-sm text-label-sm hover:opacity-90 mr-1 border-0 cursor-pointer shadow-xs font-semibold"
                          type="button"
                        >
                          Xong pha
                        </button>
                      )}
                      {order.status === "delivering" && (
                        <button
                          onClick={() => handleQuickStatus(order)}
                          className="px-space-sm py-1 bg-surface-container text-primary rounded-lg font-label-sm text-label-sm hover:bg-surface-container-high mr-1 border-0 cursor-pointer shadow-xs font-semibold"
                          type="button"
                        >
                          Giao xong
                        </button>
                      )}
                      {order.status === "completed" && (
                        <button
                          className="p-1 text-on-surface-variant hover:text-primary rounded-full border-0 bg-transparent cursor-pointer"
                          type="button"
                          title="Xem biên lai"
                          onClick={() =>
                            alert(`Xem chi tiết hóa đơn ${order.id}`)
                          }
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            receipt
                          </span>
                        </button>
                      )}
                      <button
                        className="p-1 text-on-surface-variant hover:text-primary rounded-full border-0 bg-transparent cursor-pointer"
                        type="button"
                        onClick={() =>
                          alert(`Chi tiết đơn hàng ${order.id}`)
                        }
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          more_vert
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-space-md mt-space-sm flex flex-col sm:flex-row items-center justify-between text-body-sm text-on-surface-variant gap-space-sm border-t border-surface-container/60">
          <span>
            Hiển thị {filteredOrders.length} trong số {orders.length} đơn hàng
          </span>
          <div className="flex items-center gap-space-xs">
            <button
              className="px-space-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors font-label-sm text-label-sm text-primary border-0 cursor-pointer"
              type="button"
            >
              Trước
            </button>
            <span className="font-label-sm text-label-sm px-2 text-primary font-bold">
              Trang 1 / 1
            </span>
            <button
              className="px-space-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors font-label-sm text-label-sm text-primary border-0 cursor-pointer"
              type="button"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
