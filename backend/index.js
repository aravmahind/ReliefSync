import express from "express";
import cors from 'cors';

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is running");
});

app.post("/api/registerUser", (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;

        return res.send({
            "uemail": email
        });
    }
    catch (error) {
        console.log(error);
    }
});

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});