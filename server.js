'use strict';

const express = require('express');
const superagent = require('superagent');
require('ejs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('./public'));

app.get('/', newSearch);
app.post('/searches', searchForBooks);

function newSearch(request, response) {
  response.render('pages/index');
}



function searchForBooks(request, response) {
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
    .then(results => response.render('pages/searches/show', {searchResults: results}));
}

//Constructor Function
function Book(bookObj) {
  this.placeholderImage = 'http://placehold.it/300x300';
  this.title = bookObj.title || 'No book title found';
  this.authors = bookObj.authors || 'No author';
  this.description = bookObj.description || 'No description defined';
}

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
