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
app.get("/books", (req, res) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    res.render("bookList.ejs");
  } else {
    res.redirect("/login");
  }
});

//Post Routes -------------------------------------------------------------------

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
          res.send("Error hasing password", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log(user.username + " registered successfully.");
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
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query(
        "SELECT password from users WHERE email = $1",
        [username]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;

        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            res.send("Error compareing password", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        res.send("User not found with the email");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

//Passport serializeUser
passport.serializeUser((user, cb) => {
  cb(null, user);
});
//Passport deserializeUser
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

//App listens
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
