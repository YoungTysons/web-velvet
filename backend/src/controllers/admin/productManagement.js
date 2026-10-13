const prisma = require("../../config/db");

/**
 * Tạo sản phẩm mới
 * POST /api/admin/products
 */
const createProduct = async (req, res) => {
    try {
        const {
            name,
            category,
            categoryId,
            description,
            basePrice,
            image,
            isBestSeller,
            isActive,
            sizes,
            toppings,
        } = req.body;

        // 1. Validate dữ liệu bắt buộc
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Tên sản phẩm không được để trống",
            });
        }

        if (basePrice === undefined || basePrice === null || isNaN(Number(basePrice)) || Number(basePrice) < 0) {
            return res.status(400).json({
                success: false,
                message: "Giá sản phẩm không hợp lệ (phải >= 0)",
            });
        }

        // 2. Tự động đồng bộ Category (slug & categoryId)
        let resolvedCategorySlug = (category && typeof category === "string") ? category.trim() : "coffee";
        let resolvedCategoryId = null;

        if (categoryId) {
            const cat = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
            if (cat) {
                resolvedCategoryId = cat.id;
                resolvedCategorySlug = cat.slug;
            }
        } else if (resolvedCategorySlug) {
            const cat = await prisma.category.findUnique({ where: { slug: resolvedCategorySlug } });
            if (cat) {
                resolvedCategoryId = cat.id;
            }
        }

        // 3. Chuẩn bị dữ liệu Product
        const productData = {
            name: name.trim(),
            category: resolvedCategorySlug,
            categoryId: resolvedCategoryId,
            description: description ? description.trim() : null,
            basePrice: Number(basePrice),
            image: image || null,
            isBestSeller: Boolean(isBestSeller),
            isActive: isActive !== undefined ? Boolean(isActive) : true,
        };

        // 4. Kích cỡ (Sizes): nếu client không truyền mảng sizes, tạo 3 size mặc định S, M, L
        let sizesToCreate = [
            { name: "Size S", subText: "Tiêu chuẩn", extraPrice: 0 },
            { name: "Size M", subText: "+6.000đ", extraPrice: 6000 },
            { name: "Size L", subText: "+12.000đ", extraPrice: 12000 },
        ];

        if (Array.isArray(sizes) && sizes.length > 0) {
            sizesToCreate = sizes.map((s) => ({
                name: s.name || "Tiêu chuẩn",
                subText: s.subText || null,
                extraPrice: Number(s.extraPrice || 0),
            }));
        }

        productData.sizes = {
            create: sizesToCreate,
        };

        // 5. Toppings: nếu client truyền mảng ID topping
        if (Array.isArray(toppings) && toppings.length > 0) {
            const toppingIds = toppings
                .map((t) => (typeof t === "object" ? t.id || t.toppingId : Number(t)))
                .filter((id) => id && !isNaN(id));

            if (toppingIds.length > 0) {
                productData.toppings = {
                    create: toppingIds.map((tId) => ({
                        topping: { connect: { id: Number(tId) } },
                    })),
                };
            }
        }

        // 6. Thực hiện tạo Product
        const newProduct = await prisma.product.create({
            data: productData,
            include: {
                sizes: true,
                toppings: {
                    include: { topping: true },
                },
                categoryRel: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Tạo sản phẩm thành công",
            product: newProduct,
        });
    } catch (error) {
        console.error("Lỗi khi tạo sản phẩm:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể tạo sản phẩm",
        });
    }
};

