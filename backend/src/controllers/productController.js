const prisma = require('../config/db');

/**
 * Lấy danh sách sản phẩm (Hỗ trợ Server-side Pagination & Tìm kiếm)
 * GET /api/product?page=1&limit=12&category=coffee&search=latte
 */
exports.getAllProduct = async (req, res) => {
    try {
        const { category, includeInactive, search } = req.query;
        
        // 1. Phân tích tham số phân trang từ Query URL
        const page = req.query.page ? parseInt(req.query.page, 10) : null;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 12;//(10 là hệ cơ số vd:08 )

        const where = {};

        // Nếu client không yêu cầu lấy toàn bộ thì mặc định chỉ lấy món đang phục vụ (isActive: true)
        if (includeInactive !== "true" && includeInactive !== true) {
            where.isActive = true;
        }

        // Lọc theo danh mục
        if (category && category !== "all") {
            where.category = category;
        }

        // Tìm kiếm theo từ khóa ở database (tên món hoặc mô tả)
        if (search && search.trim()) {
            const q = search.trim();
            where.OR = [
                { name: { contains: q } },
                { description: { contains: q } },
            ];
        }

        // 2. Đếm tổng số món thỏa mãn điều kiện lọc (dùng cho phân trang)
        const totalItems = await prisma.product.count({ where });

        // 3. Chuẩn bị query options với skip & take (Server-side Pagination)
        const queryOptions = {
            where,
            include: {
                sizes: true,
                toppings: {
                    include: { topping: true }
                },
                categoryRel: true,
            },
            // Sắp xếp ID giảm dần đảm bảo kết quả phân trang ổn định 100%
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc' }
            ],
        };

        // Nếu client truyền ?page=1 thì áp dụng Server-side skip & take
        if (page && page > 0) {
            const validPage = Math.max(1, page);
            const validLimit = Math.max(1, limit);
            queryOptions.skip = (validPage - 1) * validLimit;
            queryOptions.take = validLimit;
        }

        // 4. Bốc đúng số lượng sản phẩm từ Database
        const products = await prisma.product.findMany(queryOptions);

        // 5. Tính tổng số lượng đã bán từ OrderItem cho các món lấy ra
        const productIds = products.map((p) => p.id);
        const salesAgg = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true,
            },
            where: {
                productId: { in: productIds },
                order: {
                    status: { not: "CANCELLED" }
                }
            }
        });

        const salesMap = {};
        salesAgg.forEach((item) => {
            salesMap[item.productId] = item._sum.quantity || 0;
        });

        const dataWithSales = products.map((p) => {
            const sold = salesMap[p.id] || 0;
            return {
                ...p,
                soldCount: sold,
                soldTrend: sold > 0 ? `+${sold} ly` : "Mới tạo",
            };
        });

        // 6. Tính toán metadata phân trang
        const effectiveLimit = page ? limit : totalItems;
        const totalPages = effectiveLimit > 0 ? Math.ceil(totalItems / effectiveLimit) : 1;
        const currentPage = page ? Math.max(1, page) : 1;

        return res.status(200).json({
            success: true,
            data: dataWithSales,
            pagination: {
                page: currentPage,
                limit: effectiveLimit,
                totalItems,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1,
            },
        });
    } catch (error) {
        console.error("Lỗi getAllProduct:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Lấy chi tiết 1 sản phẩm
 * GET /api/product/:id
 */
exports.getById = async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: parseInt(req.params.id, 10) },
            include: { 
                sizes: true, 
                toppings: { include: { topping: true } },
                categoryRel: true,
            }
        });
        if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

        // Tính số lượng đã bán cho sản phẩm này
        const salesSum = await prisma.orderItem.aggregate({
            _sum: { quantity: true },
            where: {
                productId: product.id,
                order: { status: { not: "CANCELLED" } }
            }
        });

        const sold = salesSum._sum.quantity || 0;

        res.json({ 
            success: true, 
            data: {
                ...product,
                soldCount: sold,
                soldTrend: sold > 0 ? `+${sold} ly` : "Mới tạo",
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
