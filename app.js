import envelopeRouter from "./routes/envelopeRoutes.js";
import transactionRouter from "./routes/transactionRouter.js";
import methodOverride from "method-override";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

dotenv.config();

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
// Body parsing middleware for json data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    methodOverride((req, res) => {
        if (req.body && typeof req.body === "object" && "_method" in req.body) {
            // look in urlencoded POST bodies and delete it
            var method = req.body._method;
            // console.log(method, req.body._method);
            delete req.body._method;
            return method;
        }
    })
);

// New route middleware for simplification
app.use("/envelopes", envelopeRouter);
app.use("/transactions", transactionRouter);

mongoose
    .connect(process.env.MONGO_CONNECT)
    .then(() => {
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log(err);
    });