/**
 * Cập nhật sản phẩm
 * PUT /api/admin/products/:id
 */
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id, 10);

        if (isNaN(numId)) {
            return res.status(400).json({
                success: false,
                message: "ID sản phẩm không hợp lệ",
            });
        }

        // 1. Kiểm tra sản phẩm tồn tại
        const existing = await prisma.product.findUnique({
            where: { id: numId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm cần cập nhật",
            });
        }

        const {
            name,
            category,
            categoryId,
            description,
            basePrice,
            image,
            isBestSeller,
            isActive,
            sizes,
            toppings,
        } = req.body;

        // 2. Chuẩn bị dữ liệu cập nhật
        const updateData = {};

        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description ? description.trim() : null;
        if (basePrice !== undefined) updateData.basePrice = Number(basePrice);
        if (image !== undefined) updateData.image = image;
        if (isBestSeller !== undefined) updateData.isBestSeller = Boolean(isBestSeller);
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);

        // 3. Xử lý đồng bộ danh mục nếu có thay đổi
        if (categoryId !== undefined || category !== undefined) {
            let catId = categoryId ? Number(categoryId) : null;
            let catSlug = category ? category.trim() : null;

            if (catId) {
                const cat = await prisma.category.findUnique({ where: { id: catId } });
                if (cat) {
                    updateData.categoryId = cat.id;
                    updateData.category = cat.slug;
                }
            } else if (catSlug) {
                const cat = await prisma.category.findUnique({ where: { slug: catSlug } });
                if (cat) {
                    updateData.categoryId = cat.id;
                    updateData.category = cat.slug;
                } else {
                    updateData.category = catSlug;
                }
            }
        }

        // 4. Cập nhật sizes nếu client truyền mảng sizes mới
        if (Array.isArray(sizes)) {
            await prisma.productSize.deleteMany({
                where: { productId: numId },
            });

            if (sizes.length > 0) {
                await prisma.productSize.createMany({
                    data: sizes.map((s) => ({
                        productId: numId,
                        name: s.name || "Tiêu chuẩn",
                        subText: s.subText || null,
                        extraPrice: Number(s.extraPrice || 0),
                    })),
                });
            }
        }

        // 5. Cập nhật toppings nếu client truyền mảng toppings mới
        if (Array.isArray(toppings)) {
            await prisma.productTopping.deleteMany({
                where: { productId: numId },
            });

            const toppingIds = toppings
                .map((t) => (typeof t === "object" ? t.id || t.toppingId : Number(t)))
                .filter((tid) => tid && !isNaN(tid));

            for (const tId of toppingIds) {
                await prisma.productTopping.create({
                    data: {
                        productId: numId,
                        toppingId: Number(tId),
                    },
                });
            }
        }

        // 6. Thực hiện update Product
        const updatedProduct = await prisma.product.update({
            where: { id: numId },
            data: updateData,
            include: {
                sizes: true,
                toppings: {
                    include: { topping: true },
                },
                categoryRel: true,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Cập nhật sản phẩm thành công",
            product: updatedProduct,
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật sản phẩm:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể cập nhật sản phẩm",
        });
    }
};

/**
 * Xóa sản phẩm
 * DELETE /api/admin/products/:id
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id, 10);

        if (isNaN(numId)) {
            return res.status(400).json({
                success: false,
                message: "ID sản phẩm không hợp lệ",
            });
        }

        // 1. Kiểm tra sản phẩm tồn tại
        const existing = await prisma.product.findUnique({
            where: { id: numId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm để xóa",
            });
        }

        // 2. Kiểm tra xem món này đã từng được đặt trong đơn hàng nào chưa
        const orderItemCount = await prisma.orderItem.count({
            where: { productId: numId },
        });

        // 3. Nếu món đã có đơn hàng -> Soft delete (Ẩn món) để không phá vỡ lịch sử đơn hàng
        if (orderItemCount > 0) {
            const hiddenProduct = await prisma.product.update({
                where: { id: numId },
                data: { isActive: false },
            });

            return res.status(200).json({
                success: true,
                isSoftDeleted: true,
                message: "Món này đã có trong lịch sử đơn hàng của khách nên đã được chuyển sang trạng thái Ẩn (ngừng kinh doanh) để bảo toàn dữ liệu.",
                product: hiddenProduct,
            });
        }

        // 4. Nếu chưa có đơn hàng nào -> Hard delete an toàn (ProductSize, ProductTopping đã cascade delete)
        const deletedProduct = await prisma.product.delete({
            where: { id: numId },
        });

        return res.status(200).json({
            success: true,
            isSoftDeleted: false,
            message: "Xóa vĩnh viễn sản phẩm thành công",
            product: deletedProduct,
        });
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể xóa sản phẩm",
        });
    }
};

module.exports = {
    createProduct,
    updateProduct,
    deleteProduct,
};