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
} from "./public/data.js";

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
        res.status(400).send("Unable to retrieve the envlope ID");
    } else {
        req.envelopeId = envelopeId;
        next();
    }
};

// Default route, working
app.get("/", (req, res, next) => {
    res.send("<h1>Hello World!</h1>");
});

// Default envelope route
envelopeRouter.get("/", async (req, res) => {
    const query = "SELECT * FROM envelopes;";

    db.query(query, (err, response) => {
        if (err) {
            console.error("Error executing query", err.stack);
        } else {
            res.send(response.rows);
        }
    });
});

//  Get request for individual Envelope with matching ID
envelopeRouter.get("/:id", normalizeID, async (req, res, next) => {
    const envelopeId = req.envelopeId;

    try {
        const query = "SELECT * FROM envelopes WHERE id = $1";
        const result = await db.query(query, [envelopeId]);

        if (result.rowCount > 0) {
            res.send(result.rows);
        } else {
            res.status(404).send(`No envelope with id ${envelopeId}`);
        }
    } catch (error) {
        console.log("Error occured", error.stack);
    }
});

// Post route to the default envelope route
envelopeRouter.post("/", (req, res, next) => {
    const envBody = req.body;

    // const query = "INSERT INTO envelopes (title, budget) VALUES ($1, $2)";

    const envelope = addToDatabase(
        createEnvelope(envBody.title, envBody.budget)
    );
    res.status(201).send(envelope);
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
// envelopeRouter.post("/:id", (req, res, next) => {
//     const pendingEnvelope = req.body;
//     const requestedEnvelope = getEnvelopeById(Number(req.params.id));

//     if (requestedEnvelope !== null) {
//         pendingEnvelope.id = Number(req.params.id);
//         const updatedEnvelope = editEnvelopeById(
//             pendingEnvelope.id,
//             pendingEnvelope
//         );

//         if (updatedEnvelope !== null) {
//             res.status(200).send(updatedEnvelope);
//         } else {
//             res.status(400).send("Unable to make the update to the envelope");
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
envelopeRouter.delete("/:id", (req, res, next) => {
    const id = Number(req.params.id);
    if (removeFromDatabaseById(id)) {
        res.status(204).send("Removed envelope successfully");
    } else {
        res.status(404).send("Can't find the requested envelope");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
