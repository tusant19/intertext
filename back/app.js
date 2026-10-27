import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Database from 'better-sqlite3'

const db = new Database('database.db');

const app = express();

app.use(cors());
app.use(bodyParser.json());

db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_number INTEGER,
    time_created INTEGER
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS cells (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER,
    x INTEGER,
    y INTEGER,
    char TEXT,
    bg TEXT,
    char_color TEXT
  )
`);

const getAllPages= db.prepare('SELECT * FROM pages');
const insertPage = db.prepare('INSERT INTO pages (page_number, time_created) VALUES (?, ?)');

const insertCell = db.prepare('INSERT INTO cells (page_id, x, y, char, bg, char_color) VALUES (?, ?, ?, ?, ?, ?)');
const getCellsByPageId = db.prepare('SELECT * FROM cells WHERE page_id = ?');

let exampleExists = getAllPages.get();
if (!exampleExists) {
  insertPage.run(100, Date.now());
  insertCell.run(100, 0, 23, 'A', 'blue', 'white');
  insertCell.run(100, 1, 23, 'B', 'red', 'yellow');
}

app.get('/page/:pagenumber', (req, res) => {
  let cells = getCellsByPageId.all(req.params.pagenumber);
  res.json(cells);
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});