-- ==============================================================================
-- DATABASE CREATION & INITIALIZATION SCRIPT FOR SQL SERVER (T-SQL)
-- PROJECT: VELVET & BREW - ARTISANAL COFFEE & TEA STORE
-- CƠ SỞ DỮ LIỆU ĐẦY ĐỦ CHO TẤT CẢ CHỨC NĂNG FRONTEND & ADMIN
-- ==============================================================================

-- 1. TẠO CƠ SỞ DỮ LIỆU NẾU CHƯA TỒN TẠI
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'cafe_db')
BEGIN
    CREATE DATABASE [cafe_db] COLLATE Latin1_General_100_CI_AS_SC_UTF8;
END
GO

USE [cafe_db];
GO

-- ==============================================================================
-- 2. XÓA CÁC BẢNG CŨ THEO THỨ TỰ RÀNG BUỘC KHÓA NGOẠI (NẾU CẦN TÁI TẠO LẠI)
-- ==============================================================================
IF OBJECT_ID(N'dbo.OrderItemTopping', N'U') IS NOT NULL DROP TABLE dbo.OrderItemTopping;
IF OBJECT_ID(N'dbo.OrderItem', N'U') IS NOT NULL DROP TABLE dbo.OrderItem;
IF OBJECT_ID(N'dbo.Order', N'U') IS NOT NULL DROP TABLE dbo.[Order];
IF OBJECT_ID(N'dbo.UserVoucher', N'U') IS NOT NULL DROP TABLE dbo.UserVoucher;
IF OBJECT_ID(N'dbo.Voucher', N'U') IS NOT NULL DROP TABLE dbo.Voucher;
IF OBJECT_ID(N'dbo.PointTransaction', N'U') IS NOT NULL DROP TABLE dbo.PointTransaction;
IF OBJECT_ID(N'dbo.Review', N'U') IS NOT NULL DROP TABLE dbo.Review;
IF OBJECT_ID(N'dbo.Notification', N'U') IS NOT NULL DROP TABLE dbo.Notification;
IF OBJECT_ID(N'dbo.StaffProfile', N'U') IS NOT NULL DROP TABLE dbo.StaffProfile;
IF OBJECT_ID(N'dbo.Address', N'U') IS NOT NULL DROP TABLE dbo.Address;
IF OBJECT_ID(N'dbo.ProductTopping', N'U') IS NOT NULL DROP TABLE dbo.ProductTopping;
IF OBJECT_ID(N'dbo.ProductSize', N'U') IS NOT NULL DROP TABLE dbo.ProductSize;
IF OBJECT_ID(N'dbo.Product', N'U') IS NOT NULL DROP TABLE dbo.Product;
IF OBJECT_ID(N'dbo.Category', N'U') IS NOT NULL DROP TABLE dbo.Category;
IF OBJECT_ID(N'dbo.Topping', N'U') IS NOT NULL DROP TABLE dbo.Topping;
IF OBJECT_ID(N'dbo.InventoryItem', N'U') IS NOT NULL DROP TABLE dbo.InventoryItem;
IF OBJECT_ID(N'dbo.StoreSetting', N'U') IS NOT NULL DROP TABLE dbo.StoreSetting;
IF OBJECT_ID(N'dbo.User', N'U') IS NOT NULL DROP TABLE dbo.[User];
GO

