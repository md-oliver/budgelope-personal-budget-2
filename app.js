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
    res.status(200).send(getAllFromDatabase());
  }
});

app.get("/envelope/:id", (req, res, next) => {
  const envelopeId = Number(req.params.id);

  if (getEnvelopeById(envelopeId) === null) {
    res.status(404).send("Can't find the requested envelope");
  } else {
    const envelope = getEnvelopeById(envelopeId);
    res.status(200).send(envelope);
  }
});

app.listen(PORT, () => {
  console.log(`Server started on porrt ${PORT}`);
});
