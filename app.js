//TO DO
// 1. Make sure that users go to their own page (!DONE)
// 2. Make Add-book buttons work
// 3. Allow users add books
// 4. Check the login system (!DONE)
// 5. Add logout function
// 6. Check the database structure !!!!!IMPORTANT

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import session from "express-session";
import { Strategy } from "passport-local";

const app = express();
const port = 3000;
const saltRounds = 5;

//Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "TOPSECRETWORD",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

//Database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "books",
  password: "Shuta1005",
  port: 5433,
});

db.connect();

//Get Routes -------------------------------------------------------------------
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
  if (req.isAuthenticated()) {
    const { id, email } = req.user;
    try {
      const result = await db.query("SELECT * FROM books WHERE user_id = $1", [
        id,
      ]);
      const books = result.rows;
      res.render("bookList.ejs", { email, books });
    } catch (err) {
      console.error("Error fetching books:", err);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/login");
  }
});
// Route to display the form for adding a new book
app.get("/add", (req, res) => {
  res.render("add-book"); // Render the add-book.ejs file
});

//Post Routes -------------------------------------------------------------------

//Define register post
app.post("/register", async (req, res) => {
  const email = req.body.email;
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
          res.send("Error hasing password", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log(user.email + " registered successfully.");
            res.redirect("/books");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

//Define login post
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/books",
    failureRedirect: "/login",
  })
);

//Define local Strategy -------------------------------------------------------------------
passport.use(
  new Strategy(
    {
      usernameField: "email", // Specify that 'email' is the username field
      passwordField: "password", // Optionally specify the password field (default is 'password')
    },
    async function verify(email, password, cb) {
      try {
        const result = await db.query(
          "SELECT email, password FROM users WHERE email = $1",
          [email]
        );

        if (result.rows.length > 0) {
          const user = result.rows[0];
          const isValid = await bcrypt.compare(password, user.password);

          if (isValid) {
            return cb(null, { email: user.email });
          } else {
            return cb(null, false, { message: "Incorrect password." });
          }
        } else {
          return cb(null, false, { message: "User not found." });
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

//Passport serializeUser
passport.serializeUser((user, cb) => {
  cb(null, user.email);
});
//Passport deserializeUser
passport.deserializeUser(async (email, cb) => {
  try {
    const result = await db.query("SELECT email FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      cb(null, result.rows[0]);
    } else {
      cb(null, false);
    }
  } catch (err) {
    cb(err);
  }
});

//App listens
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
