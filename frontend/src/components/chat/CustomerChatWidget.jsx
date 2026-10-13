import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { io } from "socket.io-client";
import axiosClient from "../../api/axiosClient";
import axios from "axios";

export default function CustomerChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("bot"); // 'bot' | 'admin'
  const [unreadCount, setUnreadCount] = useState(1);

  // Danh sách tin nhắn tab Chatbot
  const [botMessages, setBotMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Xin chào quý khách! Tôi là Velvet Bot ☕. Tôi có thể giúp quý khách tìm món uống yêu thích, săn ưu đãi hoặc giải đáp thắc mắc ngay lập tức ạ!",
      time: "Vừa xong",
    },
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Danh sách tin nhắn tab Admin
  const [adminMessages, setAdminMessages] = useState([
    {
      id: 1,
      sender: "admin",
      text: "Dạ Velvet & Brew xin chào quý khách! Chuyên viên chăm sóc khách hàng đang trực tuyến. Quý khách cần hỗ trợ về đơn hàng hay sản phẩm nào ạ?",
      time: "Vừa xong",
    },
  ]);
  const [isAdminTyping, setIsAdminTyping] = useState(false);

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Kết nối Socket và tải lịch sử chat khi người dùng đăng nhập
  useEffect(() => {
    if (!user) return; // Nếu khách chưa đăng nhập thì không kết nối socket

    // a. Khởi tạo kết nối tới backend
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
        : "http://localhost:8080");
    socketRef.current = io(socketUrl);

    // b. Vào phòng chat riêng của khách hàng này
    socketRef.current.emit("join_room", user.id);

    // c. Tải lịch sử tin nhắn cũ từ API đã tạo ở Bước 4
    axiosClient
      .get(`/chat/messages/${user.id}`)
      .then((res) => {
        if (res && res.messages && res.messages.length > 0) {
          // Format tin nhắn từ DB để hiển thị
          const loadedMsgs = res.messages.map((m) => ({
            id: m.id,
            sender: m.senderRole === "CUSTOMER" ? "user" : "admin",
            text: m.content,
            time: new Date(m.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));
          setAdminMessages(loadedMsgs);
        }
      })
      .catch((err) => console.error("Lỗi tải lịch sử chat:", err));

    // d. Lắng nghe tin nhắn mới phát từ server (khi Admin nhắn lại)
    socketRef.current.on("receive_message", (newMsg) => {
      // Chỉ nhận tin nhắn của phòng này
      setAdminMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [
          ...prev,
          {
            id: newMsg.id,
            sender: newMsg.senderRole === "CUSTOMER" ? "user" : "admin",
            text: newMsg.content,
            time: new Date(newMsg.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ];
      });
    });

    // Ngắt kết nối khi component bị tắt
    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);


  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [isOpen, botMessages, adminMessages, activeTab]);

  // Bộ câu trả lời thông minh của Chatbot
  const getBotResponse = (query) => {
    const q = query.toLowerCase();

    if (q.includes("món") || q.includes("uống") || q.includes("bán chạy") || q.includes("menu") || q.includes("gợi ý")) {
      return "Hiện tại Velvet & Brew có các món 'Best Seller' được yêu thích nhất:\n1. ☕ Cà phê sữa truyền thống (45.000đ) - Đậm đà Buôn Ma Thuột.\n2. 🧋 Trà sữa Oolong Nướng (49.000đ) - Hương khói thơm béo thanh.\n3. 🧂 Cà phê Muối Cố Đô (52.000đ) - Kem béo mặn sánh mịn.\n4. 🍓 Matcha Latte Kem Cheese (55.000đ) - Uji thượng hạng.\nBạn có thể nhấn vào Menu trên trang chủ để xem chi tiết và đặt hàng nhé!";
    }

    if (q.includes("khuyến mãi") || q.includes("mã") || q.includes("voucher") || q.includes("giảm giá") || q.includes("ưu đãi")) {
      return "🎉 Velvet & Brew đang có các mã ưu đãi hấp dẫn:\n• VELVETNEW: Giảm ngay 20.000đ cho đơn đầu tiên từ 50k.\n• FREESHIP: Miễn phí vận chuyển (tối đa 25k) cho đơn từ 100k.\n• VELVET50: Giảm 50k đặc quyền cho hội viên VIP Gold.\nNhớ áp dụng mã tại bước thanh toán để nhận ưu đãi nhé!";
    }

    if (q.includes("giao hàng") || q.includes("ship") || q.includes("thời gian") || q.includes("bao lâu")) {
      return "🛵 Thời gian giao hàng tiêu chuẩn là 20 - 30 phút trong bán kính 5km từ chi nhánh Flagship. Đồ uống luôn được đóng gói túi zip giữ nhiệt và đá riêng để giữ trọn vị ngon nhất ạ!";
    }

    if (q.includes("tích điểm") || q.includes("hạt") || q.includes("brew") || q.includes("hội viên") || q.includes("vip")) {
      return "💎 Chính sách Velvet Club:\n• Mỗi 1.000đ chi tiêu = 1 Hạt Brew tích lũy.\n• Hạt Brew dùng để đổi voucher giảm giá hoặc đồ uống miễn phí.\n• Nâng hạng: Bạc (Silver) → Vàng (Gold) → Kim Cương (Diamond) với vô vàn đặc quyền quà sinh nhật!";
    }

    if (q.includes("địa chỉ") || q.includes("ở đâu") || q.includes("chi nhánh") || q.includes("giờ")) {
      return "📍 Cửa hàng Flagship Velvet & Brew:\n• Địa chỉ: 124 Phố Cổ, Quận Hoàn Kiếm, Hà Nội.\n• Giờ mở cửa: 07:00 - 22:30 hàng ngày.\n• Hotline CSKH: 1900 8822.";
    }

    return "Cảm ơn câu hỏi của bạn! Bạn có thể chuyển sang tab '👤 Nhắn Admin' ở phía trên để được chuyên viên chăm sóc khách hàng hỗ trợ chi tiết hơn về yêu cầu này nhé ạ! ☕✨";
  };

  // Xử lý gửi tin nhắn
  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const timeNow = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: userText,
      time: timeNow,
    };

    setInputText("");

    if (activeTab === "bot") {
      setBotMessages((prev) => [...prev, userMsg]);
      setIsBotTyping(true);

      setTimeout(() => {
        const replyText = getBotResponse(userText);
        setBotMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "bot",
            text: replyText,
            time: new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        setIsBotTyping(false);
      }, 700);
    } else {
      // Gửi tin nhắn đến Admin qua Socket thật
      if (!user) {
        alert("Vui lòng đăng nhập tài khoản để gửi tin nhắn đến Admin nhé!");
        return;
      }

      if (socketRef.current) {
        socketRef.current.emit("send_message", {
          customerId: user.id,
          senderId: user.id,
          senderRole: "CUSTOMER",
          content: userText,
        });
      }
    }

  };

  // Chọn câu hỏi gợi ý nhanh
  const handleQuickQuestion = (questionText) => {
    setInputText(questionText);
    setTimeout(() => {
      const timeNow = new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const userMsg = {
        id: Date.now(),
        sender: "user",
        text: questionText,
        time: timeNow,
      };
      setBotMessages((prev) => [...prev, userMsg]);
      setIsBotTyping(true);

      setTimeout(() => {
        const replyText = getBotResponse(questionText);
        setBotMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "bot",
            text: replyText,
            time: new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        setIsBotTyping(false);
      }, 600);
    }, 50);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* ================= CỬA SỔ CHAT POPUP ================= */}
      {isOpen && (
        <div className="mb-3 w-[360px] sm:w-[400px] h-[550px] max-h-[80vh] bg-surface-container-lowest rounded-3xl border border-outline-variant/40 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header Cửa sổ Chat */}
          <div className="p-3.5 px-4 bg-primary text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary-container border border-amber-300/40 flex items-center justify-center text-white shadow-xs">
                  <span className="material-symbols-outlined text-[22px] text-amber-200">
                    {activeTab === "bot" ? "smart_toy" : "support_agent"}
                  </span>
                </div>
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full absolute bottom-0 right-0 border-2 border-primary" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-title-sm text-white font-bold m-0 leading-tight flex items-center gap-1.5">
                  <span>Velvet &amp; Brew CSKH</span>
                  <span className="text-[10px] bg-secondary px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider text-white">
                    Live
                  </span>
                </h3>
                <span className="text-[11px] text-amber-100/80 mt-0.5">
                  {activeTab === "bot"
                    ? "Trợ lý ảo Velvet AI • Phản hồi tức thì"
                    : "Chuyên viên hỗ trợ trực tuyến"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full border-0 cursor-pointer transition-colors"
                title="Thu nhỏ"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>
          </div>

          {/* Tab Selector: Trợ lý AI vs Nhắn Admin */}
          <div className="bg-surface-container-low p-1.5 px-3 flex items-center gap-1.5 border-b border-surface-container">
            <button
              type="button"
              onClick={() => setActiveTab("bot")}
              className={`flex-1 py-1.5 rounded-xl font-label-sm text-label-sm font-bold flex items-center justify-center gap-1.5 border-0 cursor-pointer transition-all ${activeTab === "bot"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "bg-transparent text-on-surface-variant hover:text-primary"
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                smart_toy
              </span>
              <span>Trợ lý AI (Bot)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`flex-1 py-1.5 rounded-xl font-label-sm text-label-sm font-bold flex items-center justify-center gap-1.5 border-0 cursor-pointer transition-all ${activeTab === "admin"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "bg-transparent text-on-surface-variant hover:text-primary"
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                support_agent
              </span>
              <span>Nhắn Admin</span>
            </button>
          </div>

          {/* Vùng Tin nhắn */}
          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3 bg-surface/40">
            {activeTab === "bot" ? (
              <>
                {botMessages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"
                        }`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line shadow-2xs ${isUser
                          ? "bg-primary text-white rounded-br-xs"
                          : "bg-surface-container-lowest text-primary rounded-bl-xs border border-outline-variant/30"
                          }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-on-surface-variant mt-1 px-1">
                        {msg.time}
                      </span>
                    </div>
                  );
                })}

                {isBotTyping && (
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-container-lowest px-3 py-2 rounded-2xl rounded-bl-xs border border-outline-variant/30 w-fit">
                    <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-[11px]">Velvet Bot đang soạn tin...</span>
                  </div>
                )}

                {/* Quick Prompts / Chips gợi ý câu hỏi */}
                <div className="mt-2 pt-2 border-t border-surface-container/60 flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-amber-600">
                      lightbulb
                    </span>
                    Gợi ý câu hỏi nhanh:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickQuestion("Gợi ý các món bán chạy nhất hôm nay")}
                      className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-full text-[11px] font-semibold text-primary border-0 cursor-pointer transition-colors shadow-2xs"
                    >
                      ☕ Món bán chạy nhất
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickQuestion("Có mã giảm giá voucher nào không?")}
                      className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-full text-[11px] font-semibold text-primary border-0 cursor-pointer transition-colors shadow-2xs"
                    >
                      🎁 Mã giảm giá hôm nay
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickQuestion("Thời gian và phí giao hàng như thế nào?")}
                      className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-full text-[11px] font-semibold text-primary border-0 cursor-pointer transition-colors shadow-2xs"
                    >
                      🛵 Thời gian giao hàng
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickQuestion("Chính sách tích điểm Hạt Brew và thăng hạng?")}
                      className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-full text-[11px] font-semibold text-primary border-0 cursor-pointer transition-colors shadow-2xs"
                    >
                      💎 Tích điểm hội viên
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {adminMessages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"
                        }`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line shadow-2xs ${isUser
                          ? "bg-secondary text-white rounded-br-xs"
                          : "bg-surface-container-lowest text-primary rounded-tl-xs border border-outline-variant/30"
                          }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-on-surface-variant mt-1 px-1">
                        {msg.time}
                      </span>
                    </div>
                  );
                })}

                {isAdminTyping && (
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-container-lowest px-3 py-2 rounded-2xl rounded-bl-xs border border-outline-variant/30 w-fit">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-[11px]">Chuyên viên đang phản hồi...</span>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập tin nhắn */}
          <form
            onSubmit={handleSend}
            className="p-2.5 bg-surface-container-lowest border-t border-surface-container flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeTab === "bot"
                  ? "Hỏi Velvet Bot về menu, voucher, giao hàng..."
                  : "Nhập tin nhắn gửi đến chuyên viên hỗ trợ..."
              }
              className="flex-1 px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-primary font-body-sm text-[13px] focus:outline-none focus:border-secondary transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-xl bg-primary hover:bg-primary-container disabled:opacity-40 text-white flex items-center justify-center border-0 cursor-pointer transition-all shadow-xs shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">
                send
              </span>
            </button>
          </form>
        </div>
      )}

      {/* ================= NÚT FLOATING ICON GÓC PHẢI DƯỚI ================= */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-full shadow-2xl hover:shadow-[0_8px_25px_rgba(39,19,16,0.35)] transition-all transform hover:scale-105 active:scale-95 border border-amber-400/30 cursor-pointer"
      >
        <div className="relative">
          <span className="material-symbols-outlined text-[24px] text-amber-200 transition-transform group-hover:rotate-12">
            {isOpen ? "close" : "chat"}
          </span>
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary rounded-full animate-ping" />
          )}
        </div>
        <span className="font-label-md text-label-md font-bold tracking-tight pr-1">
          {isOpen ? "Đóng chat" : "Hỗ trợ & Chat Bot"}
        </span>
      </button>
    </div>
  );
}
