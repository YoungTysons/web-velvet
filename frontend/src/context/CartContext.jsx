import { createContext, useContext, useState, useEffect } from "react";
import { amount } from "../utils/format";
import { mockProducts } from "../constants/mockProducts";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("velvet_cart");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Lỗi đọc giỏ hàng từ localStorage:", e);
    }
    return [{ ...mockProducts[0], quantity: 1 }];
  });

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [custom, setCustom] = useState({
    size: 0,
    sugar: "70%",
    ice: "Chuẩn",
    toppings: [],
  });

  // Tự động lưu giỏ hàng vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem("velvet_cart", JSON.stringify(cart));
    } catch (e) {
      console.warn("Lỗi lưu giỏ hàng vào localStorage:", e);
    }
  }, [cart]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.unitPrice || 0) * item.quantity,
    0
  );

  const addToCart = (product, customConfig) => {
    if (!product) return;
    const cfg = customConfig || custom;
    const sizeExtra = Number(cfg.size) || 0;
    const sizeName =
      sizeExtra === 12000 ? "Size L" : sizeExtra === 6000 ? "Size M" : "Size S";
    const toppingTotal = (cfg.toppings || []).reduce(
      (sum, t) => sum + (Number(t.price) || 0),
      0
    );
    const basePrice = amount(product.price || product.basePrice) || 50000;
    const finalUnitPrice = basePrice + sizeExtra + toppingTotal;

    const cartItem = {
      ...product,
      cartItemId: `${product.id}-${Date.now()}`,
      size: sizeName,
      sizePrice: sizeExtra,
      sugar: cfg.sugar || "100%",
      ice: cfg.ice || "Chuẩn",
      toppings: cfg.toppings || [],
      unitPrice: finalUnitPrice,
      quantity: 1,
    };

    setCart((current) => [...current, cartItem]);
    setDrawerOpen(true);
    setCustom({
      size: 0,
      sugar: "70%",
      ice: "Chuẩn",
      toppings: [],
    });
  };

  const changeQuantity = (id, change) => {
    setCart((current) =>
      current.flatMap((item) => {
        const isMatch = item.cartItemId === id || item.id === id;
        if (!isMatch) return [item];
        if (item.quantity + change < 1) return [];
        return [{ ...item, quantity: item.quantity + change }];
      })
    );
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        cartCount,
        cartTotal,
        drawerOpen,
        setDrawerOpen,
        custom,
        setCustom,
        addToCart,
        changeQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart phải được sử dụng bên trong CartProvider");
  }
  return context;
}

export default CartContext;
