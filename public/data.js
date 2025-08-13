let idIterator = 0;

const verifyEnvelopeData = (envelope) => {
    envelope.title = envelope.title || "";
    envelope.budget = envelope.budget || 0;

    if (typeof envelope.title !== "string")
        throw new Error("Title needs to be a string type");
    if (!isNaN(parseFloat(envelope.budget) && isFinite(envelope.budget))) {
        envelope.budget = Number(envelope.budget);
    } else throw new Error("The budget needs to be a number type");

    return true;
};

const createEnvelope = (title, budget) => {
    return {
        id: ++idIterator,
        title: title,
        budget: budget,
    };
};

let allBudgets = [];

let totalBudget = () => {
    return allBudgets.reduce((accumulator, reducer) => {
        return (accumulator += reducer.budget);
    }, 0);
};

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

const hasAnyBudgets = () => {
    return allBudgets.length > 0;
};

const getAllFromDatabase = () => {
    return allBudgets;
};

const addToDatabase = (instance) => {
    if (verifyEnvelopeData(instance)) {
        allBudgets.push(instance);
    }
    return allBudgets[allBudgets.length - 1];
};

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
            throw new Error("You have insificient funds for the transaction.");
        }
    } else {
        return null;
    }
};

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
