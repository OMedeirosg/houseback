import express from 'express';
import db from './db/connection';
import chalk from 'chalk';
import { error, success } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 8080

app.use(express.json());



app.get("/", (req, res) => {
    success("Server is running");
    res.status(200).json({ message: "Server is on" });
})


app.get("/health", (req, res) => {
    success("Health check endpoint hit")
    res.status(200).json({ message: "Server is healthy" });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})