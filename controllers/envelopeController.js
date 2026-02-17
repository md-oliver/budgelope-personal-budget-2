import Envelope from "../models/envelope.js";
import mongoose from "mongoose";
import HTTPError from "../models/httpError.js";
import Transaction from "../models/transactions.js";

const notValidId = (id) => {
    return isNaN(parseInt(id)) && !isFinite(id);
};

// Verify if the data received for the envelope is correct and valid
const verifyEnvelopeData = (envelope) => {
    if (typeof envelope.title !== "string")
        throw new Error("Title needs to be a string type");
    if (!isNaN(parseFloat(envelope.budget) && isFinite(envelope.budget))) {
        envelope.budget = Number(envelope.budget);
    } else throw new Error("The budget needs to be a number type");

    return true;
};

// Create a new envelope
const createEnvelope = (title, budget) => {
    return {
        title: title,
        budget: budget,
    };
};

// ID Normalize middleware
const getTransferIds = (req, res, next) => {
    const fromId = req.body.withdrawId;
    const toId = req.body.transferId;
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

export const getAllEnvelopes = async (req, res, next) => {
    let envelopes;

    try {
        envelopes = await Envelope.find();
    } catch (err) {
        return next(err);
    }

    if (!envelopes) {
        return res.status(500).send({
            error: err.message,
        });
    }

    res.status(200).render("index.ejs", {
        status: "Success",
        message: "Envelopes received",
        data: envelopes.map((env) => env.toObject({ getters: true })),
    });
};

export const createNewEnvelope = async (req, res, next) => {
    const { title, budget } = req.body;

    let envelope;
    try {
        const temporaryEnvelope = createEnvelope(title, budget);

        if (verifyEnvelopeData(temporaryEnvelope)) {
            envelope = new Envelope(temporaryEnvelope);
        }
    } catch (err) {
        return next(err);
    }

    if (!envelope) {
        return res.status(500).send({
            status: "Failed",
            error: err.message,
        });
    }

    try {
        await envelope.save();
    } catch (err) {
        return next(err);
    }

    res.status(201).redirect("/");
};

export const deleteById = async (req, res, next) => {
    const envelopeId = req.params.id;

    let requestedEnvelope;
    try {
        requestedEnvelope = await Envelope.findById(envelopeId);
        // if (getResult.rowCount < 1) {
        //     return res.status(404).send({
        //         status: "Failed",
        //         message: "No records found with matching ID",
        //         data: null,
        //     });
        // }
    } catch (err) {
        return next(err);
    }

    if (!requestedEnvelope) {
        return res.status(500).send({
            status: "Failed",
            error: err.message,
        });
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await requestedEnvelope.deleteOne({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        // const error = new HTTPError(
        //     err.message || "Something went wrong, could not delete place",
        //     err.code || 500
        // );
        return next(err);
    }

    res.status(204).redirect("/");
};

export const updateEnvelopeById = async (req, res, next) => {
    const { title, budget } = req.body;
    const requestedEnvelopeID = req.params.id;

    let envelope;
    try {
        envelope = await Envelope.findById(requestedEnvelopeID);
    } catch (err) {
        return next(err);
    }

    if (!envelope) {
        return res.status(500).send({
            status: "Failed",
            message: err.message,
        });
    }

    try {
        const tempEnvelope = createEnvelope(title, budget);

        const sess = await mongoose.startSession();
        sess.startTransaction();

        if (verifyEnvelopeData(tempEnvelope)) {
            envelope.title = title;
            envelope.budget = budget;

            await envelope.save({ session: sess });
            await sess.commitTransaction();
        }
    } catch (err) {
        return next(err);
    }

    res.status(200).redirect("/");
};

export const createTransferTransaction = async (req, res, next) => {
    const { title, amount, withdrawId, transferId } = req.body;

    let sourceEnvelope;
    let destinationEnvelope;
    try {
        if (withdrawId === transferId) {
            return res.status(400).send({
                status: "Failed",
                message:
                    "Cannot make a transfer to the same as the destination",
                data: null,
            });
        }

        sourceEnvelope = await Envelope.findById(withdrawId);
        destinationEnvelope = await Envelope.findById(transferId);
    } catch (err) {
        return res.status(500).send({
            status: "Failed",
            message: err.message,
        });
    }
    if (!sourceEnvelope || !destinationEnvelope) {
        return next(
            new HTTPError(
                "Unable to find any envleopes with the provided ID's",
                404,
            ),
        );
    }

    const transactionAmount = parseFloat(amount);
    let withdrawelBudget = sourceEnvelope.budget;
    let transferBudget = destinationEnvelope.budget;

    if (withdrawelBudget >= transactionAmount) {
        try {
            const sess = await mongoose.startSession();
            sess.startTransaction();
            const date = new Date();

            withdrawelBudget -= transactionAmount;
            transferBudget += transactionAmount;

            const transaction = new Transaction({
                amount: transactionAmount,
                reference: title,
                date: date,
                from: sourceEnvelope,
                to: destinationEnvelope,
            });

            sourceEnvelope.budget = withdrawelBudget;
            destinationEnvelope.budget = transferBudget;

            await sourceEnvelope.save({ session: sess });
            await destinationEnvelope.save({ session: sess });
            await transaction.save({ session: sess });

            await sess.commitTransaction();
        } catch (error) {
            return next(
                new HTTPError(
                    error.message ||
                        "Transfer could not complete, please try again later",
                    error.code || 500,
                ),
            );
        }
    } else {
        return res.status(500).send({
            status: "Failed",
            message: "Unable to make transacton: Insufficient funds",
        });
    }

    res.status(200).redirect("/");
};
