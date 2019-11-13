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
// client.connect();
client.on('error', err => console.error(err));

app.get('/', newSearch);
app.post('/searches', searchForBooks);

// API routes
app.get('/', getTasks) //get all tasks
app.get('/tasks/:task_id', getOneTask); //get one task
app.get('/add', showForm); // show form to add a task
app.get('/add', addTask); // create a new task

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

function getTasks(req, res) {
  let SQL = 'SELECT * FROM tasks;';

  return client.query(SQL)
    .then( results => res.render('index', {results: results.rows}))
    .catch( err => console.error(err));
}

function getOneTask(req, res){
  let SQL = 'SELECT * FROM tasks WHERE id=$1;';
  let values = [req.params.task_id];

  return client.query(SQL, values)
    .then( result => {
      return res.render('pages/detail-view', {task: result.rows[0] });
    })
    .catch( err => console.error(err));
}

function showForm(req, res){
  res.render('./pages/add-view');
}

function addTask(req, res){
  let {title, description, category, contact, status} = req.body;
  let SQL = 'INSERT into tasks(title, description, category, contact, status) VALUES ($1, $2, $3, $4, $5);';
  let values = [title, description, category, contact, status];

  return client.query(SQL, values)
    .then(res.redirect('/'))
    .catch( err => console.error(err));
}

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
