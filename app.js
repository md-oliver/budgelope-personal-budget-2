import express from "express";
import bodyParser from "body-parser";
import envelopeRouter from "./server/envelopeApi.js";
import pg from "pg";
import env from "dotenv";
import { createEnvelope, verifyEnvelopeData } from "./server/data.js";
import methodOverride from "method-override";
import cors from "cors";
import { dirname } from "path";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

env.config();

const db = new pg.Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
// Body parsing middleware for json data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    methodOverride((req, res) => {
        if (req.body && typeof req.body === "object" && "_method" in req.body) {
            // look in urlencoded POST bodies and delete it
            var method = req.body._method;
            // console.log(method, req.body._method);
            delete req.body._method;
            return method;
        }
    })
);

const notValidId = (id) => {
    return isNaN(parseInt(id)) && !isFinite(id);
};

// New route middleware for simplification
app.use("/envelopes", envelopeRouter);

// ID Normalize middleware
const normalizeID = (req, res, next) => {
    const envelopeId = Number(req.params.id);
    if (notValidId(envelopeId)) {
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

// ID Normalize middleware
const getTransferIds = (req, res, next) => {
    const fromId = parseInt(req.body.withdrawId);
    const toId = parseInt(req.body.transferId);
    if (notValidId(fromId) && notValidId(toId)) {
        res.status(400).send({
            status: "Failed",
            message: "Bad request. Unable to find retrieve transfer IDs",
            data: null,
        });
    } else {
        req.withdrawId = fromId;
        req.transferId = toId;
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

        res.status(200).render("index.ejs", {
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

envelopeRouter.post("/transfer", getTransferIds, async (req, res, next) => {
    const { title, amount } = req.body;

    console.log(req.body);

    try {
        const selectQuery = "SELECT * FROM envelopes WHERE id = $1;";

        if (req.withdrawId === req.transferId) {
            return res.status(400).send({
                status: "Failed",
                message:
                    "Cannot make a transfer to the same as the destination",
                data: null,
            });
        }

        const sourceResult = await db.query(selectQuery, [req.withdrawId]);
        const destinationResult = await db.query(selectQuery, [req.transferId]);

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
                req.withdrawId,
            ]);
            await db.query(transactionQuery, [
                title,
                transactionAmount,
                date,
                req.transferId,
            ]);

            await db.query(updateQuery, [withdrawelBudget, req.withdrawId]);
            await db.query(updateQuery, [transferBudget, req.transferId]);

            await db.query("COMMIT");

            res.status(200).redirect("/envelopes");
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

// // Post route to the default envelope route
envelopeRouter.post("/", async (req, res, next) => {
    const { title, budget } = req.body;

    try {
        const temporaryEnvelope = createEnvelope(title, budget);

        if (verifyEnvelopeData(temporaryEnvelope)) {
            const query =
                "INSERT INTO envelopes (title, budget) VALUES ($1, $2) RETURNING *;";
            await db.query(query, [title, budget]);

            res.status(201).redirect("/envelopes");
        }
    } catch (err) {
        return res.status(500).send({
            status: "Failed",
            error: err.message,
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
                res.status(200).redirect("/envelopes");
            }
        }
    } catch (err) {
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

        res.status(204).redirect("/envelopes");
        // res.sendStatus(204);
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
