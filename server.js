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
// app.post('/searches', searchForBooks);

// API routes
app.get('/', getBooks) //get all books
app.get('/books/:book_id', updateBook); //get one book
// app.get('/add', showForm); // show form to add a book
app.get('/add/:etag', addBook); // create a new book
app.post('/searches', searchForBooks);
app.post('/books', createBook);


function newSearch(request, response) {
  response.render('pages/index');
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createBook(req, res) {
  let { title, description, category, contact, status } = req.body;
  let SQL = 'INSERT INTO books ( title, description, category, contact, status) VALUES ($1, $2, $3, $4, $5);';
  let safeValues = [title, description, category, contact, status];
  console.log('in createBooks');
  client.query(SQL, safeValues)
    .then(() => {
      SQL = 'SELECT * FROM books WHERE isbn = $1;';
      safeValues = [req.body.isbn]

      client.query(SQL, safeValues)
        .then((result => {
          res.redirect('/books/${result.rows[0].id')
        })
        )
    })
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function searchForBooks(request, response) {
  // console.log(request.body);
  const userSearch = request.body.search[0];
  const typeOfSearch = request.body.search[1];
  console.log('in searchForBooks');
  // https://www.googleapis.com/books/v1/volumes?q=moby+intitle:title
  let url = `https://www.googleapis.com/books/v1/volumes?q=`;

  if (typeOfSearch === 'title') {
    url += `+intitle:${userSearch}`
  }

  if (typeOfSearch === 'author') {
    url += `+inauthor:${userSearch}`
  }

  superagent.get(url)
    .then(results => results.body.items.map(book => new Book(book.volumeInfo)))
    .then(bookArr => response.render('pages/searches/show', { searchResults: bookArr }))
    .catch(results => response.render('pages/searches/error'));

}

let bookArr = [];

//Constructor Function
function Book(bookObj) {
  this.etag = bookObj.etag;
  this.image = bookObj.imageLinks.thumbnail || 'http://placehold.it/300x300';
  this.title = bookObj.title || 'No book title found';
  this.authors = bookObj.authors || 'No author';
  this.description = bookObj.description || 'No description defined';
  this.isbn = bookObj.industryIdentifiers[0].identifier|| 'No ISBN';
  bookArr.push(this);
}

// Book.prototype.writeToDB = function() {
//   const SQL = 'INSERT INTO books (title, author, description, image_url, isbn) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING RETURNING id;';
//   const values = [this.title, this.authors, this.description, this.image, this.isbn];
//   console.log('in writeToDB',this.title);
//   return client.query(SQL, values);
// };

function getBooks(req, res) {
  let SQL = 'SELECT * FROM books;';
  console.log('in getBooks');
  return client.query(SQL)
    .then(results => res.render('index', { results: results.rows }))
    .catch(err => console.error(err));
}

function updateBook(req, res) {
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let values = [req.params.book_id];
  console.log('in updateBooks');
  return client.query(SQL, values)
    .then(result => {
      return res.render('pages/detail-view', { book: result.rows[0] });
    })
    .catch(err => console.error(err));
}

function showForm(req, res) {
  res.render('./pages/add-view');
}

function addBook(req, res) {
  let { title, description, category, contact, status } = req.body;
  let SQL = 'INSERT into books(title, description, category, contact, status) VALUES ($1, $2, $3, $4, $5);';
  let values = [title, description, category, contact, status];
  console.log('in addBooks');
  res.render('pages/index');

  return client.query(SQL, values)
    .then(res.redirect('/'))
    .catch(err => console.error(err));
}

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