-- ==============================================================================
-- 3. ĐỊNH NGHĨA CÁC BẢNG (TABLE CREATION)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- BẢNG 1: [User] - TÀI KHOẢN KHÁCH HÀNG & NHÂN VIÊN / QUẢN TRỊ VIÊN
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[User] (
    [id]             INT IDENTITY(1,1) NOT NULL,
    [email]          NVARCHAR(255) NULL,
    [phoneNumber]    NVARCHAR(20) NOT NULL,
    [password]       NVARCHAR(255) NOT NULL,
    [fullName]       NVARCHAR(255) NOT NULL,
    [avatar]         NVARCHAR(MAX) NULL,
    [role]           NVARCHAR(20) NOT NULL CONSTRAINT [DF_User_role] DEFAULT (N'CUSTOMER'),
    [gender]         NVARCHAR(10) NULL,
    [nickname]       NVARCHAR(50) NULL,
    [birthDate]      DATETIME2(7) NULL,
    [brewPoints]     INT NOT NULL CONSTRAINT [DF_User_brewPoints] DEFAULT ((0)),
    [membershipTier] NVARCHAR(20) NOT NULL CONSTRAINT [DF_User_membershipTier] DEFAULT (N'SILVER'),
    [isActive]       BIT NOT NULL CONSTRAINT [DF_User_isActive] DEFAULT ((1)),
    [createdAt]      DATETIME2(7) NOT NULL CONSTRAINT [DF_User_createdAt] DEFAULT (SYSUTCDATETIME()),
    [updatedAt]      DATETIME2(7) NOT NULL CONSTRAINT [DF_User_updatedAt] DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT [PK_User] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_User_phoneNumber] UNIQUE NONCLUSTERED ([phoneNumber] ASC),
    CONSTRAINT [UQ_User_email] UNIQUE NONCLUSTERED ([email] ASC),
    CONSTRAINT [CK_User_role] CHECK ([role] IN (N'CUSTOMER', N'ADMIN', N'STAFF')),
    CONSTRAINT [CK_User_membershipTier] CHECK ([membershipTier] IN (N'MEMBER', N'SILVER', N'GOLD', N'DIAMOND'))
);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 2: [Address] - SỔ ĐỊA CHỈ GIAO HÀNG CỦA KHÁCH HÀNG
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[Address] (
    [id]            INT IDENTITY(1,1) NOT NULL,
    [userId]        INT NOT NULL,
    [recipientName] NVARCHAR(255) NOT NULL,
    [phoneNumber]   NVARCHAR(20) NOT NULL,
    [street]        NVARCHAR(255) NOT NULL,
    [ward]          NVARCHAR(100) NULL,
    [district]      NVARCHAR(100) NULL,
    [city]          NVARCHAR(100) NOT NULL,
    [note]          NVARCHAR(MAX) NULL,
    [label]         NVARCHAR(50) NULL CONSTRAINT [DF_Address_label] DEFAULT (N'HOME'),
    [isDefault]     BIT NOT NULL CONSTRAINT [DF_Address_isDefault] DEFAULT ((0)),
    [createdAt]     DATETIME2(7) NOT NULL CONSTRAINT [DF_Address_createdAt] DEFAULT (SYSUTCDATETIME()),
    [updatedAt]     DATETIME2(7) NOT NULL CONSTRAINT [DF_Address_updatedAt] DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT [PK_Address] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_Address_User] FOREIGN KEY ([userId]) REFERENCES [dbo].[User] ([id]) ON DELETE CASCADE
);
CREATE NONCLUSTERED INDEX [IX_Address_userId] ON [dbo].[Address] ([userId] ASC);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 3: [Category] - DANH MỤC THỰC ĐƠN THỨC UỐNG
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[Category] (
    [id]           INT IDENTITY(1,1) NOT NULL,
    [slug]         NVARCHAR(50) NOT NULL,
    [name]         NVARCHAR(100) NOT NULL,
    [icon]         NVARCHAR(50) NULL,
    [description]  NVARCHAR(255) NULL,
    [displayOrder] INT NOT NULL CONSTRAINT [DF_Category_displayOrder] DEFAULT ((0)),
    [isActive]     BIT NOT NULL CONSTRAINT [DF_Category_isActive] DEFAULT ((1)),
    [createdAt]    DATETIME2(7) NOT NULL CONSTRAINT [DF_Category_createdAt] DEFAULT (SYSUTCDATETIME()),
    [updatedAt]    DATETIME2(7) NOT NULL CONSTRAINT [DF_Category_updatedAt] DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT [PK_Category] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_Category_slug] UNIQUE NONCLUSTERED ([slug] ASC)
);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 4: [Product] - DANH SÁCH MÓN & SẢN PHẨM CAFE, TRÀ SỮA
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[Product] (
    [id]           INT IDENTITY(1,1) NOT NULL,
    [name]         NVARCHAR(255) NOT NULL,
    [category]     NVARCHAR(50) NOT NULL CONSTRAINT [DF_Product_category] DEFAULT (N'coffee'),
    [categoryId]   INT NULL,
    [description]  NVARCHAR(MAX) NULL,
    [basePrice]    DECIMAL(10, 2) NOT NULL,
    [image]        NVARCHAR(MAX) NULL,
    [isBestSeller] BIT NOT NULL CONSTRAINT [DF_Product_isBestSeller] DEFAULT ((0)),
    [isActive]     BIT NOT NULL CONSTRAINT [DF_Product_isActive] DEFAULT ((1)),
    [rating]       DECIMAL(3, 1) NULL CONSTRAINT [DF_Product_rating] DEFAULT ((4.9)),
    [reviewCount]  INT NOT NULL CONSTRAINT [DF_Product_reviewCount] DEFAULT ((0)),
    [createdAt]    DATETIME2(7) NOT NULL CONSTRAINT [DF_Product_createdAt] DEFAULT (SYSUTCDATETIME()),
    [updatedAt]    DATETIME2(7) NOT NULL CONSTRAINT [DF_Product_updatedAt] DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT [PK_Product] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_Product_Category] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category] ([id]) ON DELETE SET NULL
);
CREATE NONCLUSTERED INDEX [IX_Product_categoryId] ON [dbo].[Product] ([categoryId] ASC);
CREATE NONCLUSTERED INDEX [IX_Product_category] ON [dbo].[Product] ([category] ASC);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 5: [ProductSize] - KÍCH CỠ LY (Size S, M, L) CỦA TỪNG MÓN
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[ProductSize] (
    [id]         INT IDENTITY(1,1) NOT NULL,
    [name]       NVARCHAR(50) NOT NULL,
    [subText]    NVARCHAR(50) NULL,
    [extraPrice] DECIMAL(10, 2) NOT NULL CONSTRAINT [DF_ProductSize_extraPrice] DEFAULT ((0.00)),
    [productId]  INT NOT NULL,
    
    CONSTRAINT [PK_ProductSize] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_ProductSize_Product] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product] ([id]) ON DELETE CASCADE
);
CREATE NONCLUSTERED INDEX [IX_ProductSize_productId] ON [dbo].[ProductSize] ([productId] ASC);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 6: [Topping] - DANH MỤC TOPPING (Trân châu, Kem cheese,...)
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[Topping] (
    [id]    INT IDENTITY(1,1) NOT NULL,
    [name]  NVARCHAR(100) NOT NULL,
    [price] DECIMAL(10, 2) NOT NULL,
    
    CONSTRAINT [PK_Topping] PRIMARY KEY CLUSTERED ([id] ASC)
);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 7: [ProductTopping] - LIÊN KẾT MÓN VỚI CÁC TOPPING CHO PHÉP CHỌN
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[ProductTopping] (
    [productId] INT NOT NULL,
    [toppingId] INT NOT NULL,
    
    CONSTRAINT [PK_ProductTopping] PRIMARY KEY CLUSTERED ([productId] ASC, [toppingId] ASC),
    CONSTRAINT [FK_ProductTopping_Product] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product] ([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ProductTopping_Topping] FOREIGN KEY ([toppingId]) REFERENCES [dbo].[Topping] ([id]) ON DELETE CASCADE
);
CREATE NONCLUSTERED INDEX [IX_ProductTopping_toppingId] ON [dbo].[ProductTopping] ([toppingId] ASC);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 8: [Voucher] - HỆ THỐNG MÃ GIẢM GIÁ & KHUYẾN MÃI
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[Voucher] (
    [id]             INT IDENTITY(1,1) NOT NULL,
    [code]           NVARCHAR(50) NOT NULL,
    [title]          NVARCHAR(255) NOT NULL,
    [description]    NVARCHAR(MAX) NULL,
    [discountType]   NVARCHAR(20) NOT NULL CONSTRAINT [DF_Voucher_discountType] DEFAULT (N'FIXED'),
    [discountValue]  DECIMAL(10, 2) NOT NULL,
    [minOrderAmount] DECIMAL(10, 2) NOT NULL CONSTRAINT [DF_Voucher_minOrderAmount] DEFAULT ((0.00)),
    [maxDiscount]    DECIMAL(10, 2) NULL,
    [usageLimit]     INT NULL,
    [usedCount]      INT NOT NULL CONSTRAINT [DF_Voucher_usedCount] DEFAULT ((0)),
    [startDate]      DATETIME2(7) NOT NULL CONSTRAINT [DF_Voucher_startDate] DEFAULT (SYSUTCDATETIME()),
    [endDate]        DATETIME2(7) NOT NULL,
    [isActive]       BIT NOT NULL CONSTRAINT [DF_Voucher_isActive] DEFAULT ((1)),
    [createdAt]      DATETIME2(7) NOT NULL CONSTRAINT [DF_Voucher_createdAt] DEFAULT (SYSUTCDATETIME()),
    [updatedAt]      DATETIME2(7) NOT NULL CONSTRAINT [DF_Voucher_updatedAt] DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT [PK_Voucher] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_Voucher_code] UNIQUE NONCLUSTERED ([code] ASC),
    CONSTRAINT [CK_Voucher_discountType] CHECK ([discountType] IN (N'FIXED', N'PERCENT', N'FREESHIP'))
);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 9: [UserVoucher] - VÍ VOUCHER ĐƯỢC LƯU BỞI NGƯỜI DÙNG
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[UserVoucher] (
    [id]        INT IDENTITY(1,1) NOT NULL,
    [userId]    INT NOT NULL,
    [voucherId] INT NOT NULL,
    [isUsed]    BIT NOT NULL CONSTRAINT [DF_UserVoucher_isUsed] DEFAULT ((0)),
    [usedAt]    DATETIME2(7) NULL,
    [createdAt] DATETIME2(7) NOT NULL CONSTRAINT [DF_UserVoucher_createdAt] DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT [PK_UserVoucher] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_UserVoucher] UNIQUE NONCLUSTERED ([userId] ASC, [voucherId] ASC),
    CONSTRAINT [FK_UserVoucher_User] FOREIGN KEY ([userId]) REFERENCES [dbo].[User] ([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_UserVoucher_Voucher] FOREIGN KEY ([voucherId]) REFERENCES [dbo].[Voucher] ([id]) ON DELETE CASCADE
);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 10: [Order] - ĐƠN ĐẶT HÀNG & THÔNG TIN THANH TOÁN
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[Order] (
    [id]               INT IDENTITY(1,1) NOT NULL,
    [orderCode]        NVARCHAR(50) NOT NULL,
    [userId]           INT NULL,
    [addressId]        INT NULL,
    [shippingAddress]  NVARCHAR(MAX) NOT NULL,
    [deliveryType]     NVARCHAR(20) NOT NULL CONSTRAINT [DF_Order_deliveryType] DEFAULT (N'DELIVERY'),
    [subtotal]         DECIMAL(10, 2) NOT NULL,
    [shippingFee]      DECIMAL(10, 2) NOT NULL CONSTRAINT [DF_Order_shippingFee] DEFAULT ((0.00)),
    [discountAmount]   DECIMAL(10, 2) NOT NULL CONSTRAINT [DF_Order_discountAmount] DEFAULT ((0.00)),
    [totalAmount]      DECIMAL(10, 2) NOT NULL,
    [voucherCode]      NVARCHAR(100) NULL,
    [voucherId]        INT NULL,
    [brewPointsEarned] INT NOT NULL CONSTRAINT [DF_Order_brewPointsEarned] DEFAULT ((0)),
    [status]           NVARCHAR(20) NOT NULL CONSTRAINT [DF_Order_status] DEFAULT (N'PENDING'),
    [paymentMethod]    NVARCHAR(50) NOT NULL CONSTRAINT [DF_Order_paymentMethod] DEFAULT (N'COD'),
    [isPaid]           BIT NOT NULL CONSTRAINT [DF_Order_isPaid] DEFAULT ((0)),
    [note]             NVARCHAR(MAX) NULL,
    [cancelReason]     NVARCHAR(MAX) NULL,
    [driverName]       NVARCHAR(100) NULL,
    [driverPhone]      NVARCHAR(20) NULL,
    [driverPlate]      NVARCHAR(50) NULL,
    [vatRequired]      BIT NOT NULL CONSTRAINT [DF_Order_vatRequired] DEFAULT ((0)),
    [vatCompany]       NVARCHAR(255) NULL,
    [vatTaxCode]       NVARCHAR(50) NULL,
    [vatAddress]       NVARCHAR(MAX) NULL,
    [createdAt]        DATETIME2(7) NOT NULL CONSTRAINT [DF_Order_createdAt] DEFAULT (SYSUTCDATETIME()),
    [updatedAt]        DATETIME2(7) NOT NULL CONSTRAINT [DF_Order_updatedAt] DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT [PK_Order] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_Order_orderCode] UNIQUE NONCLUSTERED ([orderCode] ASC),
    CONSTRAINT [FK_Order_User] FOREIGN KEY ([userId]) REFERENCES [dbo].[User] ([id]) ON DELETE SET NULL,
    CONSTRAINT [FK_Order_Address] FOREIGN KEY ([addressId]) REFERENCES [dbo].[Address] ([id]) ON DELETE SET NULL,
    CONSTRAINT [FK_Order_Voucher] FOREIGN KEY ([voucherId]) REFERENCES [dbo].[Voucher] ([id]) ON DELETE SET NULL,
    CONSTRAINT [CK_Order_deliveryType] CHECK ([deliveryType] IN (N'DELIVERY', N'PICKUP')),
    CONSTRAINT [CK_Order_status] CHECK ([status] IN (N'PENDING', N'PREPARING', N'PREPARED', N'DELIVERING', N'COMPLETED', N'CANCELLED'))
);
CREATE NONCLUSTERED INDEX [IX_Order_userId] ON [dbo].[Order] ([userId] ASC);
CREATE NONCLUSTERED INDEX [IX_Order_addressId] ON [dbo].[Order] ([addressId] ASC);
CREATE NONCLUSTERED INDEX [IX_Order_voucherId] ON [dbo].[Order] ([voucherId] ASC);
CREATE NONCLUSTERED INDEX [IX_Order_status] ON [dbo].[Order] ([status] ASC);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 11: [OrderItem] - CHI TIẾT TỪNG LY ĐỒ UỐNG TRONG ĐƠN
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[OrderItem] (
    [id]        INT IDENTITY(1,1) NOT NULL,
    [orderId]   INT NOT NULL,
    [productId] INT NOT NULL,
    [quantity]  INT NOT NULL CONSTRAINT [DF_OrderItem_quantity] DEFAULT ((1)),
    [sizeName]  NVARCHAR(50) NOT NULL,
    [sizePrice] DECIMAL(10, 2) NOT NULL,
    [sweetness] NVARCHAR(50) NOT NULL,
    [ice]       NVARCHAR(50) NOT NULL,
    [note]      NVARCHAR(MAX) NULL,
    [unitPrice] DECIMAL(10, 2) NOT NULL,
    
    CONSTRAINT [PK_OrderItem] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_OrderItem_Order] FOREIGN KEY ([orderId]) REFERENCES [dbo].[Order] ([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_OrderItem_Product] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product] ([id])
);
CREATE NONCLUSTERED INDEX [IX_OrderItem_orderId] ON [dbo].[OrderItem] ([orderId] ASC);
CREATE NONCLUSTERED INDEX [IX_OrderItem_productId] ON [dbo].[OrderItem] ([productId] ASC);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 12: [OrderItemTopping] - TOPPING ĐI KÈM TỪNG MÓN TRONG ĐƠN
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[OrderItemTopping] (
    [id]          INT IDENTITY(1,1) NOT NULL,
    [orderItemId] INT NOT NULL,
    [toppingId]   INT NOT NULL,
    [price]       DECIMAL(10, 2) NOT NULL,
    
    CONSTRAINT [PK_OrderItemTopping] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_OrderItemTopping_Item] FOREIGN KEY ([orderItemId]) REFERENCES [dbo].[OrderItem] ([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_OrderItemTopping_Topping] FOREIGN KEY ([toppingId]) REFERENCES [dbo].[Topping] ([id])
);
CREATE NONCLUSTERED INDEX [IX_OrderItemTopping_orderItemId] ON [dbo].[OrderItemTopping] ([orderItemId] ASC);
CREATE NONCLUSTERED INDEX [IX_OrderItemTopping_toppingId] ON [dbo].[OrderItemTopping] ([toppingId] ASC);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 13: [PointTransaction] - LỊCH SỬ GIAO DỊCH TÍCH / TIÊU HẠT BREW
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[PointTransaction] (
    [id]          INT IDENTITY(1,1) NOT NULL,
    [userId]      INT NOT NULL,
    [points]      INT NOT NULL,
    [type]        NVARCHAR(20) NOT NULL CONSTRAINT [DF_PointTransaction_type] DEFAULT (N'EARN'),
    [description] NVARCHAR(255) NULL,
    [orderCode]   NVARCHAR(50) NULL,
    [createdAt]   DATETIME2(7) NOT NULL CONSTRAINT [DF_PointTransaction_createdAt] DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT [PK_PointTransaction] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_PointTransaction_User] FOREIGN KEY ([userId]) REFERENCES [dbo].[User] ([id]) ON DELETE CASCADE,
    CONSTRAINT [CK_PointTransaction_type] CHECK ([type] IN (N'EARN', N'REDEEM', N'REFUND', N'BONUS', N'EXPIRE'))
);
CREATE NONCLUSTERED INDEX [IX_PointTransaction_userId] ON [dbo].[PointTransaction] ([userId] ASC);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 14: [Review] - ĐÁNH GIÁ VÀ BÌNH LUẬN SẢN PHẨM
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[Review] (
    [id]        INT IDENTITY(1,1) NOT NULL,
    [userId]    INT NOT NULL,
    [productId] INT NOT NULL,
    [rating]    INT NOT NULL CONSTRAINT [DF_Review_rating] DEFAULT ((5)),
    [comment]   NVARCHAR(MAX) NULL,
    [createdAt] DATETIME2(7) NOT NULL CONSTRAINT [DF_Review_createdAt] DEFAULT (SYSUTCDATETIME()),
    [updatedAt] DATETIME2(7) NOT NULL CONSTRAINT [DF_Review_updatedAt] DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT [PK_Review] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_Review_User] FOREIGN KEY ([userId]) REFERENCES [dbo].[User] ([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Review_Product] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product] ([id]) ON DELETE CASCADE,
    CONSTRAINT [CK_Review_rating] CHECK ([rating] BETWEEN 1 AND 5)
);
CREATE NONCLUSTERED INDEX [IX_Review_productId] ON [dbo].[Review] ([productId] ASC);
CREATE NONCLUSTERED INDEX [IX_Review_userId] ON [dbo].[Review] ([userId] ASC);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 15: [Notification] - THÔNG BÁO CHO NGƯỜI DÙNG
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[Notification] (
    [id]        INT IDENTITY(1,1) NOT NULL,
    [userId]    INT NOT NULL,
    [title]     NVARCHAR(255) NOT NULL,
    [content]   NVARCHAR(MAX) NOT NULL,
    [type]      NVARCHAR(20) NOT NULL CONSTRAINT [DF_Notification_type] DEFAULT (N'ORDER'),
    [isRead]    BIT NOT NULL CONSTRAINT [DF_Notification_isRead] DEFAULT ((0)),
    [link]      NVARCHAR(255) NULL,
    [createdAt] DATETIME2(7) NOT NULL CONSTRAINT [DF_Notification_createdAt] DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT [PK_Notification] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_Notification_User] FOREIGN KEY ([userId]) REFERENCES [dbo].[User] ([id]) ON DELETE CASCADE,
    CONSTRAINT [CK_Notification_type] CHECK ([type] IN (N'ORDER', N'PROMOTION', N'LOYALTY', N'SYSTEM'))
);
CREATE NONCLUSTERED INDEX [IX_Notification_userId] ON [dbo].[Notification] ([userId] ASC);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 16: [InventoryItem] - CẢNH BÁO TỒN KHO NGUYÊN LIỆU (ADMIN DASHBOARD)
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[InventoryItem] (
    [id]           INT IDENTITY(1,1) NOT NULL,
    [name]         NVARCHAR(255) NOT NULL,
    [subTitle]     NVARCHAR(255) NULL,
    [category]     NVARCHAR(50) NOT NULL CONSTRAINT [DF_InventoryItem_category] DEFAULT (N'RAW'),
    [currentStock] DECIMAL(10, 2) NOT NULL,
    [minStock]     DECIMAL(10, 2) NOT NULL,
    [unit]         NVARCHAR(50) NOT NULL,
    [status]       NVARCHAR(50) NOT NULL CONSTRAINT [DF_InventoryItem_status] DEFAULT (N'IN_STOCK'),
    [createdAt]    DATETIME2(7) NOT NULL CONSTRAINT [DF_InventoryItem_createdAt] DEFAULT (SYSUTCDATETIME()),
    [updatedAt]    DATETIME2(7) NOT NULL CONSTRAINT [DF_InventoryItem_updatedAt] DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT [PK_InventoryItem] PRIMARY KEY CLUSTERED ([id] ASC)
);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 17: [StaffProfile] - HỒ SƠ NHÂN VIÊN & CA LÀM VIỆC (ADMIN DASHBOARD)
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[StaffProfile] (
    [id]           INT IDENTITY(1,1) NOT NULL,
    [userId]       INT NOT NULL,
    [staffCode]    NVARCHAR(50) NOT NULL,
    [position]     NVARCHAR(50) NOT NULL CONSTRAINT [DF_StaffProfile_position] DEFAULT (N'BARISTA'),
    [shift]        NVARCHAR(100) NULL,
    [vehiclePlate] NVARCHAR(50) NULL,
    [salary]       DECIMAL(10, 2) NULL,
    [status]       NVARCHAR(50) NOT NULL CONSTRAINT [DF_StaffProfile_status] DEFAULT (N'ACTIVE'),
    [createdAt]    DATETIME2(7) NOT NULL CONSTRAINT [DF_StaffProfile_createdAt] DEFAULT (SYSUTCDATETIME()),
    [updatedAt]    DATETIME2(7) NOT NULL CONSTRAINT [DF_StaffProfile_updatedAt] DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT [PK_StaffProfile] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_StaffProfile_userId] UNIQUE NONCLUSTERED ([userId] ASC),
    CONSTRAINT [UQ_StaffProfile_staffCode] UNIQUE NONCLUSTERED ([staffCode] ASC),
    CONSTRAINT [FK_StaffProfile_User] FOREIGN KEY ([userId]) REFERENCES [dbo].[User] ([id]) ON DELETE CASCADE
);
GO

