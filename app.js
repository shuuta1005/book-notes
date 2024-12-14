//TO DO
// 1. Make sure that users go to their own page (!DONE)
// 2. Make Add-book buttons work (!DONE)
// 3. Allow users add books (!DONE)
// 4. Check the login system (!DONE)
// 5. Add logout function (!DONE)
// 6. Check the database structure (!DONE)
// 7. Update frontend
//8. Add google authentication (!DONE)

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import session from "express-session";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import env from "dotenv";

const app = express();
const port = 3000;
const saltRounds = 5;
env.config();

//Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  console.log("Session info:", req.session);
  next();
});

//Database
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
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
//Deinfe add get route
app.get("/add", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("add-book.ejs");
  } else {
    res.redirect("/login");
  }
});
//Define
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);
//Deinfe
app.get(
  "/auth/google/books",
  passport.authenticate("google", {
    successRedirect: "/books",
    failureRedirect: "/login",
  })
);
//Define logout
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) console.log(err);
    res.redirect("/");
  });
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
            if (err) {
              console.error("Error logging in user after registration:", err);
              res.status(500).send("Login after registration failed.");
            } else {
              // Save the session before redirecting
              req.session.save((err) => {
                if (err) {
                  console.error(
                    "Error saving session after registration:",
                    err
                  );
                  res.status(500).send("Session save failed.");
                } else {
                  console.log(user.email + " registered successfully.");
                  res.redirect("/books");
                }
              });
            }
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

app.post("/add", async (req, res) => {
  if (req.isAuthenticated()) {
    console.log("User session:", req.user);
    const { title, author, isbn, rating, notes, date_read } = req.body;
    const userId = req.user.id;
    try {
      await db.query(
        `INSERT INTO books (title, author, isbn, rating, notes, date_read, user_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [title, author, isbn, rating, notes, date_read, userId]
      );
      res.redirect("/books");
    } catch (err) {
      console.error("Error adding book:", err);
      res.send("Error occurred while adding the book.");
    }
  } else {
    res.redirect("/login");
  }
});

//Define local Strategy -------------------------------------------------------------------
passport.use(
  "local",
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
            return cb(null, { id: user.id, email: user.email });
          } else {
            console.log("Incorrect password.");
            return cb(null, false, { message: "Incorrect password." });
          }
        } else {
          console.log("User not found");
          return cb(null, false, { message: "User not found." });
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/books",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      console.log(profile);
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)",
            [profile.email, "google"]
          );
          cb(null, newUser.rows[0]);
        } else {
          //Already existing user
          cb(null, result.rows[0]);
        }
      } catch (err) {
        cb(err);
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
    const result = await db.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );
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
