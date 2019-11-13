'use strict';

require('ejs');
require('dotenv').config();

const express = require('express');
const pg = require('pg');
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));
app.set('view engine', 'ejs');

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.get('/', newSearch);
app.post('/searches', searchForBooks);

// API routes
app.get('/', getBooks) //get all books
app.get('/books/:book_id', getOneBook); //get one book
app.get('/add', showForm); // show form to add a book
app.get('/add', addBook); // create a new book

function newSearch(request, response) {
  response.render('pages/index');
}

function searchForBooks(request, response) {
  // console.log(request.body);
  const userSearch = request.body.search[0];
  const typeOfSearch = request.body.search[1];

  let url = `https://www.googleapis.com/books/v1/volumes?q=`;

  if (typeOfSearch === 'title') {
    url += `+intitle:${userSearch}`
  }

  if (typeOfSearch === 'author') {
    url += `+inauthor:${userSearch}`
  }

  superagent.get(url)
    .then(results => results.body.items.map(book => new Book(book.volumeInfo)))
    .then(results => response.render('pages/searches/show', {searchResults: results}))
    .catch(results => response.render('pages/searches/error'));
}

//Constructor Function
function Book(bookObj) {
  this.image = bookObj.imageLinks.thumbnail || 'http://placehold.it/300x300';
  this.title = bookObj.title || 'No book title found';
  this.authors = bookObj.authors || 'No author';
  this.description = bookObj.description || 'No description defined';
}

function getBooks(req, res) {
  let SQL = 'SELECT * FROM books;';

  return client.query(SQL)
    .then( results => res.render('index', {results: results.rows}))
    .catch( err => console.error(err));
}

function getOneBook(req, res){
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let values = [req.params.book_id];

  return client.query(SQL, values)
    .then( result => {
      return res.render('pages/detail-view', {book: result.rows[0] });
    })
    .catch( err => console.error(err));
}

function showForm(req, res){
  res.render('./pages/add-view');
}

function addBook(req, res){
  let {title, description, category, contact, status} = req.body;
  let SQL = 'INSERT into books(title, description, category, contact, status) VALUES ($1, $2, $3, $4, $5);';
  let values = [title, description, category, contact, status];

  return client.query(SQL, values)
    .then(res.redirect('/'))
    .catch( err => console.error(err));
}

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
