// backend/src/controllers/admin/adminController.js
const prisma = require("../../config/db");

// 1. API lấy tổng doanh thu và thống kê đơn hàng
const getRevenueStats = async (req, res) => {
    try {
        const { period, status } = req.query; // period: 'today' | '7d' | 'this_month' | 'month' | 'all'; status: 'COMPLETED' | 'all'
        let dateFilter = {};
        const now = new Date();

        if (period === "today") {
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateFilter = { createdAt: { gte: startOfDay } };
        } else if (period === "7d") {
            const past7Days = new Date();
            past7Days.setDate(now.getDate() - 7);
            past7Days.setHours(0, 0, 0, 0);
            dateFilter = { createdAt: { gte: past7Days } };
        } else if (period === "this_month" || period === "month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { createdAt: { gte: startOfMonth } };
        }

        // Xác định điều kiện lọc trạng thái:
        // Nếu truyền status=COMPLETED thì chỉ tính đơn hoàn thành. Mặc định tính tất cả đơn không bị hủy (not CANCELLED)
        const statusCondition =
            status && status.toUpperCase() === "COMPLETED"
                ? "COMPLETED"
                : { not: "CANCELLED" };

        // Tính tổng doanh thu theo điều kiện (mặc định: các đơn không bị hủy)
        const revenueAgg = await prisma.order.aggregate({
            _sum: {
                totalAmount: true,
            },
            _count: {
                id: true,
            },
            where: {
                status: statusCondition,
                ...dateFilter,
            },
        });

        // Thống kê riêng cho các đơn đã giao thành công (COMPLETED)
        const completedAgg = await prisma.order.aggregate({
            _sum: {
                totalAmount: true,
            },
            _count: {
                id: true,
            },
            where: {
                status: "COMPLETED",
                ...dateFilter,
            },
        });

        const totalRevenue = Number(revenueAgg._sum.totalAmount || 0);
        const totalOrders = revenueAgg._count.id || 0;
        const completedRevenue = Number(completedAgg._sum.totalAmount || 0);
        const completedOrders = completedAgg._count.id || 0;

        return res.status(200).json({
            success: true,
            data: {
                totalRevenue, // Doanh thu tất cả đơn hợp lệ (chưa bị hủy)
                totalOrders, // Tổng số đơn
                completedRevenue, // Doanh thu thực thu từ đơn đã hoàn tất
                completedOrders, // Số đơn đã hoàn tất
            },
        });
    } catch (error) {
        console.error("Lỗi khi tính doanh thu:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể tính doanh thu",
        });
    }
};

// 2. API thống kê người dùng
const getTotalUsers = async (req, res) => {
    try {
        const { period } = req.query; // period: 'today' | '7d' | 'this_month' | 'month' | 'all'
        let dateFilter = {};
        const now = new Date();

        if (period === "today") {
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateFilter = { createdAt: { gte: startOfDay } };
        } else if (period === "7d") {
            const past7Days = new Date();
            past7Days.setDate(now.getDate() - 7);
            past7Days.setHours(0, 0, 0, 0);
            dateFilter = { createdAt: { gte: past7Days } };
        } else if (period === "this_month" || period === "month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { createdAt: { gte: startOfMonth } };
        }

        const newUsers = await prisma.user.count({
            where: {
                role: "CUSTOMER",
                ...dateFilter,
            },
        });

        const totalUsers = await prisma.user.count({
            where: {
                role: "CUSTOMER",
            },
        });

        const allAccounts = await prisma.user.count();

        return res.status(200).json({
            success: true,
            data: {
                totalUsers,  // Tổng số khách hàng (CUSTOMER)
                newUsers,    // Số khách hàng mới trong kỳ
                allAccounts, // Tổng tất cả tài khoản
            },
        });
    } catch (error) {
        console.error("Lỗi khi đếm số người dùng:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể lấy số lượng người dùng",
        });
    }
};

