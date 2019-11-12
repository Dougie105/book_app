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
    .then(results => {
      const bookArray = results.body.items.map(book => {
        return new Book(book.volumeInfo);
      });
      response.status(200).render('pages/search/show');
    })
}

function Book(bookObj) {
  const placeholderImage = 'http://placehold.it/300x300';
  this.title = bookObj.title || 'No book title found';
}

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
