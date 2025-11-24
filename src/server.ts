import express from 'express';
import { error, success, warning } from './utils/logger';
import cors from 'cors';
import { signupHandler } from './routes/auth/signup/signup';
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

app.post("/signup", signupHandler);

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


    app.listen(PORT, () => {
        success(`Server is running on port http://localhost:${PORT}`);
    });

}
)()





