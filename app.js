import express from "express";
import bodyParser from "body-parser";
import envelopeRouter from "./server/envelopeApi.js";
import pg from "pg";
import env from "dotenv";
import { createEnvelope, verifyEnvelopeData } from "./public/data.js";
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

// Get all transactions:
app.get("/transactions", async (req, res, next) => {
    const query = "SELECT * FROM transactions;";
    try {
        const result = await db.query(query);

        res.status(200).send({
            status: "Success",
            message: "Transactions received",
            data: result.rows,
        });
    } catch (err) {
        res.status(500).send({
            status: "Failed",
            message: err.message,
        });
    }
});

// Get all transactions:
app.get("/transactions/:id", async (req, res, next) => {
    const query = "SELECT * FROM transactions WHERE id = $1;";
    const transactionId = Number(req.params.id);
    try {
        const result = await db.query(query, [transactionId]);

        res.status(200).send({
            status: "Success",
            message: "Transactions received",
            data: result.rows[0],
        });
    } catch (err) {
        res.status(500).send({
            status: "Failed",
            message: err.message,
        });
    }
});

// Get all transactions:
app.get("/transactions/envelopes/:envelopeId", async (req, res, next) => {
    const query = "SELECT * FROM transactions WHERE envelope_id = $1;";
    const envelopeId = Number(req.params.envelopeId);
    try {
        const result = await db.query(query, [envelopeId]);

        res.status(200).send({
            status: "Success",
            message: "Transactions received",
            data: result.rows,
        });
    } catch (err) {
        res.status(500).send({
            status: "Failed",
            message: err.message,
        });
    }
});

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
envelopeRouter.put("/:id", normalizeID, async (req, res, next) => {
    const envelopeId = req.envelopeId;
    const { title, amount } = req.body;

    try {
        const recordQuery = "SELECT budget FROM envelopes WHERE id = $1";
        const recordResult = await db.query(recordQuery, [envelopeId]);

        if (recordResult.rowCount < 1) {
            return res.status(404).send({
                status: "Failed",
                message: "No records found",
                data: null,
            });
        }

        await db.query("BEGIN");

        const transactionAmount = Number.parseFloat(amount);
        let envelopeBudget = Number.parseFloat(recordResult.rows[0].budget);

        if (envelopeBudget >= transactionAmount) {
            const date = new Date();
            envelopeBudget -= transactionAmount;
            const transactionQuery =
                "INSERT INTO transactions(title, amount, date, envelope_id)VALUES($1, $2, $3, $4) RETURNING *";
            const updateQuery =
                "UPDATE envelopes SET budget = $1 WHERE id = $2;";

            const transactionResult = await db.query(transactionQuery, [
                title,
                transactionAmount,
                date,
                envelopeId,
            ]);
            await db.query(updateQuery, [envelopeBudget, envelopeId]);
            await db.query("COMMIT");

            res.status(201).send({
                status: "Success",
                message: "Transaction Successful",
                data: transactionResult.rows[0],
            });
        } else {
            return res.status(400).send({
                status: "Failed",
                message: "Unable to make transacton: Insufficient funds",
            });
        }
    } catch (err) {
        await db.query("ROLLBACK");

        return res.status(500).send({
            status: "Failed",
            message: err.message,
        });
    }
});

// Post route for specific envelope by ID, updating the whole envelope
envelopeRouter.post("/:id", normalizeID, async (req, res, next) => {
    const { title, budget } = req.body;
    const requestedEnvelopeID = req.envelopeId;

    try {
        const getQuery = "SELECT * FROM envelopes WHERE id = $1;";
        const getRecord = await db.query(getQuery, [requestedEnvelopeID]);

        if (getRecord.rowCount < 1) {
            return res.status(404).send({
                status: "Failed",
                message: "No record found with matching ID",
                data: null,
            });
        }

        const updateQuery =
            "UPDATE envelopes SET title = $1, budget = $2 WHERE id = $3 RETURNING *;";
        const tempEnvelope = createEnvelope(title, budget);

        if (verifyEnvelopeData(tempEnvelope)) {
            const updateResult = await db.query(updateQuery, [
                title,
                budget,
                requestedEnvelopeID,
            ]);

            if (updateResult.rowCount > 0) {
                res.status(200).send({
                    status: "Success",
                    message: "Updated envelope successfully",
                    data: updateResult.rows[0],
                });
            }
        }
    } catch (err) {
        return res.status(500).send({
            status: "Failed",
            message: err.message,
        });
    }
});

