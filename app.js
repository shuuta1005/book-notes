import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "books",
  password: "Shuta1005",
  port: 5433,
});

db.connect();

//Handle Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Get Routes
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
//Define book list route
app.get("/books", async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query("SELECT * FROM books WHERE user_id = $1", [
      userId,
    ]);
    const books = result.rows;
    res.render("bookList.ejs", { books });
  } catch (err) {
    console.log(err);
    res.send("Error fetching book list");
  }
});

//Post Routes

//Define register post
app.post("/register", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const checkIfExist = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [username]
    );

    if (checkIfExist.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      const result = await db.query(
        "INSERT INTO users (email, password) VALUES ($1, $2)",
        [username, password]
      );
      console.log(result);
      res.render("bookList.ejs");
    }
  } catch (err) {
    console.log(err);
  }
});

//Define login post
app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  console.log(username);
  console.log(password);

  try {
    const result = await db.query(
      "SELECT password from users WHERE email = $1",
      [username]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedPassword = user.password;
      if (password === storedPassword) {
        res.render("bookList.ejs");
      } else {
        res.send("Wrong password");
      }
    } else {
      res.send("User not found with the email");
    }
  } catch (err) {
    console.log(err);
  }
});

//App listens
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
