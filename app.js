import express from "express";
import bodyParser from "body-parser";
import envelopeRouter from "./server/envelopeApi.js";
import {
  getAllFromDatabase,
  hasAnyBudgets,
  removeFromDatabaseById,
  getEnvelopeById,
  createEnvelope,
  addToDatabase,
} from "./public/data.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use("/envelopes", envelopeRouter);

app.get("/", (req, res, next) => {
  res.send("<h1>Hello World!</h1>");
});

envelopeRouter.get("/envelopes", (req, res, next) => {
  if (!hasAnyBudgets()) {
    res.send(
      "No budgets set. Create a new envelope to help track your budgets"
    );
  } else {
    res.status(200).send(getAllFromDatabase());
  }
});

envelopeRouter.get("/:id", (req, res, next) => {
  const envelopeId = Number(req.params.id);

  if (getEnvelopeById(envelopeId) === null) {
    res.status(404).send("Can't find the requested envelope");
  } else {
    const envelope = getEnvelopeById(envelopeId);
    res.status(200).send(envelope);
  }
});

envelopeRouter.post("/", (req, res, next) => {
  const envBody = req.body;
  const envelope = addToDatabase(createEnvelope(envBody.title, envBody.budget));
  res.status(201).send(envelope);
});

envelopeRouter.delete("/:id", (req, res, next) => {
  const id = Number(req.params.id);
  if (removeFromDatabaseById(id)) {
    res.status(204).send("Removed envelope successfully");
  } else {
    res.status(404).send("Can't find the requested envelope");
  }
});

app.listen(PORT, () => {
  console.log(`Server started on porrt ${PORT}`);
});
