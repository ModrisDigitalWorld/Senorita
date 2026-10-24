import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import categoriesRouter from "./categories.js";
import ordersRouter from "./orders.js";
import cartRouter from "./cart.js";
import reviewsRouter from "./reviews.js";
import adminRouter from "./admin.js";
import checkoutRouter from "./checkout.js";
import seedRouter from "./seed.js";
import storageRouter from "./storage.js";
import bannersRouter from "./banners.js";
import cloudinaryRouter from "./cloudinary.js";
import aiRouter from "./ai.js";
import razorpayRouter from "./razorpay.js";
import variantOptionsRouter from "./variant-options.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(ordersRouter);
router.use(cartRouter);
router.use(reviewsRouter);
router.use(adminRouter);
router.use(checkoutRouter);
router.use(seedRouter);
router.use(storageRouter);
router.use(bannersRouter);
router.use(cloudinaryRouter);
router.use(aiRouter);
router.use(razorpayRouter);
router.use(variantOptionsRouter);

export default router;
