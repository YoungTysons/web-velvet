import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";

export default function MenuSection({
  products,
  activeFilter,
  onSelectFilter,
  onSelectProduct,
  loading,
  searchQuery,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Tự động quay về trang 1 khi người dùng đổi danh mục hoặc nhập tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  const tabs = [
    ["all", "Tất cả"],
    ["coffee", "Cà phê"],
    ["milktea", "Trà sữa"],
    ["fruittea", "Trà trái cây"],
    ["special", "Đặc sắc"],
    ["freshjuice", "Nước ép"],
  ];

  // Tính toán phân trang
  const totalItems = products ? products.length : 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = products ? products.slice(startIndex, endIndex) : [];

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    const menuEl = document.getElementById("menu-grid");
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="menu-section" id="menu-grid">
      <div className="section-heading menu-heading">
        <div>
          <span className="hot-label">
            ★ MÓN CHẠY NHẤT · YÊU THÍCH NHẤT THÁNG
          </span>
          <h2>
            {searchQuery ? (
              <>Kết quả tìm kiếm: &ldquo;{searchQuery}&rdquo;</>
            ) : (
              "Tuyển Chọn Đồ Uống Trứ Danh"
            )}
          </h2>
        </div>
        <div className="tabs">
          {tabs.map(([id, title]) => (
            <button
              className={activeFilter === id ? "active" : ""}
              onClick={() => onSelectFilter(id)}
              key={id}
            >
              {title}
            </button>
          ))}
        </div>
      </div>

      <div className="product-grid">
        {loading ? (
          <p style={{ textAlign: "center", gridColumn: "1 / -1", padding: "40px" }}>
            Đang tải thực đơn...
          </p>
        ) : totalItems === 0 ? (
          <p style={{ textAlign: "center", gridColumn: "1 / -1", padding: "40px", color: "var(--muted)" }}>
            {searchQuery
              ? `Không tìm thấy đồ uống nào phù hợp với từ khóa "${searchQuery}".`
              : "Chưa có sản phẩm nào trong danh mục này."}
          </p>
        ) : (
          currentProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={onSelectProduct}
            />
          ))
        )}
      </div>

      {/* Thanh Phân Trang (Chỉ hiện khi có hơn 1 trang) */}
      {!loading && totalItems > 0 && totalPages > 1 && (
        <div className="pagination-wrapper">
          <div className="pagination-info">
            Hiển thị <strong>{startIndex + 1} - {Math.min(endIndex, totalItems)}</strong> trong tổng số <strong>{totalItems}</strong> món
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn pagination-prev"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              aria-label="Trang trước"
            >
              &larr; Trang trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`pagination-btn pagination-number ${page === currentPage ? "active" : ""}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="pagination-btn pagination-next"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              aria-label="Trang sau"
            >
              Trang sau &rarr;
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
