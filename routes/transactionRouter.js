import { Router } from "express";
import { getAllTransactions } from "../controllers/transactionControllers.js";

const transactionRouter = Router();

// Get all transactions:
transactionRouter.get("/", getAllTransactions);

// unused route
// transactionRouter.get("/:id", async (req, res, next) => {
//     const query = "SELECT * FROM transactions WHERE id = $1;";
//     const transactionId = Number(req.params.id);
//     try {
//         const result = await db.query(query, [transactionId]);

//         res.status(200).send({
//             status: "Success",
//             message: "Transactions received",
//             data: result.rows[0],
//         });
//     } catch (err) {
//         res.status(500).send({
//             status: "Failed",
//             message: err.message,
//         });
//     }
// });

// Unused route
// transactionRouter.get("/envelopes/:envelopeId", async (req, res, next) => {
//     const query = "SELECT * FROM transactions WHERE envelope_id = $1;";
//     const envelopeId = Number(req.params.envelopeId);
//     try {
//         const result = await db.query(query, [envelopeId]);

//         res.status(200).send({
//             status: "Success",
//             message: "Transactions received",
//             data: result.rows,
//         });
//     } catch (err) {
//         res.status(500).send({
//             status: "Failed",
//             message: err.message,
//         });
//     }
// });

export default transactionRouter;
