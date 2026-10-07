import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import logoIcon from "../../assets/logo-icon.png";

export default function Header({
  cartCount,
  onOpenCart,
  searchQuery = "",
  onSearchChange,
  onOpenAdmin,
  onOpenAuth,
  onOpenProfile,
  onOpenOrders,
}) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [query, setQuery] = useState(searchQuery || "");
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const isAdmin = !!(user && (user.role || "").toUpperCase() === "ADMIN");

  // Đồng bộ search query nếu có prop truyền vào
  useEffect(() => {
    if (searchQuery !== undefined) {
      setQuery(searchQuery);
    }
  }, [searchQuery]);

  // Tự động focus vào ô nhập khi mở thanh tìm kiếm
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Đóng thanh tìm kiếm khi bấm ra ngoài nếu ô tìm kiếm đang trống
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        if (!query.trim()) {
          setIsSearchOpen(false);
        }
      }
    };
    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen, query]);

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleClearOrClose = () => {
    if (query) {
      setQuery("");
      if (onSearchChange) onSearchChange("");
      if (searchInputRef.current) searchInputRef.current.focus();
    } else {
      setIsSearchOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsSearchOpen(false);
    } else if (e.key === "Enter") {
      const menuSection = document.getElementById("menu-grid");
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const navItems = [
    "Trang chủ",
    "Thực đơn",
    "Cà phê",
    "Trà sữa",
    "Khuyến mãi",
    "Giới thiệu",
    "Liên hệ",
  ];

  // Lấy 2 chữ cái viết tắt của họ tên
  // Lấy chữ cái dự phòng từ họ tên thật
  const fallbackInitials = user?.fullName
    ? user.fullName
      .trim()
      .split(" ")
      .map((n) => n[0])
      .slice(-2)
      .join("")
      .toUpperCase()
    : "VB";

  // Hàm render Avatar dùng chung cho cả nút Header và Popup
  const renderAvatar = (size = 36) => {
    if (user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user.fullName || "Avatar"}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            // Nếu link ảnh Cloudinary bị lỗi thì ẩn ảnh đi để lộ chữ viết tắt
            e.target.style.display = "none";
          }}
        />
      );
    }
    return fallbackInitials;
  };

  return (
    <header>
      <div className="header-inner">
        <a className="brand" href="#top">
          <img src={logoIcon} alt="Velvet & Brew" className="brand-logo-img" />
          <span>
            <strong>Velvet &amp; Brew</strong>
            <small>ARTISANAL COFFEE &amp; TEA</small>
          </span>
        </a>
        <nav>
          {navItems.map((item, index) => (
            <a
              className={index === 0 ? "active" : ""}
              href={index === 1 ? "#menu-grid" : "#top"}
              key={item}
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          {/* Thanh tìm kiếm mở rộng khi click icon */}
          <div className="header-search-wrap" ref={searchContainerRef}>
            {!isSearchOpen ? (
              <button
                className="search-toggle-btn"
                onClick={handleOpenSearch}
                title="Tìm kiếm đồ uống"
                type="button"
              >
                <span className="material-symbols-outlined">search</span>
              </button>
            ) : (
              <div className="header-search-bar">
                <span className="material-symbols-outlined header-search-icon">
                  search
                </span>
                <input
                  ref={searchInputRef}
                  className="header-search-input"
                  type="text"
                  placeholder="Tìm kiếm đồ uống..."
                  value={query}
                  onChange={handleQueryChange}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className="header-search-close-btn"
                  onClick={handleClearOrClose}
                  title={query ? "Xóa từ khóa" : "Đóng tìm kiếm"}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            )}
          </div>
          <button className="notification" title="Thông báo" type="button">
            <span className="material-symbols-outlined">notifications</span>
            <i />
          </button>
          <button className="cart-button" onClick={onOpenCart} title="Giỏ hàng" type="button">
            <span className="material-symbols-outlined">shopping_bag</span>
            <b>{cartCount}</b>
          </button>

          {/* Nút truy cập nhanh Admin Portal - CHỈ HIỂN THỊ KHI LÀ ADMIN */}
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              title="Mở Trang Quản Trị Hệ Thống (Admin Portal)"
              type="button"
              style={{
                width: "auto",
                padding: "0 13px",
                height: "36px",
                borderRadius: "18px",
                background: "#3e2723",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
                border: "none",
                boxShadow: "0 2px 8px rgba(62, 39, 35, 0.15)",
                transition: "transform 0.15s ease, opacity 0.15s ease",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                admin_panel_settings
              </span>
              <span>Admin</span>
            </button>
          )}

          {/* KHI CHƯA ĐĂNG NHẬP: HIỂN THỊ NÚT ĐĂNG NHẬP DẠNG ICON */}
          {!user ? (
            <button
              onClick={onOpenAuth}
              title="Đăng nhập tài khoản"
              type="button"
              style={{
                width: "37px",
                height: "37px",
                minWidth: "37px",
                borderRadius: "50%",
                background: "#271310",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(39, 19, 16, 0.15)",
                transition: "transform 0.15s ease, opacity 0.15s ease",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "21px" }}>
                person
              </span>
            </button>
          ) : (
            /* KHI ĐÃ ĐĂNG NHẬP: AVATAR & DROPDOWN MENU */
            <div style={{ position: "relative" }}>
              <button
                className="avatar-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                title={`${user.fullName || "Khách hàng"} (Bấm để xem tài khoản)`}
                type="button"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  className="avatar"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {renderAvatar(36)}
                </span>
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "42px",
                    background: "#ffffff",
                    borderRadius: "14px",
                    boxShadow: "0 10px 30px rgba(43, 23, 19, 0.18), 0 0 0 1px rgba(211, 195, 192, 0.5)",
                    padding: "12px",
                    minWidth: "220px",
                    zIndex: 100,
                    animation: "authScaleUp 0.18s ease-out",
                  }}
                >
                  <div
                    style={{
                      padding: "4px 6px 10px 6px",
                      borderBottom: "1px solid #f1ede6",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13.5px",
                        fontWeight: "700",
                        color: "#271310",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user?.fullName || "Khách hàng"}
                    </div>
                    <div style={{ color: "#756762", fontSize: "11.5px", marginTop: "2px" }}>
                      {user?.phoneNumber || user?.email || "Hội viên Velvet Club"}
                    </div>
                    <div style={{ marginTop: "6px" }}>
                      <span
                        style={{
                          fontSize: "10.5px",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: isAdmin ? "#ffdcc3" : "#e6f4ea",
                          color: isAdmin ? "#6e3900" : "#137333",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          display: "inline-block",
                        }}
                      >
                        {isAdmin ? "Quản trị viên (Admin)" : "Hội viên Velvet Club"}
                      </span>
                    </div>
                  </div>

                  {/* Nút Trang Quản Trị - CHỈ HIỂN THỊ KHI LÀ ADMIN */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (onOpenAdmin) onOpenAdmin();
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "9px 12px",
                        background: "#f1ede6",
                        color: "#271310",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "6px",
                        transition: "background 0.2s",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "17px", color: "#3e2723" }}>
                        dashboard
                      </span>
                      <span>Trang Quản Trị (Admin)</span>
                    </button>
                  )}

                  {/* NÚT THÔNG TIN KHÁCH HÀNG */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenProfile) {
                        onOpenProfile();
                      } else {
                        setShowProfileModal(true);
                      }
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "9px 12px",
                      background: "#fdf9f2",
                      color: "#271310",
                      border: "1px solid #e6e2db",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "6px",
                      transition: "background 0.2s",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "17px", color: "#8a5100" }}>
                      badge
                    </span>
                    <span>Thông tin khách hàng</span>
                  </button>

                  {/* NÚT LỊCH SỬ ĐƠN HÀNG */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenOrders) {
                        onOpenOrders();
                      } else {
                        window.location.hash = "orders";
                      }
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "9px 12px",
                      background: "#fdf9f2",
                      color: "#271310",
                      border: "1px solid #e6e2db",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "6px",
                      transition: "background 0.2s",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "17px", color: "#8a5100" }}>
                      receipt_long
                    </span>
                    <span>Lịch sử đơn hàng</span>
                  </button>

                  {/* Nút Đăng xuất */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "9px 12px",
                      background: "#ffdad6",
                      color: "#93000a",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "background 0.2s",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
                      logout
                    </span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* POPUP THÔNG TIN KHÁCH HÀNG */}
      {showProfileModal && user && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setShowProfileModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 45px rgba(39, 19, 16, 0.25)",
              overflow: "hidden",
              border: "1px solid #ebdcd6",
              animation: "authScaleUp 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Thẻ VIP */}
            <div
              style={{
                background: "linear-gradient(135deg, #271310 0%, #4a2821 50%, #6e3900 100%)",
                padding: "24px 20px 20px 20px",
                color: "#ffffff",
                position: "relative",
              }}
            >
              <button
                onClick={() => setShowProfileModal(false)}
                type="button"
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "none",
                  color: "#ffffff",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                ✕
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#ffdcc3",
                    color: "#271310",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: "800",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  }}
                >
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "700" }}>
                    {user.fullName || "Khách Hàng"}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "2px" }}>
                    Mã khách hàng: #KH-{user.id || "8821"}
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 10px",
                        borderRadius: "12px",
                        background: "rgba(255, 255, 255, 0.2)",
                        color: "#fff",
                        fontWeight: "600",
                        letterSpacing: "0.5px",
                      }}
                    >
                      ⭐️ {isAdmin ? "Tài khoản Quản trị viên" : "Hội viên Velvet Club Thân thiết"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chi tiết thông tin */}
            <div style={{ padding: "20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    background: "#fdf9f2",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid #f1ede6",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#8a5100", fontWeight: "600" }}>
                    ĐIỂM TÍCH LŨY BREW
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "#271310", marginTop: "2px" }}>
                    120 Hạt
                  </div>
                </div>
                <div
                  style={{
                    background: "#fdf9f2",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid #f1ede6",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#137333", fontWeight: "600" }}>
                    ƯU ĐÃI KHẢ DỤNG
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "#271310", marginTop: "2px" }}>
                    3 Voucher
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px dashed #e6e2db",
                  }}
                >
                  <span style={{ color: "#756762" }}>Số điện thoại:</span>
                  <strong style={{ color: "#271310" }}>{user.phoneNumber || "Chưa cập nhật"}</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px dashed #e6e2db",
                  }}
                >
                  <span style={{ color: "#756762" }}>Email:</span>
                  <strong style={{ color: "#271310" }}>{user.email || "Chưa cập nhật"}</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px dashed #e6e2db",
                  }}
                >
                  <span style={{ color: "#756762" }}>Vai trò hệ thống:</span>
                  <strong style={{ color: isAdmin ? "#b3261e" : "#1b6d24" }}>
                    {isAdmin ? "Quản trị viên (ADMIN)" : "Khách hàng (CUSTOMER)"}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                  }}
                >
                  <span style={{ color: "#756762" }}>Chi nhánh ưa thích:</span>
                  <strong style={{ color: "#271310" }}>124 Phố Cổ, Hoàn Kiếm, HN</strong>
                </div>
              </div>

              {/* Nút hành động */}
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    background: "#f1ede6",
                    color: "#271310",
                    border: "none",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    logout();
                  }}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    background: "#ffdad6",
                    color: "#93000a",
                    border: "none",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    logout
                  </span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
