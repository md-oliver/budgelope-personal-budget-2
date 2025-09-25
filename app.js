import express from "express";
import bodyParser from "body-parser";
import envelopeRouter from "./server/envelopeApi.js";
import pg from "pg";
import env from "dotenv";
import {
    getAllFromDatabase,
    hasAnyBudgets,
    removeFromDatabaseById,
    getEnvelopeById,
    createEnvelope,
    addToDatabase,
    editEnvelopeById,
    withdrawFundsFromEnvelopeById,
    verifyEnvelopeData,
} from "./public/data.js";
import { stat } from "fs";

const app = express();
const PORT = process.env.PORT || 3000;
env.config();

const db = new pg.Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

// Body parsing middleware for json data
app.use(bodyParser.json());
// New route middleware for simplification
app.use("/envelopes", envelopeRouter);

// ID Normalize middleware
const normalizeID = (req, res, next) => {
    const envelopeId = Number(req.params.id);
    if (isNaN(parseFloat(envelopeId)) && !isFinite(envelopeId)) {
        res.status(400).send({
            status: "Failed",
            message: "Bad request. Unable to find matching ID",
            data: null,
        });
    } else {
        req.envelopeId = envelopeId;
        next();
    }
};

// Default envelope route
envelopeRouter.get("/", async (req, res) => {
    const query = "SELECT * FROM envelopes ORDER BY id ASC;";

    try {
        const result = await db.query(query);

        if (result.rowCount < 1) {
            return res.status(404).send({
                status: "Failed",
                message: "No records found",
                data: null,
            });
        }
        res.status(200).send({
            status: "Success",
            message: "Envelopes received",
            data: result.rows,
        });
    } catch (err) {
        return res.status(500).send({
            error: err.message,
        });
    }
});

// Get route for envelope by matching ID
envelopeRouter.get("/:id", normalizeID, async (req, res, next) => {
    const envelopeId = req.envelopeId;
    const query = "SELECT * FROM envelopes WHERE id = $1";

    try {
        const result = await db.query(query, [envelopeId]);

        if (result.rowCount < 1) {
            return res.status(404).send({
                status: "Failed",
                message: "No records found",
                data: null,
            });
        }

        res.status(200).send({
            status: "Success",
            message: "Envelope received",
            data: result.rows[0],
        });
    } catch (error) {
        return res.status(500).send({
            status: "Failed",
            error: err.message,
        });
    }
});

// Post route to the default envelope route
envelopeRouter.post("/", async (req, res, next) => {
    const { title, budget } = req.body;

    try {
        const temporaryEnvelope = createEnvelope(title, budget);

        if (verifyEnvelopeData(temporaryEnvelope)) {
            const query =
                "INSERT INTO envelopes (title, budget) VALUES ($1, $2) RETURNING *;";
            const result = await db.query(query, [title, budget]);

            res.status(201).send({
                status: "Success",
                message: "Envelope created",
                data: result.rows[0],
            });
        }
    } catch (err) {
        return res.status(500).send({
            status: "Failed",
            error: err.message,
        });
    }
});

// Withdrawel route for making withdrawels from a specific envelope by ID
// envelopeRouter.put("/:id", (req, res, next) => {
//     const withdrawEnvelope = req.body;
//     const requestedEnvelope = getEnvelopeById(Number(req.params.id));

//     if (requestedEnvelope !== null) {
//         const updatedEnvelope = withdrawFundsFromEnvelopeById(
//             requestedEnvelope.id,
//             withdrawEnvelope.budget
//         );
//         if (updatedEnvelope !== null) {
//             res.status(200).send(updatedEnvelope);
//         } else {
//             res.status(400).send("Bad data, unable to make this transaction");
//         }
//     } else {
//         res.status(404).send("Unable to find the requested envelope");
//     }
// });

// Post route for specific envelope by ID, updating the whole envelope
envelopeRouter.post("/:id", normalizeID, async (req, res, next) => {
    const withdrawEnvelope = req.body;
    const requestedEnvelopeID = req.envelopeId;

    const query = "UPDATE envelopes SET title = $1, budget = $2 WHERE id = $3";

    db.query(
        query,
        [
            withdrawEnvelope.title || "default",
            withdrawEnvelope.budget || 0,
            requestedEnvelopeID,
        ],
        (err, response) => {
            if (err) {
                console.log(err.stack);
                res.status(500).send("An error has occured");
            } else {
                if (response.rowCount > 0) {
                    res.status(200).send("Updated Successfully");
                } else {
                    res.status(404).send(
                        "Unable to find envelope with the specified ID"
                    );
                }
            }
        }
    );
});

// Transfer route, requires an id of a source envelope id (fromId), and a destination envelope Id (toId)
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

// Remove route for removing a specific envelope by id
envelopeRouter.delete("/:id", normalizeID, async (req, res, next) => {
    const envelopeId = req.envelopeId;

    try {
        const getQuery = "SELECT * FROM envelopes WHERE id = $1;";
        const getresult = await db.query(getQuery, [envelopeId]);

        if (getresult.rowCount < 1) {
            return res.status(404).send({
                status: "Failed",
                message: "No records found with matching ID",
                data: null,
            });
        }

        const deleteQuery = "DELETE FROM envelopes WHERE id = $1;";
        await db.query(deleteQuery, [envelopeId]);
        res.sendStatus(204);
    } catch (err) {
        return res.status(500).send({
            status: "Failed",
            error: err.message,
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
