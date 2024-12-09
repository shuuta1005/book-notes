import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "secrets",
  password: "Shuta1005",
  port: 5432,
});

db.connect();

//Handle Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Define home page route
app.get("/", (req, res) => {
  res.render("home.ejs");
});
//Define login page route
app.get("/login", (req, res) => {
  res.render("login.ejs");
});
//Define register page route
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
