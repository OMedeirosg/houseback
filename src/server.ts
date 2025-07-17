import express from 'express';
import { error, success, warning } from './utils/logger';
import cors from 'cors';
import db, { testDbConnection } from './db/connection';
const app = express();
const PORT = process.env.PORT || 8080

app.use(express.json())
app.use(cors({ origin: '*' }));



app.get("/", (req, res) => {
    success("Server is running");
    res.status(200).json({ message: "Server is on" });
})


app.get("/health", (req, res) => {
    success("Health check endpoint hit")
    res.status(200).json({ message: "Server is healthy" });
});

app.post("/signup", async (req, res) => {
    success("Signup endpoint hit");


    const { email, password } = req.body;

    warning(`Email:${email}, Password:${password}`);
    if (!email) {
        res.status(406).json({ message: "Email is required" });
    }

    try {
        db.raw(`
        INSERT INTO users (email, password) VALUES (?, ?) ON CONFLICT (email) DO NOTHING;
    `, [email, password]).then((res) => {
            const result = res[0];
            success(`User with email ${email} created successfully. Result: ${JSON.stringify(result)}`);
            warning(`Database operation result: ${JSON.stringify(result)}`);
        })
    }
    catch (err) {
        error(`Error during signup operation ${err}`);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
    res.status(200).json({ message: "Signup endpoint is working" });

});

app.post("/signin", (req, res) => {

    const { email, password } = req.body;

    warning(`Email:${email}, Password:${password}`);
    if (!email) {
        res.status(406).json({ message: "Email is required" });
    }


    success("Signin endpoint hit");

    res.status(200).json({ message: "Signin endpoint is working" });


});





(async () => {
    try {
        await testDbConnection();
        success("Database connection tested successfully");
    } catch (err) {
        error(`Failed to test database connection ${err}`);
        process.exit(1); // Exit the process if the database connection fails
    }

    app.listen(PORT, () => {
        success(`Server is running on port ${PORT}`);
    });

}
)()





