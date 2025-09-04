// global iterator for every envelope created
let idIterator = 0;

// Verify if the data received for the envelope is correct and valid
const verifyEnvelopeData = (envelope) => {
    // envelope.title = envelope.title || "";
    // envelope.budget = envelope.budget || 0;

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
        id: ++idIterator,
        title: title,
        budget: budget,
    };
};

// Main array that holds all the envelopes
let allBudgets = [];

// Total budget calculation of all the envelopes budgets in the array
const totalBudget = () => {
    return allBudgets.reduce((accumulator, reducer) => {
        return (accumulator += reducer.budget);
    }, 0);
};

// Create random dummy data
const createTempData = () => {
    let defaultCategories = [
        "groceries",
        "fuel",
        "healthcare",
        "clothing",
        "diningOut",
        "householdItems",
        "petCare",
        "family",
    ];
    let defaultBudgetValues = [250, 500, 750, 1000, 1500, 2000];
    const randomCategory = Math.floor(Math.random() * defaultCategories.length);
    const randomBuget = Math.floor(Math.random() * defaultBudgetValues.length);
    const envelope = createEnvelope(
        defaultCategories[randomCategory],
        defaultBudgetValues[randomBuget]
    );
    return envelope;
};

// Check for if the array is empty
const hasAnyBudgets = () => {
    return allBudgets.length > 0;
};

// Retrieve all data in the array
const getAllFromDatabase = () => {
    return allBudgets;
};

// Add a new envelope into the array database
const addToDatabase = (instance) => {
    if (verifyEnvelopeData(instance)) {
        allBudgets.push(instance);
    }
    return allBudgets[allBudgets.length - 1];
};

// Remove an envelope from the database by id
const removeFromDatabaseById = (id) => {
    if (isNaN(parseFloat(id)) && !isFinite(id)) {
        return null;
    } else {
        id = Number(id);
        const index = allBudgets.findIndex((envelope) => envelope.id === id);
        if (allBudgets[index] !== undefined && index !== -1) {
            allBudgets.splice(index, 1);
            return true;
        } else return false;
    }
};

// Retrieve the envelope by Id
const getEnvelopeById = (id) => {
    if (isNaN(parseFloat(id)) && !isFinite(id)) {
        return null;
    } else {
        id = Number(id);
        const envelope = allBudgets.find((budget) => budget.id === id);
        if (envelope !== undefined) return envelope;
        else return null;
    }
};

// Make a withdrawel from a a specific envelope by id
const withdrawFundsFromEnvelopeById = (id, withdrawelAmount) => {
    const oldEnvelope = getEnvelopeById(id);
    const index = allBudgets.findIndex(
        (envelope) => envelope.id === oldEnvelope.id
    );
    if (index !== undefined) {
        if (withdrawelAmount <= oldEnvelope.budget) {
            oldEnvelope.budget -= withdrawelAmount;
            allBudgets[index] = oldEnvelope;
            return allBudgets[index];
        } else {
            throw new Error("You have insufficient funds for the transaction.");
        }
    } else {
        return null;
    }
};

// Make a full edit of an envelope by id and update it in the array
const editEnvelopeById = (id, updatedEnvelope) => {
    const oldEnvelope = getEnvelopeById(id);
    const index = allBudgets.findIndex(
        (envelope) => envelope.id === oldEnvelope.id
    );
    if (index !== undefined && verifyEnvelopeData(updatedEnvelope)) {
        allBudgets[index] = updatedEnvelope;
        return allBudgets[index];
    } else {
        return null;
    }
};

// Mock data for testing
allBudgets = new Array(5).fill(0).map(createTempData);

export {
    createEnvelope,
    verifyEnvelopeData,
    getAllFromDatabase,
    removeFromDatabaseById,
    addToDatabase,
    hasAnyBudgets,
    getEnvelopeById,
    withdrawFundsFromEnvelopeById,
    editEnvelopeById,
};
