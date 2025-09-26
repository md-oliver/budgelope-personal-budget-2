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

// Total budget calculation of all the envelopes budgets in the array
const totalBudget = () => {
    return allBudgets.reduce((accumulator, reducer) => {
        return (accumulator += reducer.budget);
    }, 0);
};

export { createEnvelope, verifyEnvelopeData };