-- ------------------------------------------------------------------------------
-- BẢNG 18: [StoreSetting] - CÀI ĐẶT CỬA HÀNG & THÔNG SỐ VẬN HÀNH
-- ------------------------------------------------------------------------------
CREATE TABLE [dbo].[StoreSetting] (
    [id]          INT IDENTITY(1,1) NOT NULL,
    [key]         NVARCHAR(100) NOT NULL,
    [value]       NVARCHAR(MAX) NOT NULL,
    [description] NVARCHAR(255) NULL,
    [updatedAt]   DATETIME2(7) NOT NULL CONSTRAINT [DF_StoreSetting_updatedAt] DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT [PK_StoreSetting] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_StoreSetting_key] UNIQUE NONCLUSTERED ([key] ASC)
);
GO

-- ==============================================================================
-- 4. NẠP DỮ LIỆU KHỞI TẠO MẪU (SEED DATA CHO SQL SERVER)
-- ==============================================================================

-- 4.1. NẠP DANH MỤC THỰC ĐƠN
SET IDENTITY_INSERT [dbo].[Category] ON;
INSERT INTO [dbo].[Category] ([id], [slug], [name], [icon], [description], [displayOrder], [isActive]) VALUES
(1, N'coffee', N'Cà phê', N'☕', N'12 món mộc & phin', 1, 1),
(2, N'milktea', N'Trà sữa', N'◉', N'16 loại trà lá ủ', 2, 1),
(3, N'fruittea', N'Trà trái cây', N'✦', N'Trái cây tươi Đà Lạt', 3, 1),
(4, N'special', N'Đá xay Frost', N'❄', N'Cacao béo mượt', 4, 1),
(5, N'freshjuice', N'Nước ép tươi', N'◌', N'Ép lạnh giữ vitamin', 5, 1),
(6, N'toppings', N'Topping thủ công', N'✣', N'Nấu mới mỗi 4 giờ', 6, 1);
SET IDENTITY_INSERT [dbo].[Category] OFF;
GO

