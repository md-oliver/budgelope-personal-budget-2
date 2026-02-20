import mongoose, { Schema } from "mongoose";

const transactionSchema = new Schema({
    amount: {
        type: Number,
        required: true,
    },
    reference: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    from: {
        type: Object,
        required: true,
    },
    to: {
        type: Object,
        required: true,
    },
});

export default mongoose.model("Transaction", transactionSchema);
