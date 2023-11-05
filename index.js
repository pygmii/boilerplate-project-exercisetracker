const express = require('express')
const app = express()
const cors = require('cors')
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment/moment');

require('dotenv').config()

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'admin',
  password: 'password',
  database: 'exercisetracker'
});

const dateFormat = 'ddd MMM DD YYYY';

app.use(cors())

// for parsing application/json
app.use(bodyParser.json()); 

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 
//form-urlencoded

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// POST /api/users
app.post('/api/users', (req,res) =>
{
  console.log(req.body);

  const newId = uuidv4();
  const username = req.body.username;

  connection.query(
    'INSERT INTO user(id, username) VALUES (?,?)',
    [newId,username],
    (err, results) => {
      if(err)
      {
        console.error(err.message);
        throw err;
      }

      console.log("record inserted, username: " + username);
      res.json({username: username, _id: newId});
    }
  );
});

// GET /api/users
app.get('/api/users', (req,res) =>
{  
  let users = new Array();

  connection.query(
    'SELECT * FROM user',
    (err, results) => {
      if(err)
      {
        console.error(err.message);
        throw err;
      }
      
      results.forEach(element => {
        const user = { username: element.username, _id: element.id};
        users.push(user) ;
      });

      res.json(users);
    }
  );
});

// POST /api/users/:_id/exercises
app.post('/api/users/:_id/exercises', (req,res) =>
{
  console.log(req.body);

  const userid = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = (typeof req.body.date == 'undefined' || req.body.date.length === 0) ?
    new Date():
    req.body.date ;

  connection.query(
    'INSERT INTO exercise (userid, description, duration, date) VALUES (?,?,?,?)',
    [userid,description,duration,date],
    (err, results) => {
      if(err)
      {
        console.error(err.message);
        throw err;
      }

      let exerciseId = results.insertId;
      console.log("1 record inserted, ID: " + exerciseId);
    }
  );

  connection.query(
    'SELECT * FROM user WHERE id = ?',
    [userid],
    (err, results) => {
      if(err)
      {
        console.error(err.message);
        throw err;
      }
      
      const user = { 
        username: results[0].username,
        description: description,
        duration: Number.parseInt(duration),
        date: moment(date).format(dateFormat),
        _id: results[0].id
      };

      res.json(user);
    }
  );
});

// GET /api/users/:_id/logs 
app.get('/api/users/:_id/logs', (req,res) =>
{  
  const userid = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;
  
  let logs = new Array();

  connection.query(
    'SELECT * FROM user AS u,exercise AS e WHERE e.userid = ? AND e.userid = u.id',
    [userid],
    (err, results) => {
      if(err)
      {
        console.error(err.message);
        throw err;
      }

      if(from)
      {
        results = results.filter((r) => r.date >= new Date(from));
      }
      if(to)
      {
        results = results.filter((r) => r.date <= new Date(to));
      }
      if(limit)
      {
        results = results.slice(0,limit);
      }
      
      results.forEach(element => {
        const excercise = { 
          description: element.description,
          duration: element.duration,
          date : moment(element.date).format(dateFormat)
        };
        logs.push(excercise) ;
      });

      response = {
        username: results[0].username,
        count: logs.length,
        _id: results[0].userid,
        log: logs
      };

      res.json(response);
    }
  );
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