-- 4.2. NẠP TOPPING
SET IDENTITY_INSERT [dbo].[Topping] ON;
INSERT INTO [dbo].[Topping] ([id], [name], [price]) VALUES
(1, N'Trân châu đen mật mía', 5000.00),
(2, N'Trân châu hoàng kim dai giòn', 7000.00),
(3, N'Kem Cheese dẻo', 10000.00);
SET IDENTITY_INSERT [dbo].[Topping] OFF;
GO

-- 4.3. NẠP 9 SẢN PHẨM TRỨ DANH VELVET & BREW
SET IDENTITY_INSERT [dbo].[Product] ON;
INSERT INTO [dbo].[Product] ([id], [name], [category], [categoryId], [description], [basePrice], [image], [isBestSeller], [isActive], [rating], [reviewCount]) VALUES
(1, N'Cà phê sữa truyền thống', N'coffee', 1, N'Đậm đà Robusta Buôn Ma Thuột phối cùng Arabica Cầu Đất, hòa quyện sữa đặc ngọt dịu.', 45000.00, N'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=700&q=85', 1, 1, 4.9, 1280),
(2, N'Trà sữa Oolong Nướng', N'milktea', 2, N'Lá trà Ô Long sấy chậm đượm hương khói thơm lừng, kết hợp cốt sữa thanh béo tròn vị.', 49000.00, N'https://images.unsplash.com/photo-1558857563-b371033873b8?w=700&q=85', 1, 1, 4.9, 950),
(3, N'Bạc xỉu Sài Gòn 3 tầng', N'coffee', 1, N'Sữa tươi béo ngậy hòa cùng sữa đặc ngọt thơm và tầng cà phê Robusta nồng nàn sóng sánh.', 50000.00, N'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=700&q=85', 0, 1, 4.8, 640),
(4, N'Matcha Latte Kem Cheese', N'special', 4, N'Bột Matcha Uji Nhật Bản thượng hạng hòa quyện lớp macchiato kem cheese dẻo mặn.', 55000.00, N'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=700&q=85', 1, 1, 4.9, 820),
(5, N'Trà Đào Cam Sả Tươi', N'fruittea', 3, N'Hương sả thanh dịu quyện nước cốt cam vàng mọng nước và miếng đào giòn ngọt mát lạnh.', 48000.00, N'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=700&q=85', 0, 1, 4.8, 510),
(6, N'Cà phê Muối Cố Đô', N'coffee', 1, N'Lớp kem muối biển sánh mịn béo mặn nhẹ cân bằng hoàn hảo hậu vị đắng đậm đà nguyên bản.', 52000.00, N'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700&q=85', 1, 1, 4.9, 1420),
(7, N'Sữa Tươi Trân Châu Đường Đen', N'milktea', 2, N'Sữa tươi thanh trùng Đà Lạt hòa quyện sốt đường đen mật mía dẻo thơm ấm nóng.', 55000.00, N'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=700&q=85', 0, 1, 4.9, 1150),
(8, N'Cacao Dừa Tuyết Đá Xay', N'special', 4, N'Cacao nguyên chất Đắk Lắk đậm đà xay tuyết cùng cốt dừa tươi Bến Tre béo thơm ngọt lành.', 58000.00, N'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=700&q=85', 0, 1, 4.8, 430),
(9, N'Cold Brew Cam Vàng Thảo Mộc', N'coffee', 1, N'Cà phê ủ lạnh 16 giờ chiết xuất từng giọt tinh túy, kết hợp cam vàng California và hương thảo tươi mát.', 62000.00, N'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=700&q=85', 1, 1, 5.0, 780);
SET IDENTITY_INSERT [dbo].[Product] OFF;
GO

