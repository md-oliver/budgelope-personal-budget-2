let idIterator = 0;

const createEnvlope = (title, budget) => {
  return {
    id: ++idIterator,
    title: title,
    budget: budget,
  };
};

let allBudgets = [];
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

const createTempData = () => {
  const randomCategory = Math.floor(Math.random() * defaultCategories.length);
  const randomBuget = Math.floor(Math.random() * defaultBudgetValues.length);
  const envelope = createNewBugetEnvelope(
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

const createNewBugetEnvelope = (title, budgetAllocation) => {
  const newEnvelope = createEnvlope(title, budgetAllocation);
  allBudgets.push(newEnvelope);
  return newEnvelope;
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

  //
};

allBudgets = new Array(5).fill(0).map(createTempData);

export {
  createNewBugetEnvelope,
  getAllFromDatabase,
  hasAnyBudgets,
  getEnvelopeById,
};
