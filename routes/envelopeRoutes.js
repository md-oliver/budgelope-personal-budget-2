import { Router } from "express";
const envelopeRouter = Router();
import {
    getAllEnvelopes,
    createNewEnvelope,
    deleteById,
    updateEnvelopeById,
    createTransferTransaction,
} from "../controllers/envelopeController.js";

// ID Normalize middleware
// TODO: VALIDATE MIDDLEWARE
// const normalizeID = (req, res, next) => {
//     const envelopeId = Number(req.params.id);
//     if (notValidId(envelopeId)) {
//         res.status(400).send({
//             status: "Failed",
//             message: "Bad request. Unable to find matching ID",
//             data: null,
//         });
//     } else {
//         req.envelopeId = envelopeId;
//         next();
//     }
// };

// Default envelope route
envelopeRouter.get("/", getAllEnvelopes);

// // Post route to the default envelope route
envelopeRouter.post("/", createNewEnvelope);

// make a transfer between envelopes
envelopeRouter.post("/transfer", createTransferTransaction);

// Post route for specific envelope by ID, updating the whole envelope
envelopeRouter.post("/:id", updateEnvelopeById);

// Remove route for removing a specific envelope by id
envelopeRouter.delete("/:id", deleteById);

export default envelopeRouter;
