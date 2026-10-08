import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "3rem",
            maxWidth: "700px",
            margin: "4rem auto",
            backgroundColor: "#fff",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            border: "1px solid #fee2e2",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "28px",
            }}
          >
            ⚠️
          </div>
          <h2 style={{ color: "#1c1c18", marginBottom: "0.5rem" }}>
            Đã có lỗi xảy ra khi hiển thị giao diện
          </h2>
          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "1.5rem" }}>
            Hệ thống đã ghi nhận lỗi này. Vui lòng bấm làm mới hoặc liên hệ quản trị viên.
          </p>
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fef2f2",
              borderRadius: "8px",
              color: "#991b1b",
              fontSize: "13px",
              textAlign: "left",
              fontFamily: "monospace",
              marginBottom: "1.5rem",
              overflowX: "auto",
            }}
          >
            {this.state.error?.message || String(this.state.error)}
          </div>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#3e2723",
                color: "#fff",
                border: "none",
                borderRadius: "9999px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🔄 Tải lại trang
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = "";
              }}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#f1ede6",
                color: "#3e2723",
                border: "none",
                borderRadius: "9999px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ← Quay về trang chủ
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
