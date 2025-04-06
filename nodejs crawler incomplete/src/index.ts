import express from "express";
const app = express();
import cors from "cors";
import bodyParser from "body-parser";
import router from "./routes/index";

const port = 3000;
app.use(cors());

app.use(bodyParser.json());

app.use("/api/v1", router);

app.listen(port, () => {
    console.log(`App listening on port ${port} in http://localhost:${port}`);
});
