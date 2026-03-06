import { Router } from "express";
import {
    getAllEnvelopes,
    createNewEnvelope,
    deleteById,
    updateEnvelopeById,
    createTransferTransaction,
} from "../controllers/envelopeController.js";

const envelopeRouter = Router();

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
