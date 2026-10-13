import React, { useState, useEffect, useRef } from "react";
import adminApi from "../../../api/adminApi";
import { io } from "socket.io-client";
import axiosClient from "../../../api/axiosClient";

export default function CustomerCareTab({ user }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filterTier, setFilterTier] = useState("ALL"); // ALL | VIP | SILVER | MEMBER

  // Lưu trữ tin nhắn theo từng khách hàng { [customerId]: [ { id, text, sender, time } ] }
  const [messagesByCustomer, setMessagesByCustomer] = useState({});
  const [inputMessage, setInputMessage] = useState("");
  const socketRef = useRef(null);
  const selectedCustomerRef = useRef(selectedCustomer);
  const messagesEndRef = useRef(null);

  // Cập nhật ref mỗi khi chọn khách hàng khác
  useEffect(() => {
    selectedCustomerRef.current = selectedCustomer;
  }, [selectedCustomer]);

  // a. Kết nối Socket một lần khi mở cổng Admin
  useEffect(() => {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
        : "http://localhost:8080");
    socketRef.current = io(socketUrl);

    // Lắng nghe khi có tin nhắn mới gửi đến
    socketRef.current.on("receive_message", (newMsg) => {
      const targetCustomerId = newMsg.customerId || selectedCustomerRef.current?.id;
      if (!targetCustomerId) return;

      const formattedMsg = {
        id: newMsg.id,
        sender: newMsg.senderRole === "ADMIN" ? "admin" : "customer",
        text: newMsg.content,
        time: new Date(newMsg.createdAt).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessagesByCustomer((prev) => {
        const existing = prev[targetCustomerId] || [];
        if (existing.some((m) => m.id === formattedMsg.id)) return prev;
        return {
          ...prev,
          [targetCustomerId]: [...existing, formattedMsg],
        };
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // b. Khi Admin click chọn khách hàng: Join room và tải lịch sử tin nhắn
  useEffect(() => {
    if (!selectedCustomer) return;

    // Vào phòng chat riêng của khách này
    socketRef.current?.emit("join_room", selectedCustomer.id);

    // Tải lịch sử tin nhắn từ cơ sở dữ liệu
    axiosClient
      .get(`/chat/messages/${selectedCustomer.id}`)
      .then((res) => {
        if (res && res.messages) {
          const loadedMsgs = res.messages.map((m) => ({
            id: m.id,
            sender: m.senderRole === "ADMIN" ? "admin" : "customer",
            text: m.content,
            time: new Date(m.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));

          setMessagesByCustomer((prev) => ({
            ...prev,
            [selectedCustomer.id]: loadedMsgs,
          }));
        }
      })
      .catch((err) => console.error("Lỗi khi tải lịch sử tin nhắn:", err));
  }, [selectedCustomer]);

  // c. Tự động cuộn xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesByCustomer, selectedCustomer]);

  // Tải danh sách khách hàng từ cơ sở dữ liệu thật
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCustomers({ role: "all" });
      const payload = res && res.data ? res.data : res;
      const list = payload?.customers || (Array.isArray(payload) ? payload : []);

      setCustomers(list);
      // Mặc định chọn khách hàng đầu tiên nếu chưa chọn
      if (list.length > 0 && !selectedCustomer) {
        setSelectedCustomer(list[0]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách khách hàng cho cổng CSKH:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Lọc danh sách khách hàng
  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      !search.trim() ||
      (c.fullName && c.fullName.toLowerCase().includes(search.toLowerCase())) ||
      (c.phoneNumber && c.phoneNumber.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      String(c.id).includes(search);

    if (!matchSearch) return false;

    if (filterTier === "VIP") {
      return c.membershipTier === "GOLD" || c.membershipTier === "DIAMOND";
    }
    if (filterTier === "SILVER") {
      return c.membershipTier === "SILVER";
    }
    if (filterTier === "MEMBER") {
      return c.membershipTier === "MEMBER";
    }
    return true;
  });

  // Gửi tin nhắn từ Admin
   // Gửi tin nhắn từ Admin qua Socket.IO
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !selectedCustomer) return;

    if (socketRef.current) {
      socketRef.current.emit("send_message", {
        customerId: selectedCustomer.id,
        senderId: user?.id || 0,
        senderRole: "ADMIN",
        content: inputMessage.trim(),
      });
    }

    setInputMessage("");
  };


  // Format hạng hội viên
  const getTierInfo = (tier) => {
    switch (tier) {
      case "DIAMOND":
        return {
          label: "VIP Kim Cương",
          badge: "bg-purple-100 text-purple-900 border border-purple-200",
          icon: "workspace_premium",
        };
      case "GOLD":
        return {
          label: "Hội viên VIP Gold",
          badge: "bg-amber-100 text-amber-900 border border-amber-200",
          icon: "star",
        };
      case "SILVER":
        return {
          label: "Hội viên Bạc",
          badge: "bg-slate-100 text-slate-800 border border-slate-200",
          icon: "military_tech",
        };
      default:
        return {
          label: "Hội viên Mới",
          badge: "bg-emerald-100 text-emerald-800 border border-emerald-200",
          icon: "local_cafe",
        };
    }
  };

  // Avatar Initials
  const getInitials = (name) => {
    if (!name) return "KH";
    return name
      .trim()
      .split(" ")
      .map((n) => n[0])
      .slice(-2)
      .join("")
      .toUpperCase();
  };

  const currentMessages = selectedCustomer
    ? messagesByCustomer[selectedCustomer.id] || []
    : [];

  return (
    <div className="flex flex-col w-full h-[calc(100vh-6.5rem)] overflow-hidden">
      {/* Top Operational Subheader / Quick Context Strip */}
      <div className="flex items-center justify-between px-space-md py-2 bg-surface-container-low/90 backdrop-blur-md rounded-2xl mb-space-sm shadow-xs border border-outline-variant/30 shrink-0">
        <div className="flex items-center gap-space-md flex-wrap">
          <div className="flex items-center gap-space-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <span className="font-label-lg text-label-lg text-primary font-bold">
              Cổng CSKH &amp; Live Chat Trực Tuyến
            </span>
          </div>
          <span className="text-on-surface-variant/40 hidden sm:inline">•</span>
          <div className="hidden sm:flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
              timer
            </span>
            <span>
              Phản hồi TB: <strong className="text-primary font-semibold">1.2 phút</strong>
            </span>
          </div>
          <span className="text-on-surface-variant/40 hidden md:inline">•</span>
          <div className="hidden md:flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              sentiment_very_satisfied
            </span>
            <span>
              Hài lòng: <strong className="text-secondary font-semibold">98.4%</strong> (Hệ thống Velvet)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-xs">
          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold bg-surface-container-lowest px-3 py-1 rounded-full shadow-2xs border border-outline-variant/30">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>Trực ca: {user?.fullName || "Admin Velvet & Brew"}</span>
          </div>
          <button
            type="button"
            onClick={fetchCustomers}
            title="Làm mới danh sách"
            className="p-1.5 bg-surface-container-lowest hover:bg-surface-container text-primary rounded-xl border border-outline-variant/30 cursor-pointer transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px]">
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Studio Grid */}
      <div className="grid grid-cols-12 gap-space-md flex-1 min-h-0">
        {/* ==================== CỘT 1: DANH SÁCH KHÁCH HÀNG THẬT (INBOX) ==================== */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 overflow-hidden min-h-0">
          {/* Tìm kiếm & Bộ lọc */}
          <div className="p-space-md bg-surface-container-low/70 flex flex-col gap-space-xs shrink-0 border-b border-surface-container">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm khách theo tên, SĐT, email..."
                className="w-full pl-9 pr-space-md py-2 bg-surface-container-lowest rounded-full font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant outline-none shadow-2xs border border-outline-variant/30 focus:border-secondary transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <button
                type="button"
                onClick={() => setFilterTier("ALL")}
                className={`px-space-sm py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap cursor-pointer border-0 transition-all ${
                  filterTier === "ALL"
                    ? "bg-primary-container text-white shadow-2xs"
                    : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Tất cả ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTier("VIP")}
                className={`px-space-sm py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap cursor-pointer border-0 transition-all ${
                  filterTier === "VIP"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                }`}
              >
                ⭐ VIP
              </button>
              <button
                type="button"
                onClick={() => setFilterTier("SILVER")}
                className={`px-space-sm py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap cursor-pointer border-0 transition-all ${
                  filterTier === "SILVER"
                    ? "bg-slate-700 text-white shadow-2xs"
                    : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                }`}
              >
                🥈 Bạc
              </button>
              <button
                type="button"
                onClick={() => setFilterTier("MEMBER")}
                className={`px-space-sm py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap cursor-pointer border-0 transition-all ${
                  filterTier === "MEMBER"
                    ? "bg-emerald-700 text-white shadow-2xs"
                    : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                }`}
              >
                ☕ Mới
              </button>
            </div>
          </div>

          {/* Danh sách khách hàng thật */}
          <div className="flex-1 overflow-y-auto p-space-xs flex flex-col gap-1 min-h-0 divide-y divide-surface-container/50">
            {loading ? (
              <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin text-[28px] text-secondary">
                  progress_activity
                </span>
                <span className="text-xs">Đang tải khách hàng từ database...</span>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-xs">
                Không tìm thấy khách hàng nào.
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                const tierInfo = getTierInfo(c.membershipTier);

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className={`p-space-sm rounded-xl cursor-pointer transition-all relative border border-transparent ${
                      isSelected
                        ? "bg-surface-container-low border-secondary/30 shadow-xs"
                        : "hover:bg-surface-container-low/60"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-secondary rounded-r-full" />
                    )}
                    <div className="flex items-start gap-space-sm pl-1.5">
                      <div className="relative shrink-0">
                        {c.avatar ? (
                          <img
                            src={c.avatar}
                            alt={c.fullName}
                            className="w-11 h-11 rounded-full object-cover border border-outline-variant/40 shadow-2xs"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                            {getInitials(c.fullName)}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-container-lowest ${
                            c.isActive ? "bg-secondary" : "bg-red-500"
                          }`}
                          title={c.isActive ? "Đang trực tuyến" : "Tạm khóa"}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className="font-title-sm text-title-sm text-primary font-bold truncate m-0">
                              {c.fullName}
                            </h4>
                            {c.role === "ADMIN" && (
                              <span className="px-1 py-0.2 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                            #KH-{c.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-bold ${tierInfo.badge}`}>
                            {tierInfo.label}
                          </span>
                          <span className="text-[11.5px] text-on-surface-variant truncate">
                            {c.phoneNumber || c.email || "Chưa có liên hệ"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-1 text-[11px] text-on-surface-variant">
                          <span>{c.orderCount || 0} đơn hàng</span>
                          <span className="font-semibold text-primary">
                            {(c.totalSpent || 0).toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ==================== CỘT 2: KHUNG CHAT TRỰC TUYẾN (KHÔNG ĐỂ TIN NHẮN MẪU) ==================== */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-6 flex flex-col bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 overflow-hidden min-h-0">
          {selectedCustomer ? (
            <>
              {/* Chat Header với thông tin khách thật */}
              <div className="px-space-md py-space-sm bg-surface-container-low flex items-center justify-between shrink-0 border-b border-surface-container">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="relative shrink-0">
                    {selectedCustomer.avatar ? (
                      <img
                        src={selectedCustomer.avatar}
                        alt={selectedCustomer.fullName}
                        className="w-10 h-10 rounded-full object-cover shadow-2xs border border-outline-variant/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        {getInitials(selectedCustomer.fullName)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-secondary border-2 border-surface-container-low" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-title-lg text-title-lg text-primary font-bold truncate m-0">
                        {selectedCustomer.fullName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold flex items-center gap-1 ${getTierInfo(selectedCustomer.membershipTier).badge}`}>
                        <span>{getTierInfo(selectedCustomer.membershipTier).label}</span>
                        <span>(#KH-{selectedCustomer.id})</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                      <span className="text-secondary font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Đang trực tuyến
                      </span>
                      <span>•</span>
                      <span>SĐT: <strong className="text-primary">{selectedCustomer.phoneNumber || "Chưa cập nhật"}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Chat Header Actions */}
                <div className="flex items-center gap-space-xs">
                  <button
                    type="button"
                    onClick={() =>
                      alert(`Thực hiện cuộc gọi CSKH tới số ${selectedCustomer.phoneNumber || "chưa có SĐT"}`)
                    }
                    className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-primary transition-all border-0 cursor-pointer shadow-2xs"
                    title="Gọi điện thoại cho khách"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      call
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      alert(`Đã lưu trữ liên hệ chăm sóc khách hàng #${selectedCustomer.id}`)
                    }
                    className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-primary transition-all border-0 cursor-pointer shadow-2xs"
                    title="Thêm lưu ý"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      bookmark_add
                    </span>
                  </button>
                </div>
              </div>

              {/* Messages Timeline: KHÔNG ĐỂ TIN NHẮN MẪU GÌ HẾT */}
              <div className="flex-1 overflow-y-auto p-space-md flex flex-col gap-space-md min-h-0 bg-surface">
                {currentMessages.length === 0 ? (
                  // Empty State hoàn toàn sạch sẽ, không có tin nhắn mẫu nào!
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-on-surface-variant my-auto">
                    <div className="w-16 h-16 rounded-full bg-surface-container-high/60 flex items-center justify-center text-primary mb-3 shadow-2xs">
                      <span className="material-symbols-outlined text-[32px] text-primary/70">
                        chat_bubble_outline
                      </span>
                    </div>
                    <h4 className="font-title-md text-primary font-bold m-0 mb-1">
                      Chưa có tin nhắn trong hội thoại
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm m-0">
                      Khung chat sẵn sàng kết nối. Bạn có thể soạn câu chào hoặc thông tin hỗ trợ bên dưới để gửi tin nhắn trực tiếp đến khách hàng <strong>{selectedCustomer.fullName}</strong>.
                    </p>
                  </div>
                ) : (
                  currentMessages.map((msg) => {
                    const isAdmin = msg.sender === "admin";
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-space-sm max-w-[85%] ${
                          isAdmin ? "self-end flex-row-reverse" : "self-start"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-1 shadow-2xs ${
                            isAdmin
                              ? "bg-primary-container text-white"
                              : "bg-surface-container text-primary"
                          }`}
                        >
                          {isAdmin ? "VB" : getInitials(selectedCustomer.fullName)}
                        </div>
                        <div className={`flex flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-on-surface-variant">
                              {msg.time}
                            </span>
                            <span className="font-label-sm text-label-sm text-primary font-bold">
                              {isAdmin ? "Velvet & Brew (Bạn)" : selectedCustomer.fullName}
                            </span>
                          </div>
                          <div
                            className={`p-space-md rounded-2xl shadow-2xs font-body-md text-body-md leading-relaxed ${
                              isAdmin
                                ? "bg-primary-container text-white rounded-tr-xs"
                                : "bg-surface-container-lowest text-on-surface rounded-tl-xs border border-outline-variant/30"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {/* Cuộn xuống tin nhắn mới nhất */}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar Composer */}
              <div className="p-space-md bg-surface-container-low flex flex-col gap-space-xs shrink-0 border-t border-surface-container">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-space-xs bg-surface-container-lowest rounded-2xl p-1.5 shadow-2xs border border-outline-variant/30"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Nhập câu trả lời cho ${selectedCustomer.fullName}... (Enter để gửi)`}
                    className="flex-1 px-space-sm py-2 bg-transparent text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="px-space-md py-2 rounded-full bg-primary-container disabled:opacity-40 text-white hover:bg-primary font-label-md text-label-md transition-all flex items-center gap-1 shadow-2xs shrink-0 border-0 cursor-pointer"
                  >
                    <span>Gửi</span>
                    <span className="material-symbols-outlined text-[16px]">
                      send
                    </span>
                  </button>
                </form>
                <div className="flex items-center justify-between px-2 text-[11px] text-on-surface-variant">
                  <span>Nhấn <strong>Enter</strong> để gửi tin nhắn hỗ trợ trực tiếp</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-secondary" /> Sẵn sàng kết nối Real-time
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] text-outline mb-2">
                forum
              </span>
              <h3 className="font-title-lg text-primary font-bold">
                Chọn một khách hàng để mở cuộc trò chuyện
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
                Danh sách khách hàng ở cột bên trái đã được đồng bộ trực tiếp từ cơ sở dữ liệu.
              </p>
            </div>
          )}
        </div>

        {/* ==================== CỘT 3: HỒ SƠ KHÁCH HÀNG THẬT (CUSTOMER PROFILE) ==================== */}
        <div className="hidden xl:flex xl:col-span-3 flex-col gap-space-md overflow-y-auto min-h-0">
          {selectedCustomer ? (
            <>
              {/* Customer Card & Loyalty Status */}
              <div className="p-space-md bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Hồ sơ khách hàng
                  </span>
                  <span className="text-[11px] font-bold text-secondary">
                    {selectedCustomer.isActive ? "Đang hoạt động" : "Tạm khóa"}
                  </span>
                </div>

                <div className="flex flex-col items-center text-center my-1">
                  <div className="relative">
                    {selectedCustomer.avatar ? (
                      <img
                        src={selectedCustomer.avatar}
                        alt={selectedCustomer.fullName}
                        className="w-20 h-20 rounded-full object-cover shadow-xs border-2 border-primary/20"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-2xl shadow-xs">
                        {getInitials(selectedCustomer.fullName)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-primary text-white text-[10px] rounded-full font-bold shadow-2xs">
                      {selectedCustomer.membershipTier || "MEMBER"}
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold mt-2 m-0">
                    {selectedCustomer.fullName}
                  </h3>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Mã khách hàng: #KH-{selectedCustomer.id}
                  </span>
                </div>

                {/* VIP Membership Tier Banner */}
                <div className="p-space-sm rounded-xl bg-gradient-to-br from-tertiary-container to-primary text-white shadow-xs flex flex-col gap-1.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-amber-300 text-[18px]">
                        workspace_premium
                      </span>
                      <span className="font-title-sm text-title-sm font-bold text-amber-200">
                        {getTierInfo(selectedCustomer.membershipTier).label}
                      </span>
                    </div>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      {selectedCustomer.brewPoints || 0} Hạt Brew
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-100/80 m-0">
                    Tích lũy từ đơn hàng • Ưu đãi hội viên Velvet Club
                  </p>
                </div>

                {/* Contact Details */}
                <div className="flex flex-col gap-2 mt-1 font-body-sm text-body-sm">
                  <div className="flex items-center gap-space-xs text-on-surface">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                      phone
                    </span>
                    <span className="font-semibold">
                      {selectedCustomer.phoneNumber || "Chưa cập nhật SĐT"}
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs text-on-surface">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                      mail
                    </span>
                    <span className="truncate">
                      {selectedCustomer.email || "Chưa cập nhật Email"}
                    </span>
                  </div>
                  {selectedCustomer.nickname && (
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                        badge
                      </span>
                      <span>Biệt danh: {selectedCustomer.nickname}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lifetime Value & Order History */}
              <div className="p-space-md bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Chỉ số mua sắm
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">
                    Khách hàng thân thiết
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-space-sm bg-surface-container-low rounded-xl flex flex-col">
                    <span className="text-[11px] text-on-surface-variant">Tổng chi tiêu</span>
                    <strong className="font-title-md text-title-md text-primary font-bold mt-0.5">
                      {(selectedCustomer.totalSpent || 0).toLocaleString("vi-VN")}đ
                    </strong>
                  </div>
                  <div className="p-space-sm bg-surface-container-low rounded-xl flex flex-col">
                    <span className="text-[11px] text-on-surface-variant">Đơn hoàn thành</span>
                    <strong className="font-title-md text-title-md text-primary font-bold mt-0.5">
                      {selectedCustomer.orderCount || 0} đơn
                    </strong>
                  </div>
                </div>

                {/* Danh sách đơn hàng thật từ database */}
                <div className="flex flex-col gap-2 mt-1">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">
                    Đơn hàng gần nhất ({selectedCustomer.orders?.length || 0})
                  </span>

                  {!selectedCustomer.orders || selectedCustomer.orders.length === 0 ? (
                    <div className="p-3 bg-surface-container-low rounded-xl text-center text-[12px] text-on-surface-variant">
                      Chưa phát sinh đơn hàng nào.
                    </div>
                  ) : (
                    selectedCustomer.orders.slice(0, 3).map((ord) => (
                      <div
                        key={ord.id}
                        className="p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between text-xs"
                      >
                        <div className="flex flex-col">
                          <strong className="text-primary font-mono font-bold">
                            #ĐH-{ord.id}
                          </strong>
                          <span className="text-[11px] text-on-surface-variant">
                            {new Date(ord.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <div className="text-right">
                          <strong className="text-primary block font-bold">
                            {Number(ord.totalAmount).toLocaleString("vi-VN")}đ
                          </strong>
                          <span className="text-[10px] font-semibold text-secondary">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Internal Notes */}
              <div className="p-space-md bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Ghi chú nội bộ CSKH
                  </span>
                  <span className="material-symbols-outlined text-secondary text-[16px]">
                    verified_user
                  </span>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-xl flex flex-col gap-1 text-[12px] text-on-surface">
                  <div className="flex items-center gap-1 font-bold text-primary">
                    <span className="material-symbols-outlined text-[14px] text-secondary">
                      check_circle
                    </span>
                    Ghi chú chăm sóc:
                  </div>
                  <p className="text-on-surface-variant m-0">
                    Khách hàng #{selectedCustomer.id} ({selectedCustomer.fullName}) thuộc nhóm hội viên {selectedCustomer.membershipTier}. Ưu tiên tư vấn món mới và phản hồi nhanh qua Live Chat.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-on-surface-variant text-sm">
              Chọn một khách hàng để xem chi tiết hồ sơ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
