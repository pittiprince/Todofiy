
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { z, string } = require('zod');
const mongoose = require('mongoose');
const { userModel, TodoModel } = require("./db");
const JWT_SECRET = "NENU"; // Ideally, use an environment variable for this
const cors = require('cors');
const PORT = 8000;

mongoose.connect('mongodb+srv://princey2911:prince1330@test1.lvain.mongodb.net/new-todo-zod');

app.use(express.json());
app.use(cors());

// Auth Middleware
function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1]; // Get token from 'Authorization' header
    if (token) {
        try {
            const isVerified = jwt.verify(token, JWT_SECRET);
            req.id = isVerified.id;
            next();
        } catch (error) {
            return res.status(401).json({ msg: "Unauthorized" });
        }
    } else {
        res.status(401).json({ msg: "Unauthorized" });
    }
}

// Signup
app.post('/signup', async (req, res) => {
    try {
        const userInputSchema = z.object({
            email: string().min(3).max(30).email(),
            password: string().min(6).max(10),
            name: string().min(3).max(18)
        });
        const isParseSuccess = userInputSchema.safeParse(req.body);

        if (isParseSuccess.success) {
            const { email, password, name } = req.body;
            const hashedPass = await bcrypt.hash(password, 5);
            await userModel.create({ email, password: hashedPass, name });
            return res.status(200).json({ msg: "Successfully signed up" });
        } else {
            return res.status(400).json({ error: isParseSuccess.error });
        }
    } catch (err) {
        return res.status(404).json({ error: err });
    }
});

// Sign In
app.post('/signin', async (req, res) => {
    try {
        const userSignInSchema = z.object({
            email: z.string().min(3).max(30).email(),
            password: z.string().min(6).max(10),
        });

        const parsedSignIn = userSignInSchema.safeParse(req.body);

        if (parsedSignIn.success) {
            const { email, password } = req.body;
            const isEmailPresent = await userModel.findOne({ email });
            if (isEmailPresent) {
                const comparedPassword = await bcrypt.compare(password, isEmailPresent.password);
                if (comparedPassword) {
                    const token = jwt.sign({ id: isEmailPresent._id.toString() }, JWT_SECRET);
                    return res.status(200).json({ token });
                }
            }
            return res.status(401).json({ msg: "Invalid credentials" });
        } else {
            return res.status(400).json({ error: parsedSignIn.error });
        }
    } catch (err) {
        return res.status(404).json({ error: err });
    }
});

// Create Todo
app.post('/createTodo', auth, async (req, res) => {
    try {
        const { desc, done = false } = req.body;
        await TodoModel.create({ userId: req.id, desc, done });
        return res.status(200).json({ msg: "Successfully created the todo" });
    } catch (err) {
        return res.status(404).json({ error: err });
    }
});

// Get All Todos
app.get('/getTodo', auth, async (req, res) => {
    try {
        const userTodosList = await TodoModel.find({ userId: req.id });
        return res.status(200).json({ TodoList: userTodosList });
    } catch (err) {
        return res.status(404).json({ msg: "Not found" });
    }
});

// Update Todo by ID
app.put("/updateTodo/:id", auth, async (req, res) => {
    try {
        const { desc, done } = req.body; // Ensure 'done' is handled correctly
        const updatedTodo = await TodoModel.findByIdAndUpdate(
            req.params.id,
            { desc, done }, // Update both desc and done
            { new: true }
        );

        if (!updatedTodo) {
            return res.status(404).json({ msg: "Todo not found" });
        }

        return res.status(200).json({ msg: "Todo updated successfully", updatedTodo });
    } catch (error) {
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// Delete Todo by ID
app.delete("/deleteTodo/:id", auth, async (req, res) => {
    try {
        const deletedTodo = await TodoModel.findByIdAndDelete(req.params.id);
        if (!deletedTodo) {
            return res.status(404).json({ msg: "Todo not found" });
        }
        return res.status(200).json({ msg: "Todo deleted successfully" });
    } catch (error) {
        return res.status(500).json({ msg: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`The server has been started on port ${PORT}`);
});