-- 4.4. NẠP KÍCH CỠ LY (SIZE S, M, L)
INSERT INTO [dbo].[ProductSize] ([name], [subText], [extraPrice], [productId]) VALUES
(N'Size S', N'Tiêu chuẩn', 0.00, 1), (N'Size M', N'+6.000đ', 6000.00, 1), (N'Size L', N'+12.000đ', 12000.00, 1),
(N'Size S', N'Tiêu chuẩn', 0.00, 2), (N'Size M', N'+6.000đ', 6000.00, 2), (N'Size L', N'+12.000đ', 12000.00, 2),
(N'Size S', N'Tiêu chuẩn', 0.00, 3), (N'Size M', N'+6.000đ', 6000.00, 3), (N'Size L', N'+12.000đ', 12000.00, 3),
(N'Size S', N'Tiêu chuẩn', 0.00, 4), (N'Size M', N'+6.000đ', 6000.00, 4), (N'Size L', N'+12.000đ', 12000.00, 4),
(N'Size S', N'Tiêu chuẩn', 0.00, 5), (N'Size M', N'+6.000đ', 6000.00, 5), (N'Size L', N'+12.000đ', 12000.00, 5),
(N'Size S', N'Tiêu chuẩn', 0.00, 6), (N'Size M', N'+6.000đ', 6000.00, 6), (N'Size L', N'+12.000đ', 12000.00, 6),
(N'Size S', N'Tiêu chuẩn', 0.00, 7), (N'Size M', N'+6.000đ', 6000.00, 7), (N'Size L', N'+12.000đ', 12000.00, 7),
(N'Size S', N'Tiêu chuẩn', 0.00, 8), (N'Size M', N'+6.000đ', 6000.00, 8), (N'Size L', N'+12.000đ', 12000.00, 8),
(N'Size S', N'Tiêu chuẩn', 0.00, 9), (N'Size M', N'+6.000đ', 6000.00, 9), (N'Size L', N'+12.000đ', 12000.00, 9);
GO

