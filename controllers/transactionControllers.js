import mongoose from "mongoose";
import Transaction from "../models/transactions.js";

export const getAllTransactions = async (req, res, next) => {
    let transactionData;

    try {
        transactionData = await Transaction.find().populate("from to");
    } catch (err) {
        return next(err);
    }

    if (!transactionData) {
        return res.status(500).send({
            status: "Failed",
            message: err.message,
        });
    }

    res.status(200).render("transactions.ejs", {
        status: "Success",
        message: "Transactions received",
        data: transactionData,
    });
};
