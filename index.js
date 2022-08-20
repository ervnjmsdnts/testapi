const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

const users = [
  {
    id: 1,
    username: "john1234",
    email: "john@mail.com",
    password: "123456",
  },
];

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }
  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({ error: "Token error" });
  }
  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: "Token malformatted" });
  }
  jwt.verify(token, "secret", (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token invalid" });
    }
    req.userId = decoded.id;
    next();
  });
};

app.get("/", authMiddleware, (_req, res) => {
  res.send("Hello World!");
});

app.get("/profile", authMiddleware, (req, res) => {
  try {
    const user = users.find((user) => user.id === req.userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find((user) => user.email === email);

    if (!user) {
      return res.status(400).send("User not found");
    }

    if (user.password !== password) {
      return res.status(400).send("Password does not match");
    }

    const token = jwt.sign({ id: user.id }, "secret", { expiresIn: "1h" });

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.log({ request: "/login", error });
    res.status(500).send({ message: "Something went wrong" });
  }
});

app.post("/register", (req, res) => {
  try {
    const { email, password, username } = req.body;

    const user = users.find((user) => user.email === email);

    if (user) {
      return res.status(400).send("User already exists");
    }

    const newUser = {
      id: users.length + 1,
      email,
      password,
      username,
    };

    users.push(newUser);

    return res.status(200).send("User registered successfully");
  } catch (error) {
    console.log({ request: "/register", error });
    res.status(500).send({ message: "Something went wrong" });
  }
});

app.listen(8080, () => {
  console.log("Example app listening on port 3000!");
});
