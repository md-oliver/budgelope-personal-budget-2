import mongoose, { Schema } from "mongoose";

const envelopeSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    budget: {
        type: Number,
        required: true,
    },
});

export default mongoose.model("Envelope", envelopeSchema);
