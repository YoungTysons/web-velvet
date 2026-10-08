import React from "react";

export default function CustomerManagementTab({ user }) {
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
            Theo dõi danh sách khách hàng, điểm tích lũy BrewClub và tổng chi tiêu toàn hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-space-xs">
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
              1.428
            </strong>
            <span className="text-[12px] text-secondary font-semibold mt-1">
              ↑ +14.2% so với tháng trước
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
              356
            </strong>
            <span className="text-[12px] text-secondary font-semibold mt-1">
              ↑ 25% tổng khách
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
              48.650
            </strong>
            <span className="text-[12px] text-on-surface-variant mt-1">
              Quy đổi ~ 48.6 tr voucher
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
              78.4%
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

      {/* Bảng danh sách khách hàng */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs overflow-hidden">
        <div className="p-space-md border-b border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <h2 className="font-title-lg text-title-lg text-primary font-bold m-0">
            Danh Sách Khách Hàng Hoạt Động
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-space-xs py-1 rounded-full font-semibold">
            Hiển thị 4 khách hàng gần nhất
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
              <tr className="hover:bg-surface-container-low/60 transition-colors">
                <td className="py-3.5 px-space-md">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                      {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : "HT"}
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
                    onClick={() =>
                      alert(`Xem chi tiết khách hàng ${user?.fullName || "Hoàng Minh Trí"}`)
                    }
                    className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-lg text-primary text-[12px] font-semibold border-0 cursor-pointer"
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>

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
  );
}
