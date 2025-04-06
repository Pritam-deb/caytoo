import express from "express";

const emailRouter = express.Router();

emailRouter.get("/", (req, res) => {
    res.send("Hello from email route");
})

export default emailRouter;
