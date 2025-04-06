import express from "express";
import emailRouter from "./emails";
const router = express.Router();

router.use("/getFromEmail", emailRouter)

export default router;
