const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucherController");

router.get("/", voucherController.getAllVouchers);
router.post("/check", voucherController.checkVoucher);
router.get("/my-vouchers", voucherController.getMyVouchers);

module.exports = router;