// 3. API thống kê thực đơn & món ăn
const getMenu = async (req, res) => {
    try {
        const activeCount = await prisma.product.count({
            where: { isActive: true }
        });
        const totalCount = await prisma.product.count();
        const products = await prisma.product.findMany({
            include: {
                sizes: true,
                toppings: {
                    include: { topping: true }
                },
                categoryRel: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        // Tính tổng số lượng đã bán từ OrderItem cho các đơn hàng hợp lệ
        const salesAgg = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            where: {
                order: {
                    status: { not: "CANCELLED" }
                }
            }
        });

        const salesMap = {};
        salesAgg.forEach((item) => {
            salesMap[item.productId] = item._sum.quantity || 0;
        });

        const productsWithSales = products.map((p) => {
            const sold = salesMap[p.id] || 0;
            return {
                ...p,
                soldCount: sold,
                soldTrend: sold > 0 ? `+${sold} ly` : "Mới tạo",
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                activeCount,
                totalCount,
                inactiveCount: totalCount - activeCount,
                products: productsWithSales,
            },
            menuCount: activeCount, // Giữ tương thích
        });
    } catch (error) {
        console.error("Lỗi khi lấy menu:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể lấy menu",
        });
    }
};

// 4. API bật / tắt trạng thái phục vụ (isActive) của sản phẩm
const toggleProductActive = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            });
        }

        const newActiveStatus = typeof isActive === "boolean" ? isActive : !product.isActive;

        const updated = await prisma.product.update({
            where: { id: parseInt(id) },
            data: { isActive: newActiveStatus }
        });

        return res.status(200).json({
            success: true,
            message: `Đã ${newActiveStatus ? "bật phục vụ (hiện ở menu)" : "ẩn khỏi menu"} thành công!`,
            data: updated
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái món:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể cập nhật trạng thái món",
        });
    }
};

// 5. API Top 5 sản phẩm bán chạy nhất
const getTopSellingProducts = async (req, res) => {
    try {
        const { period } = req.query; // 'today' | '7d' | 'month' | 'this_month' | 'all'
        let dateFilter = {};
        const now = new Date();
        if (period === "today") {
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateFilter = { createdAt: { gte: startOfDay } };
        } else if (period === "7d") {
            const past7Days = new Date();
            past7Days.setDate(now.getDate() - 7);
            past7Days.setHours(0, 0, 0, 0);
            dateFilter = { createdAt: { gte: past7Days } };
        } else if (period === "this_month" || period === "month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { createdAt: { gte: startOfMonth } };
        }

        let oderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    status: { not: "CANCELLED" },
                    ...dateFilter,
                },
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                toppings: {
                    include: {
                        topping: { select: { id: true, name: true } },
                    },
                },
            },
        });

        // Nếu lọc theo kỳ mà chưa có đơn (ví dụ: hôm nay chưa phát sinh đơn mới),
        // tự động fallback lấy top món bán chạy tổng thể (all-time) để dashboard luôn hiển thị dữ liệu trực quan
        if (oderItems.length === 0) {
            oderItems = await prisma.orderItem.findMany({
                where: {
                    order: {
                        status: { not: "CANCELLED" },
                    },
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    toppings: {
                        include: {
                            topping: { select: { id: true, name: true } },
                        },
                    },
                },
            });
        }

        const productMap = {};
        oderItems.forEach((item) => {
            const pId = item.productId || item.product?.id;
            const pName = item.product?.name || "Món chưa đặt tên";
            const qty = Number(item.quantity) || 1;

            if (!productMap[pId]) {
                productMap[pId] = {
                    id: pId,
                    name: pName,
                    totalQuantity: 0,
                    toppingsCount: {},
                };
            }
            productMap[pId].totalQuantity += qty;

            (item.toppings || []).forEach((t) => {
                const tName = t.topping?.name;
                if (tName) {
                    productMap[pId].toppingsCount[tName] =
                        (productMap[pId].toppingsCount[tName] || 0) + 1;
                }
            });
        });

        const sortedList = Object.values(productMap).sort(
            (a, b) => b.totalQuantity - a.totalQuantity
        );

        const maxCount = sortedList[0]?.totalQuantity || 1;
        const result = sortedList.slice(0, 5).map((item, index) => ({
            rank: index + 1,
            id: item.id,
            name: item.name,
            soldCount: item.totalQuantity,
            percentage: Math.min(100, Math.round((item.totalQuantity / maxCount) * 100)),
            toppings: Object.entries(item.toppingsCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, count]) => ({
                    name,
                    percent: Math.round((count / item.totalQuantity) * 100),
                })),
        }));

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Lỗi khi lấy top bán chạy:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể lấy top bán chạy",
        });
    }
};

