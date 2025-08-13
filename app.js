import express from "express";
import bodyParser from "body-parser";
import envelopeRouter from "./server/envelopeApi.js";
import {
    getAllFromDatabase,
    hasAnyBudgets,
    removeFromDatabaseById,
    getEnvelopeById,
    createEnvelope,
    addToDatabase,
    editEnvelopeById,
    withdrawFundsFromEnvelopeById,
} from "./public/data.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use("/envelopes", envelopeRouter);

app.get("/", (req, res, next) => {
    res.send("<h1>Hello World!</h1>");
});

envelopeRouter.get("/", (req, res, next) => {
    if (!hasAnyBudgets()) {
        res.send(
            "No budgets set. Create a new envelope to help track your budgets"
        );
    } else {
        res.status(200).send(getAllFromDatabase());
    }
});

envelopeRouter.get("/:id", (req, res, next) => {
    const envelopeId = Number(req.params.id);

    if (getEnvelopeById(envelopeId) === null) {
        res.status(404).send("Can't find the requested envelope");
    } else {
        const envelope = getEnvelopeById(envelopeId);
        res.status(200).send(envelope);
    }
});

envelopeRouter.post("/", (req, res, next) => {
    const envBody = req.body;

    const envelope = addToDatabase(
        createEnvelope(envBody.title, envBody.budget)
    );
    res.status(201).send(envelope);
});

envelopeRouter.put("/:id", (req, res, next) => {
    const withdrawEnvelope = req.body;
    const requestedEnvelope = getEnvelopeById(Number(req.params.id));

    if (requestedEnvelope !== null) {
        const updatedEnvelope = withdrawFundsFromEnvelopeById(
            requestedEnvelope.id,
            withdrawEnvelope.budget
        );
        if (updatedEnvelope !== null) {
            res.status(200).send(updatedEnvelope);
        } else {
            res.status(400).send("Bad data, unable to make this transaction");
        }
    } else {
        res.status(404).send("Unable to find the requested envelope");
    }
});

envelopeRouter.post("/:id", (req, res, next) => {
    const pendingEnvelope = req.body;
    const requestedEnvelope = getEnvelopeById(Number(req.params.id));

    if (requestedEnvelope !== null) {
        pendingEnvelope.id = Number(req.params.id);
        const updatedEnvelope = editEnvelopeById(
            pendingEnvelope.id,
            pendingEnvelope
        );

        if (updatedEnvelope !== null) {
            res.status(200).send(updatedEnvelope);
        } else {
            res.status(400).send("Unable to make the update to the envelope");
        }
    } else {
        res.status(404).send("Unable to find the requested envelope");
    }
});

envelopeRouter.post("/:fromId/:toId", (req, res, next) => {
    const transfer = req.body;
    const sourceEnvelope = getEnvelopeById(Number(req.params.fromId));
    const destinationEnvelope = getEnvelopeById(Number(req.params.toId));

    if ((sourceEnvelope !== null) & (destinationEnvelope !== null)) {
        if (sourceEnvelope === destinationEnvelope)
            res.status(400).send(
                "Cannot make a transfer to the same as the destination"
            );

        if (transfer && sourceEnvelope.budget >= transfer.amount) {
            if (
                !isNaN(parseFloat(transfer.amount)) &&
                isFinite(transfer.amount)
            ) {
                sourceEnvelope.budget -= Number(transfer.amount);
                destinationEnvelope.budget += Number(transfer.amount);
                res.status(200).send({
                    withdrawal: sourceEnvelope,
                    transfer: destinationEnvelope,
                });
            } else {
                res.status(400).send("Transfer amount must be a number type");
            }
        } else {
            res.status(400).send("Bad data, unable to make this transaction");
        }
    } else {
        res.status(404).send("Can't find the requested envelope/s");
    }
});

envelopeRouter.delete("/:id", (req, res, next) => {
    const id = Number(req.params.id);
    if (removeFromDatabaseById(id)) {
        res.status(204).send("Removed envelope successfully");
    } else {
        res.status(404).send("Can't find the requested envelope");
    }
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
