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

// API routes
app.get('/', getBooks); //get all books
app.get('/books/:book_id', updateBook); //get one book
app.get('/add', addBook); // create a new book
app.get('/searches/new', newSearch);
app.post('/searches', searchForBooks);
app.post('/books', createBook);


function newSearch(req, res) {
  res.render('pages/searches/new');
}


function createBook(req, res) {
  let { title, author, etag, image_url, description, bookshelf } = req.body;
  let SQL = 'INSERT INTO books (title, author, etag, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6);';

  let safeValues = [title, author, etag, image_url, description, bookshelf];

  client.query(SQL, safeValues)
    .then(() => {
      SQL = 'SELECT * FROM books WHERE etag = $1;';
      safeValues = [req.body.etag]

      client.query(sql, safeValues)
        .then((result) => {
          response.redirect(`/books/${result.rows[0].id}`)
        })
    })
}

function searchForBooks(req, res) {
  let url = `https://www.googleapis.com/books/v1/volumes?q=`;

  if (req.body.search[1] === 'title') { url += `+intitle:${req.body.search[0]}`; }
  if (req.body.search[1] === 'author') { url += `+inauthor:${req.body.search[0]}`; }

  superagent.get(url)
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult)))
    .then(bookArr => res.render('pages/searches/show', { arrItems: bookArr }))
    .catch(() => {
      res.render('pages/error');
    })
}

let bookArr = [];

//Constructor Function
function Book(bookObj) {
  this. id =bookObj.id;
  this.title = bookObj.volumeInfo.title || 'No book title found';
  this.authors = bookObj.volumeInfo.authors || 'No author';
  this.description = bookObj.volumeInfo.description || 'No description defined';
  this.etag = bookObj.etag;
  this.image = bookObj.imageLinks.thumbnail || 'http://placehold.it/300x300';
  // this.image = `https://books.google.com/books/content?id=${id}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api`;
  bookArr.push(this);
}

function getBooks(req, res) {
  let SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then(results => res.render('pages/index', { results: results.rows }))
    .catch(() => {
      res.render('pages/error');
    })
}

function updateBook(req, res) {
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let values = [req.params.book_id];

  return client.query(SQL, values)
    .then(result => {
      return res.render('pages/books/show', { book: result.rows[0] });
    })
    .catch(err => console.error(err));
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

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