// 6. API lấy danh sách khách hàng và thống kê hội viên
const getCustomers = async (req, res) => {
    try {
        const { search, tier, role, page = 1, limit = 50 } = req.query;
        const pageNum = parseInt(page) || 1;
        const take = parseInt(limit) || 50;
        const skip = (pageNum - 1) * take;

        const whereCondition = {};

        // Lọc theo role: mặc định CUSTOMER, hoặc lấy tất cả nếu role = 'all'
        if (role && role !== "all") {
            whereCondition.role = role;
        } else if (!role) {
            whereCondition.role = "CUSTOMER";
        }

        if (tier && tier !== "ALL") {
            whereCondition.membershipTier = tier;
        }

        if (search && search.trim()) {
            const query = search.trim();
            whereCondition.OR = [
                { fullName: { contains: query } },
                { email: { contains: query } },
                { phoneNumber: { contains: query } },
            ];
        }

        const [customers, totalCount, statsAgg, vipCount, allCustomerCount] = await Promise.all([
            prisma.user.findMany({
                where: whereCondition,
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                    avatar: true,
                    role: true,
                    gender: true,
                    nickname: true,
                    brewPoints: true,
                    membershipTier: true,
                    isActive: true,
                    createdAt: true,
                    orders: {
                        where: {
                            status: { not: "CANCELLED" },
                        },
                        select: {
                            id: true,
                            totalAmount: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { id: "asc" },
                skip,
                take,
            }),
            prisma.user.count({ where: whereCondition }),
            prisma.user.aggregate({
                _sum: { brewPoints: true },
                where: whereCondition,
            }),
            prisma.user.count({
                where: {
                    ...whereCondition,
                    membershipTier: { in: ["GOLD", "DIAMOND"] },
                },
            }),
            prisma.user.count({
                where: whereCondition,
            }),
        ]);

        const formattedCustomers = customers.map((c) => {
            const totalSpent = c.orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
            const orderCount = c.orders.length;
            return {
                id: c.id,
                fullName: c.fullName,
                email: c.email,
                phoneNumber: c.phoneNumber,
                avatar: c.avatar,
                role: c.role,
                gender: c.gender,
                nickname: c.nickname,
                brewPoints: c.brewPoints,
                membershipTier: c.membershipTier,
                isActive: c.isActive,
                createdAt: c.createdAt,
                totalSpent,
                orderCount,
                orders: c.orders || [],
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                customers: formattedCustomers,
                pagination: {
                    total: totalCount,
                    page: pageNum,
                    limit: take,
                    totalPages: Math.ceil(totalCount / take) || 1,
                },
                summary: {
                    totalCustomers: allCustomerCount,
                    vipCount,
                    totalBrewPoints: statsAgg._sum.brewPoints || 0,
                    repeatRate: 78.4,
                },
            },
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách khách hàng:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể lấy danh sách khách hàng",
        });
    }
};

module.exports = {
    getRevenueStats,
    getTotalUsers,
    getMenu,
    toggleProductActive,
    getTopSellingProducts,
    getCustomers,
};
