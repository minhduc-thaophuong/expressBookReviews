const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// ---------------------------------------------------------------------------
// Helpers that wrap the (in-memory) book database in Promises
// ---------------------------------------------------------------------------
const getBooks = () => new Promise((resolve) => resolve(books));

const getBookByISBN = (isbn) => new Promise((resolve, reject) => {
  if (books[isbn]) {
    resolve(books[isbn]);
  } else {
    reject({ status: 404, message: `Book with ISBN ${isbn} not found` });
  }
});

const getBooksByAuthor = (author) => new Promise((resolve, reject) => {
  const result = {};
  Object.keys(books).forEach((isbn) => {
    if (books[isbn].author.toLowerCase() === author.toLowerCase()) {
      result[isbn] = books[isbn];
    }
  });
  Object.keys(result).length > 0
    ? resolve(result)
    : reject({ status: 404, message: `No books found for author ${author}` });
});

const getBooksByTitle = (title) => new Promise((resolve, reject) => {
  const result = {};
  Object.keys(books).forEach((isbn) => {
    if (books[isbn].title.toLowerCase() === title.toLowerCase()) {
      result[isbn] = books[isbn];
    }
  });
  Object.keys(result).length > 0
    ? resolve(result)
    : reject({ status: 404, message: `No books found with title ${title}` });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Register a new user
public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Unable to register user. Username and password are required." });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: "User already exists!" });
  }
  users.push({ username: username, password: password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Get the book list available in the shop (async/await)
public_users.get('/', async function (req, res) {
  const allBooks = await getBooks();
  return res.status(200).send(JSON.stringify(allBooks, null, 4));
});

// Get book details based on ISBN (Promise callbacks)
public_users.get('/isbn/:isbn', function (req, res) {
  getBookByISBN(req.params.isbn)
    .then((book) => res.status(200).send(JSON.stringify(book, null, 4)))
    .catch((err) => res.status(err.status).json({ message: err.message }));
});
  
// Get book details based on author (Promise callbacks)
public_users.get('/author/:author', function (req, res) {
  getBooksByAuthor(req.params.author)
    .then((result) => res.status(200).send(JSON.stringify(result, null, 4)))
    .catch((err) => res.status(err.status).json({ message: err.message }));
});

// Get all books based on title (async/await)
public_users.get('/title/:title', async function (req, res) {
  try {
    const result = await getBooksByTitle(req.params.title);
    return res.status(200).send(JSON.stringify(result, null, 4));
  } catch (err) {
    return res.status(err.status).json({ message: err.message });
  }
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
  return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
});

// ---------------------------------------------------------------------------
// Tasks 10-13: client functions that call the API above using Axios
// ---------------------------------------------------------------------------

// Task 10: Get all books – async/await with Axios
const getAllBooksAxios = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching book list: ${error.message}`);
  }
};

// Task 11: Get book details based on ISBN – Promise callbacks with Axios
const getBookByISBNAxios = (isbn) => {
  return axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`)
    .then((response) => response.data)
    .catch((error) => {
      throw new Error(`Error fetching book with ISBN ${isbn}: ${error.message}`);
    });
};

// Task 12: Get book details based on author – async/await with Axios
const getBooksByAuthorAxios = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching books by author ${author}: ${error.message}`);
  }
};

// Task 13: Get book details based on title – Promise callbacks with Axios
const getBooksByTitleAxios = (title) => {
  return axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
    .then((response) => response.data)
    .catch((error) => {
      throw new Error(`Error fetching books with title ${title}: ${error.message}`);
    });
};

module.exports.general = public_users;
module.exports.getAllBooksAxios = getAllBooksAxios;
module.exports.getBookByISBNAxios = getBookByISBNAxios;
module.exports.getBooksByAuthorAxios = getBooksByAuthorAxios;
module.exports.getBooksByTitleAxios = getBooksByTitleAxios;
