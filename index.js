const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});
// post users
app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `select * from user where username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
    insert into user
    (username,name,password,gender,location)
    values
    ('${username}','${name}','${hashedPassword}','${gender}','${location}');
    `;
    await db.run(createUserQuery);
    response.send("User created Succesfully");
  } else {
    response.status(400);
    response.send("Username already exists");
  }
});

// post login

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const isUserPresentQuery = `select * from user where username='${username}';`;
  const dbResponse = await db.get(isUserPresentQuery);
  if (dbResponse === undefined) {
    response.status(400);
    response.send("User doesn't exist");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      dbResponse.password
    );
    if (isPasswordMatched) {
      response.send("Login Succesfully");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
