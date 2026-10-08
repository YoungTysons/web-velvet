// backend/src/controllers/adminController.js
const prisma = require("../config/db");

// API lấy tổng doanh thu và thống kê đơn hàng
const getRevenueStats = async (req, res) => {
    try {
        const { period, status } = req.query; // period: 'today' | 'this_month' | 'all'; status: 'COMPLETED' | 'all'
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

        // 1. Tính tổng doanh thu theo điều kiện (mặc định: các đơn không bị hủy)
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

        // 2. Thống kê riêng cho các đơn đã giao thành công (COMPLETED)
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
const getTotalUsers = async (req, res) => {
    try {
        const { period, status } = req.query; // period: 'today' | 'this_month' | 'all'; status: 'COMPLETED' | 'all'
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
                role: 'CUSTOMER',
                ...dateFilter
            }
        });
        const totalUsers = await prisma.user.count({
            where: {
                role: 'CUSTOMER'
            }
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
}
const getMenu = async (req, res) => {
    try {
        const activeCount = await prisma.product.count({
            where: { isActive: true }
        });
        const totalCount = await prisma.product.count();
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
            success: true,
            data: {
                activeCount,
                totalCount,
                inactiveCount: totalCount - activeCount,
                products
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

// API bật / tắt trạng thái phục vụ (isActive) của sản phẩm
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
const getTopSellingProducts = async (req, res) => {
    try {
        const { period } = req.query; // 'today' | '7d' | 'month' | 'all'
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
        const oderItems = await prisma.orderItem.findMany({
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
}

module.exports = {
    getRevenueStats,
    getTotalUsers,
    getMenu,
    toggleProductActive,
    getTopSellingProducts,
};

