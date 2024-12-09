import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";

const app = express();
const port = 3000;
const saltRounds = 5;

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
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkIfExist = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (checkIfExist.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      //Password hashing
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.log(err);
          res.send("Error hasing password");
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)",
            [email, hash]
          );
          console.log(result);
          res.render("home.ejs");
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

//Define login post
app.post("/login", async (req, res) => {
  const email = req.body.username;
  const loginPassword = req.body.password;

  try {
    const result = await db.query(
      "SELECT password from users WHERE email = $1",
      [email]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedHashedPassword = user.password;

      bcrypt.compare(loginPassword, storedHashedPassword, (err, result) => {
        if (err) {
          console.log(err);
          res.send("Error compareing password");
        } else {
          if (result) {
            res.render("home.ejs");
          } else {
            res.send("Incorrect password");
          }
        }
      });
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