-- 4.5. LIÊN KẾT TOPPING CHO TỪNG SẢN PHẨM
INSERT INTO [dbo].[ProductTopping] ([productId], [toppingId]) VALUES
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 2), (2, 3),
(3, 1), (3, 2), (3, 3),
(4, 1), (4, 2), (4, 3),
(5, 1), (5, 2),
(6, 1), (6, 2), (6, 3),
(7, 1), (7, 2), (7, 3),
(8, 1), (8, 2), (8, 3),
(9, 1), (9, 2);
GO

-- 4.6. NẠP MÃ GIẢM GIÁ (VOUCHER KHUYẾN MÃI)
SET IDENTITY_INSERT [dbo].[Voucher] ON;
INSERT INTO [dbo].[Voucher] ([id], [code], [title], [description], [discountType], [discountValue], [minOrderAmount], [maxDiscount], [usageLimit], [usedCount], [endDate], [isActive]) VALUES
(1, N'VELVETNEW', N'Ưu đãi thành viên mới', N'Giảm ngay 20.000đ cho đơn hàng đầu tiên tại Velvet & Brew', N'FIXED', 20000.00, 50000.00, NULL, NULL, 0, N'2027-12-31 23:59:59', 1),
(2, N'FREESHIP', N'Miễn phí vận chuyển', N'Freeship tối đa 25.000đ cho đơn hàng từ 100.000đ', N'FREESHIP', 25000.00, 100000.00, NULL, NULL, 0, N'2027-12-31 23:59:59', 1),
(3, N'VELVET50', N'Đặc quyền Velvet Club Gold', N'Giảm 50.000đ cho đơn hàng hội viên từ 150.000đ', N'FIXED', 50000.00, 150000.00, NULL, NULL, 0, N'2027-12-31 23:59:59', 1);
SET IDENTITY_INSERT [dbo].[Voucher] OFF;
GO

