const prisma = require("../src/config/db");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🌱 Đang thực thi nạp 9 sản phẩm vào cơ sở dữ liệu cafe_db...");

  const productsData = [
    {
      id: 1,
      name: "Cà phê sữa truyền thống",
      category: "coffee",
      description: "Đậm đà Robusta Buôn Ma Thuột phối cùng Arabica Cầu Đất, hòa quyện sữa đặc ngọt dịu.",
      basePrice: 45000,
      image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=700&q=85",
      isBestSeller: true,
      isActive: true,
    },
    {
      id: 2,
      name: "Trà sữa Oolong Nướng",
      category: "milktea",
      description: "Lá trà Ô Long sấy chậm đượm hương khói thơm lừng, kết hợp cốt sữa thanh béo tròn vị.",
      basePrice: 49000,
      image: "https://images.unsplash.com/photo-1558857563-b371033873b8?w=700&q=85",
      isBestSeller: true,
      isActive: true,
    },
    {
      id: 3,
      name: "Bạc xỉu Sài Gòn 3 tầng",
      category: "coffee",
      description: "Sữa tươi béo ngậy hòa cùng sữa đặc ngọt thơm và tầng cà phê Robusta nồng nàn sóng sánh.",
      basePrice: 50000,
      image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=700&q=85",
      isBestSeller: false,
      isActive: true,
    },
    {
      id: 4,
      name: "Matcha Latte Kem Cheese",
      category: "special",
      description: "Bột Matcha Uji Nhật Bản thượng hạng hòa quyện lớp macchiato kem cheese dẻo mặn.",
      basePrice: 55000,
      image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=700&q=85",
      isBestSeller: true,
      isActive: true,
    },
    {
      id: 5,
      name: "Trà Đào Cam Sả Tươi",
      category: "fruittea",
      description: "Hương sả thanh dịu quyện nước cốt cam vàng mọng nước và miếng đào giòn ngọt mát lạnh.",
      basePrice: 48000,
      image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=700&q=85",
      isBestSeller: false,
      isActive: true,
    },
    {
      id: 6,
      name: "Cà phê Muối Cố Đô",
      category: "coffee",
      description: "Lớp kem muối biển sánh mịn béo mặn nhẹ cân bằng hoàn hảo hậu vị đắng đậm đà nguyên bản.",
      basePrice: 52000,
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700&q=85",
      isBestSeller: true,
      isActive: true,
    },
    {
      id: 7,
      name: "Sữa Tươi Trân Châu Đường Đen",
      category: "milktea",
      description: "Sữa tươi thanh trùng Đà Lạt hòa quyện sốt đường đen mật mía dẻo thơm ấm nóng.",
      basePrice: 55000,
      image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=700&q=85",
      isBestSeller: false,
      isActive: true,
    },
    {
      id: 8,
      name: "Cacao Dừa Tuyết Đá Xay",
      category: "special",
      description: "Cacao nguyên chất Đắk Lắk đậm đà xay tuyết cùng cốt dừa tươi Bến Tre béo thơm ngọt lành.",
      basePrice: 58000,
      image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=700&q=85",
      isBestSeller: false,
      isActive: true,
    },
    {
      id: 9,
      name: "Cold Brew Cam Vàng Thảo Mộc",
      category: "coffee",
      description: "Cà phê ủ lạnh 16 giờ chiết xuất từng giọt tinh túy, kết hợp cam vàng California và hương thảo tươi mát.",
      basePrice: 62000,
      image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=700&q=85",
      isBestSeller: true,
      isActive: true,
    },
  ];

  const toppingsData = [
    { id: 1, name: "Trân châu đen mật mía", price: 5000 },
    { id: 2, name: "Trân châu hoàng kim dai giòn", price: 7000 },
    { id: 3, name: "Kem Cheese dẻo", price: 10000 },
  ];

  // 1. Upsert toppings
  for (const t of toppingsData) {
    await prisma.topping.upsert({
      where: { id: t.id },
      update: { name: t.name, price: t.price },
      create: t,
    });
  }

  // 2. Upsert products and their sizes + toppings
  for (const p of productsData) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        category: p.category,
        description: p.description,
        basePrice: p.basePrice,
        image: p.image,
        isBestSeller: p.isBestSeller,
        isActive: p.isActive,
      },
      create: p,
    });

    // Delete old sizes for this product
    await prisma.productSize.deleteMany({
      where: { productId: p.id },
    });

    // Insert Size S, M, L
    await prisma.productSize.createMany({
      data: [
        { name: "Size S", subText: "Tiêu chuẩn", extraPrice: 0, productId: p.id },
        { name: "Size M", subText: "+6.000đ", extraPrice: 6000, productId: p.id },
        { name: "Size L", subText: "+12.000đ", extraPrice: 12000, productId: p.id },
      ],
    });

    // Link toppings
    for (const t of toppingsData) {
      await prisma.productTopping.upsert({
        where: {
          productId_toppingId: {
            productId: p.id,
            toppingId: t.id,
          },
        },
        update: {},
        create: {
          productId: p.id,
          toppingId: t.id,
        },
      });
    }
  }

  // 3. Seed Danh Mục (Categories)
  console.log("📂 Đang nạp danh mục thức uống...");
  const categoriesData = [
    { slug: "coffee", name: "Cà phê", icon: "☕", description: "12 món mộc & phin", displayOrder: 1 },
    { slug: "milktea", name: "Trà sữa", icon: "◉", description: "16 loại trà lá ủ", displayOrder: 2 },
    { slug: "fruittea", name: "Trà trái cây", icon: "✦", description: "Trái cây tươi Đà Lạt", displayOrder: 3 },
    { slug: "special", name: "Đá xay Frost", icon: "❄", description: "Cacao béo mượt", displayOrder: 4 },
    { slug: "freshjuice", name: "Nước ép tươi", icon: "◌", description: "Ép lạnh giữ vitamin", displayOrder: 5 },
    { slug: "toppings", name: "Topping thủ công", icon: "✣", description: "Nấu mới mỗi 4 giờ", displayOrder: 6 },
  ];

  for (const c of categoriesData) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, description: c.description, displayOrder: c.displayOrder },
      create: c,
    });
  }

  // 4. Seed Mã Khuyến Mãi (Vouchers)
  console.log("🎟 Đang nạp mã voucher ưu đãi...");
  const vouchersData = [
    {
      code: "VELVETNEW",
      title: "Ưu đãi thành viên mới",
      description: "Giảm ngay 20.000đ cho đơn hàng đầu tiên tại Velvet & Brew",
      discountType: "FIXED",
      discountValue: 20000,
      minOrderAmount: 50000,
      endDate: new Date("2027-12-31T23:59:59Z"),
      isActive: true,
    },
    {
      code: "FREESHIP",
      title: "Miễn phí vận chuyển",
      description: "Freeship tối đa 25.000đ cho đơn hàng từ 100.000đ",
      discountType: "FREESHIP",
      discountValue: 25000,
      minOrderAmount: 100000,
      endDate: new Date("2027-12-31T23:59:59Z"),
      isActive: true,
    },
    {
      code: "VELVET50",
      title: "Đặc quyền Velvet Club Gold",
      description: "Giảm 50.000đ cho đơn hàng hội viên từ 150.000đ",
      discountType: "FIXED",
      discountValue: 50000,
      minOrderAmount: 150000,
      endDate: new Date("2027-12-31T23:59:59Z"),
      isActive: true,
    },
  ];

  for (const v of vouchersData) {
    await prisma.voucher.upsert({
      where: { code: v.code },
      update: {
        title: v.title,
        description: v.description,
        discountType: v.discountType,
        discountValue: v.discountValue,
        minOrderAmount: v.minOrderAmount,
        endDate: v.endDate,
        isActive: v.isActive,
      },
      create: v,
    });
  }

  // 5. Seed Kho Nguyên Liệu (Inventory Items)
  console.log("📦 Đang nạp kho nguyên liệu cảnh báo...");
  const inventoryData = [
    {
      name: "Hạt Arabica Cầu Đất",
      subTitle: "Rang vừa (Medium Roast)",
      category: "RAW",
      currentStock: 4.5,
      minStock: 10,
      unit: "kg",
      status: "LOW_STOCK",
    },
    {
      name: "Sữa tươi Dalat Milk",
      subTitle: "Thanh trùng nguyên kem",
      category: "MILK",
      currentStock: 12,
      minStock: 20,
      unit: "hộp",
      status: "IN_STOCK",
    },
    {
      name: "Cốt Trà Oolong Mộc",
      subTitle: "Ủ lạnh 16h thủ công",
      category: "TEA",
      currentStock: 2.8,
      minStock: 5,
      unit: "Lít",
      status: "LOW_STOCK",
    },
  ];

  for (const inv of inventoryData) {
    const existing = await prisma.inventoryItem.findFirst({ where: { name: inv.name } });
    if (existing) {
      await prisma.inventoryItem.update({
        where: { id: existing.id },
        data: inv,
      });
    } else {
      await prisma.inventoryItem.create({ data: inv });
    }
  }

  // 6. Seed Cài Đặt Hệ Thống (Store Settings)
  console.log("⚙️ Đang nạp cấu hình hệ thống...");
  const settingsData = [
    { key: "STORE_HOURS", value: "Thứ Hai - Chủ Nhật: 07:00 - 22:30", description: "Giờ mở cửa phục vụ" },
    { key: "HOTLINE", value: "+84 (0) 24 3828 9999", description: "Hotline chăm sóc khách hàng" },
    { key: "FLAGSHIP_ADDRESS", value: "124 Phố Cổ, Quận Hoàn Kiếm, Hà Nội", description: "Địa chỉ cửa hàng chính" },
    { key: "DELIVERY_RADIUS_KM", value: "5.0", description: "Bán kính giao hàng tối đa (km)" },
    { key: "TARGET_DELIVERY_MINS", value: "20", description: "Thời gian giao hàng mục tiêu (phút)" },
    { key: "DEFAULT_SHIPPING_FEE", value: "25000", description: "Phí vận chuyển tiêu chuẩn" },
  ];

  for (const s of settingsData) {
    await prisma.storeSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }

  const count = await prisma.product.count();
  console.log(`✅ Thành công! Hiện có ${count} sản phẩm trong database.`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi seed dữ liệu:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

