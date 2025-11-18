import express from "express";
import webhookController from "../controllers/webhook.controller.js";

const router = express.Router();

router.post("/payu", webhookController.payu);
router.post("/cashfree", webhookController.cashfree);


export default router;