-- 4.7. NẠP KHO NGUYÊN LIỆU (CẢNH BÁO KHO CHO ADMIN DASHBOARD)
SET IDENTITY_INSERT [dbo].[InventoryItem] ON;
INSERT INTO [dbo].[InventoryItem] ([id], [name], [subTitle], [category], [currentStock], [minStock], [unit], [status]) VALUES
(1, N'Hạt Arabica Cầu Đất', N'Rang vừa (Medium Roast)', N'RAW', 4.50, 10.00, N'kg', N'LOW_STOCK'),
(2, N'Sữa tươi Dalat Milk', N'Thanh trùng nguyên kem', N'MILK', 12.00, 20.00, N'hộp', N'IN_STOCK'),
(3, N'Cốt Trà Oolong Mộc', N'Ủ lạnh 16h thủ công', N'TEA', 2.80, 5.00, N'Lít', N'LOW_STOCK');
SET IDENTITY_INSERT [dbo].[InventoryItem] OFF;
GO

-- 4.8. NẠP CẤU HÌNH CỬA HÀNG (STORE SETTINGS)
SET IDENTITY_INSERT [dbo].[StoreSetting] ON;
INSERT INTO [dbo].[StoreSetting] ([id], [key], [value], [description]) VALUES
(1, N'STORE_HOURS', N'Thứ Hai - Chủ Nhật: 07:00 - 22:30', N'Giờ mở cửa phục vụ'),
(2, N'HOTLINE', N'+84 (0) 24 3828 9999', N'Hotline chăm sóc khách hàng'),
(3, N'FLAGSHIP_ADDRESS', N'124 Phố Cổ, Quận Hoàn Kiếm, Hà Nội', N'Địa chỉ cửa hàng chính'),
(4, N'DELIVERY_RADIUS_KM', N'5.0', N'Bán kính giao hàng tối đa (km)'),
(5, N'TARGET_DELIVERY_MINS', N'20', N'Thời gian giao hàng mục tiêu (phút)'),
(6, N'DEFAULT_SHIPPING_FEE', N'25000', N'Phí vận chuyển tiêu chuẩn');
SET IDENTITY_INSERT [dbo].[StoreSetting] OFF;
GO

