import express from "express";
import bodyParser from "body-parser";
import {
  getAllFromDatabase,
  createNewBugetEnvelope,
  hasAnyBudgets,
  getEnvelopeById,
} from "./public/data.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get("/", (req, res, next) => {
  res.send("<h1>Hello World!</h1>");
});

app.get("/envelopes", (req, res, next) => {
  if (!hasAnyBudgets()) {
    res.send(
      "No budgets set. Create a new envelope to help track your budgets"
    );
  } else {
    res.send(getAllFromDatabase());
  }
});

app.get("/envelopes/:id", (req, res, next) => {
  const envelopeId = Number(req.params.id);

  if (getEnvelopeById(envelopeId) !== null) {
    const envelope = getEnvelopeById(envelopeId);
    res.send(envelope);
  }
});

app.listen(PORT, () => {
  console.log(`Server started on porrt ${PORT}`);
});
