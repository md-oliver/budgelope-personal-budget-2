import { Router } from "express";
import { getAllTransactions } from "../controllers/transactionControllers.js";

const transactionRouter = Router();

// Get all transactions:
transactionRouter.get("/", getAllTransactions);

export default transactionRouter;