-- 4.9. TÀI KHOẢN MẪU (ADMIN & KHÁCH HÀNG DEMO)
-- Mật khẩu mặc định: '123456' (đã băm bằng bcrypt $2a$10$wTfU.PqY7eK/N05m24q0sOQ76LpE03rU7V5gO2Yx8iZ/L48r6y19i)
SET IDENTITY_INSERT [dbo].[User] ON;
INSERT INTO [dbo].[User] ([id], [fullName], [phoneNumber], [email], [password], [role], [gender], [nickname], [brewPoints], [membershipTier], [isActive]) VALUES
(1, N'Quản Trị Viên Velvet', N'0900000001', N'admin@velvetbrew.vn', N'$2a$10$wTfU.PqY7eK/N05m24q0sOQ76LpE03rU7V5gO2Yx8iZ/L48r6y19i', N'ADMIN', N'male', N'Admin', 500, N'DIAMOND', 1),
(2, N'Hoàng Minh Trí', N'0903888882', N'minhtri@velvetbrew.vn', N'$2a$10$wTfU.PqY7eK/N05m24q0sOQ76LpE03rU7V5gO2Yx8iZ/L48r6y19i', N'CUSTOMER', N'male', N'Trí', 245, N'GOLD', 1);
SET IDENTITY_INSERT [dbo].[User] OFF;
GO

-- 4.10. ĐỊA CHỈ NHẬN HÀNG MẪU CHO KHÁCH HÀNG
SET IDENTITY_INSERT [dbo].[Address] ON;
INSERT INTO [dbo].[Address] ([id], [userId], [recipientName], [phoneNumber], [street], [ward], [district], [city], [note], [label], [isDefault]) VALUES
(1, 2, N'Hoàng Minh Trí', N'0903888882', N'Tầng 5, Tòa nhà Artemis, 03 Lê Trọng Tấn', N'Khương Mai', N'Thanh Xuân', N'Hà Nội', N'Gửi lễ tân sảnh B', N'OFFICE', 1);
SET IDENTITY_INSERT [dbo].[Address] OFF;
GO

PRINT N'✅ ĐÃ KHỞI TẠO THÀNH CÔNG TOÀN BỘ CƠ SỞ DỮ LIỆU CAFE_DB TRÊN SQL SERVER!';
GO
