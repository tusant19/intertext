import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import Database from 'better-sqlite3'
import { Server } from 'socket.io';

const db = new Database('database.db');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});

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
    time_created INTEGER,
    overriden INTEGER,
    x INTEGER,
    y INTEGER,
    font TEXT,
    char TEXT,
    bg TEXT,
    char_color TEXT
  )
`);

const getAllPages= db.prepare('SELECT * FROM pages');
const insertPage = db.prepare('INSERT INTO pages (page_number, time_created) VALUES (?, ?)');

const insertCell = db.prepare('INSERT INTO cells (page_id, time_created, overriden, x, y, font, char, bg, char_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const getCellsByPageId = db.prepare('SELECT * FROM cells WHERE page_id = ? AND overriden = 0');

let exampleExists = getAllPages.get(); 
if (!exampleExists) { 
  insertPage.run(100, Date.now());
  insertCell.run(100, Date.now(), 0, 0, 23, 'VT323', 'A', 'blue', 'white');
  insertCell.run(100, Date.now(), 0, 2, 23, 'VT323', 'B', 'red', 'yellow');
}

io.on('connection', (socket) => {
  console.log('connect ' + socket.id);
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log('joined page ' + room);
  });
});

app.get('/page/:pagenumber', (req, res) => {
  let cells = getCellsByPageId.all(req.params.pagenumber);
  res.json({
    cells: cells.map(cell => ({
      x: cell.x,
      y: cell.y,
      font: cell.font,
      char: cell.char,
      bg: cell.bg,
      charColor: cell.char_color
    }))
  });
});

httpServer.listen(3000, () => {
  console.log('Server is running on port 3000');
});