// Transfer route, requires an id of a source envelope id (fromId), and a destination envelope Id (toId)
// envelopeRouter.post("/:fromId/:toId", (req, res, next) => {
//     const transfer = req.body;
//     const sourceEnvelope = getEnvelopeById(Number(req.params.fromId));
//     const destinationEnvelope = getEnvelopeById(Number(req.params.toId));

//     if ((sourceEnvelope !== null) & (destinationEnvelope !== null)) {
//         if (sourceEnvelope === destinationEnvelope)
//             res.status(400).send(
//                 "Cannot make a transfer to the same as the destination"
//             );

//         if (transfer && sourceEnvelope.budget >= transfer.amount) {
//             if (
//                 !isNaN(parseFloat(transfer.amount)) &&
//                 isFinite(transfer.amount)
//             ) {
//                 sourceEnvelope.budget -= Number(transfer.amount);
//                 destinationEnvelope.budget += Number(transfer.amount);
//                 res.status(200).send({
//                     withdrawal: sourceEnvelope,
//                     transfer: destinationEnvelope,
//                 });
//             } else {
//                 res.status(400).send("Transfer amount must be a number type");
//             }
//         } else {
//             res.status(400).send("Bad data, unable to make this transaction");
//         }
//     } else {
//         res.status(404).send("Can't find the requested envelope/s");
//     }
// });

// Transfer route, requires an id of a source envelope id (fromId), and a destination envelope Id (toId)
envelopeRouter.post("/:fromId/:toId", async (req, res, next) => {
    const { title, amount } = req.body;
    const sourceEnvelopeId = parseInt(req.params.fromId);
    const destinationEnvelopeId = parseInt(req.params.toId);

    try {
        const selectQuery = "SELECT * FROM envelopes WHERE id = $1;";

        if (isNaN(sourceEnvelopeId) || isNaN(destinationEnvelopeId)) {
            return res.status(404).send({
                status: "Failed",
                message: "Cannot find the requested envelope/s",
                data: null,
            });
        }

        if (sourceEnvelopeId === destinationEnvelopeId) {
            return res.status(400).send({
                status: "Failed",
                message:
                    "Cannot make a transfer to the same as the destination",
                data: null,
            });
        }

        const sourceResult = await db.query(selectQuery, [sourceEnvelopeId]);
        const destinationResult = await db.query(selectQuery, [
            destinationEnvelopeId,
        ]);

        if (sourceResult.rowCount < 1 || destinationResult.rowCount < 1) {
            return res.status(400).send({
                status: "Failed",
                message: "Cannot find the requested envelope/s",
                data: null,
            });
        }

        const transactionAmount = parseFloat(amount);
        let withdrawelBudget = parseFloat(sourceResult.rows[0].budget);
        let transferBudget = parseFloat(destinationResult.rows[0].budget);

        if (withdrawelBudget >= transactionAmount) {
            await db.query("BEGIN");

            const date = new Date();
            withdrawelBudget -= transactionAmount;
            transferBudget += transactionAmount;

            const transactionQuery =
                "INSERT INTO transactions(title, amount, date, envelope_id)VALUES($1, $2, $3, $4) RETURNING *";
            const updateQuery =
                "UPDATE envelopes SET budget = $1 WHERE id = $2 RETURNING *";

            await db.query(transactionQuery, [
                title,
                transactionAmount,
                date,
                sourceEnvelopeId,
            ]);
            await db.query(transactionQuery, [
                title,
                transactionAmount,
                date,
                destinationEnvelopeId,
            ]);

            const withdrawelResult = await db.query(updateQuery, [
                withdrawelBudget,
                sourceEnvelopeId,
            ]);
            const transferResult = await db.query(updateQuery, [
                transferBudget,
                destinationEnvelopeId,
            ]);

            await db.query("COMMIT");

            res.status(200).send({
                status: "Success",
                message: "Transaction Successful",
                data: {
                    withdrawel: withdrawelResult.rows[0],
                    transfer: transferResult.rows[0],
                },
            });
        } else {
            return res.status(500).send({
                status: "Failed",
                message: "Unable to make transacton: Insufficient funds",
            });
        }
    } catch (err) {
        await db.query("ROLLBACK");
        return res.status(500).send({
            status: "Failed",
            message: err.message,
        });
    }
});

// Remove route for removing a specific envelope by id
envelopeRouter.delete("/:id", normalizeID, async (req, res, next) => {
    const envelopeId = req.envelopeId;

    try {
        const getQuery = "SELECT * FROM envelopes WHERE id = $1;";
        const getResult = await db.query(getQuery, [envelopeId]);

        if (getResult.rowCount < 1) {
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
