import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import Database from 'better-sqlite3'
import { Server } from 'socket.io';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rateLimit } from 'express-rate-limit'

process.loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '.env'));
const db = new Database('database.db');
const corsOptions = { origin: (process.env.ALLOWED_CORS_ORIGINS ?? '').split(',').filter(Boolean) };

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions
});

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 180, // limit each IP to 180 requests per windowMs
  message: 'Too many requests within a minute, please try again later.',
});

app.use(limiter);

app.use(cors(corsOptions));
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
const markCellOverriden = db.prepare('UPDATE cells SET overriden = 1 WHERE page_id = ? AND x = ? AND y = ?');
const getCellsByPageId = db.prepare('SELECT * FROM cells WHERE page_id = ? AND overriden = 0');
const getCellByPageIdAndCoordinates = db.prepare('SELECT * FROM cells WHERE page_id = ? AND x = ? AND y = ? AND overriden = 0');

let exampleExists = getAllPages.get();
if (!exampleExists) { 
  insertPage.run(100, Date.now());
  let prevCell = getCellByPageIdAndCoordinates.get(100, 0, 23);
  insertCell.run(100, Date.now(), 0, 0, 23, prevCell?.font || 'VT323', 'A', 'blue', 'white');
  insertCell.run(100, Date.now(), 0, 2, 23, 'VT323', 'B', 'red', 'yellow');
}

const infoPage1inserted = getCellsByPageId.all(1); 
if (infoPage1inserted.length === 0) {
  //insert text for page 1 
  // "WELCOME TO INTERTEXT"
  // "USE PAGE BROWSER TO SWITCH PAGES"
  // "USE TOOLS TO EDIT TEXT"
  // guide text
  // "USE BACKSPACE OR DELETE WITH CLEAR TOOL"
  // "USE ENTER TO SET CHAR AND BACKGROUND COLOR"
  const welcomeText = "WELCOME TO INTERTEXT";
  for (let i = 0; i < welcomeText.length; i++) {
    insertCell.run(1, Date.now(), 0, (i + 3), 2, 'VT323', welcomeText[i], 'transparent', 'white');
  }
  const pageBrowserText = "USE PAGE BROWSER TO SWITCH PAGES";
  for (let i = 0; i < pageBrowserText.length; i++) {
    insertCell.run(1, Date.now(), 0, (i + 3), 6, 'VT323', pageBrowserText[i], 'transparent', 'white');
  }
  const toolsText = "USE TOOLS TO EDIT TEXT";
  for (let i = 0; i < toolsText.length; i++) {
    insertCell.run(1, Date.now(), 0, (i + 3), 10, 'VT323', toolsText[i], 'transparent', 'white');
  }
  const clearToolGuideTextLine1 = "USE BACKSPACE OR DELETE WITH CLEAR";
  const clearToolGuideTextLine2 = "TOOL";
  for (let i = 0; i < clearToolGuideTextLine1.length; i++) {
    insertCell.run(1, Date.now(), 0, (i + 3), 13,  'VT323', clearToolGuideTextLine1[i], 'transparent', 'white');
  }
  for (let i = 0; i < clearToolGuideTextLine2.length; i++) {
    insertCell.run(1, Date.now(), 0, (i + 3), 14,  'VT323', clearToolGuideTextLine2[i], 'transparent', 'white');
  }
  const charBgColorGuideTextLine1 = "USE ENTER TO SET CHAR AND";
  const charBgColorGuideTextLine2 = "BACKGROUND COLOR";
  for (let i = 0; i < charBgColorGuideTextLine1.length; i++) {
    insertCell.run(1, Date.now(), 0, (i + 3), 17, 'VT323', charBgColorGuideTextLine1[i], 'transparent', 'white');
  }
  for (let i = 0; i < charBgColorGuideTextLine2.length; i++) {
    insertCell.run(1, Date.now(), 0, (i + 3), 18, 'VT323', charBgColorGuideTextLine2[i], 'transparent', 'white');
  }

  //insert backgrounds for page 1
  //background for "welcome to intertext" including around it 
  for (let x = 2; x < welcomeText.length + 5; x++) {
    for (let y = 1; y < 4; y++) {
      insertCell.run(1, Date.now(), 0, x, y, 'VT323', '', 'blue', ''); 
    }
  }
  //background for "use page browser to switch pages" including around it 
  for (let x = 2; x < pageBrowserText.length + 5; x++) {
    for (let y = 5; y < 8; y++) {
      insertCell.run(1, Date.now(), 0, x, y, 'VT323', '', 'blue', '');
    }
  }
  //background for "use tools to edit text" including around it 
  for (let x = 2; x < toolsText.length + 5; x++) {
    for (let y = 9; y < 12; y++) {
      insertCell.run(1, Date.now(), 0, x, y, 'VT323', '', 'blue', '');
    }
  }
  //background for "use backspace or delete with clear tool" but just one out to the sides and below
  for (let x = 2; x < clearToolGuideTextLine1.length + 5; x++) {
    for (let y = 13; y < 16; y++) {
      insertCell.run(1, Date.now(), 0, x, y, 'VT323', '', 'blue', '');
    }
  }
  //background for "and use enter enter to set char and bg color" but just one out to the sides and below
  for (let x = 2; x < charBgColorGuideTextLine1.length + 5; x++) {
    for (let y = 17; y < 20; y++) {
      insertCell.run(1, Date.now(), 0, x, y, 'VT323', '', 'blue', '');
    }
  }
} 

io.on('connection', (socket) => {
  console.log('connect ' + socket.id);
  socket.on('joinRoom', (room) => {
    if (socket.data.pageRoom) socket.leave(socket.data.pageRoom);
    socket.data.pageRoom = String(room);
    socket.join(socket.data.pageRoom);
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

app.put('/page/:pagenumber/cellchar', (req, res) => {
  //deny if page 1
  if (req.params?.pagenumber == 1) {
    return res.status(403).json({ error: 'Cannot edit page 1' });
  }

  console.log(`cell update ${JSON.stringify(req.body)} for page ${req.params.pagenumber}`);
  let { x, y, char, charColor } = req.body;

  if (x == null || y == null || !char || !charColor) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // uppercase the char
  if (char && char.length > 0) {
    char = char.toUpperCase();
  }
  let prevCell = getCellByPageIdAndCoordinates.get(req.params?.pagenumber, x, y);
  markCellOverriden.run(req.params?.pagenumber, x, y);
  insertCell.run(req.params?.pagenumber, Date.now(), 0, x, y, prevCell?.font || 'VT323', char, req.body.bgColor ?? prevCell?.bg ?? 'transparent', charColor);

  io.to(req.params?.pagenumber).emit('cellCharUpdate', x, y, char, charColor);
  // if bg color is in req.body, emit cellBgColorUpdate event
  if (req.body.bgColor != null && req.body.bgColor !== undefined) {
    io.to(req.params?.pagenumber).emit('cellBgColorUpdate', x, y, req.body.bgColor);
  }
  res.sendStatus(200);
});

app.put('/page/:pagenumber/cellclear', (req, res) => {
  //deny if page 1
  if (req.params?.pagenumber == 1) {
    return res.status(403).json({ error: 'Cannot edit page 1' });
  }
  console.log(`cell clear ${JSON.stringify(req.body)} for page ${req.params.pagenumber}`);
  const { x, y } = req.body;
  markCellOverriden.run(req.params?.pagenumber, x, y);

  let prevCell = getCellByPageIdAndCoordinates.get(req.params?.pagenumber, x, y);
  insertCell.run(req.params?.pagenumber, Date.now(), 0, x, y, prevCell?.font || 'VT323', '', 'transparent', 'black');

  io.to(req.params?.pagenumber).emit('cellClear', x, y);
  res.sendStatus(200);
}); 

app.put('/page/:pagenumber/cellcharcolor', (req, res) => {
  //deny if page 1
  if (req.params?.pagenumber == 1) {
    return res.status(403).json({ error: 'Cannot edit page 1' });
  }
  console.log(`cell char color update ${JSON.stringify(req.body)} for page ${req.params.pagenumber}`);
  const { x, y, charColor } = req.body;

  if (x == null || y == null || !charColor) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  let prevCell = getCellByPageIdAndCoordinates.get(req.params?.pagenumber, x, y);

  markCellOverriden.run(req.params?.pagenumber, x, y);
  insertCell.run(req.params?.pagenumber, Date.now(), 0, x, y, prevCell?.font || 'VT323', prevCell?.char || '', prevCell?.bg ?? 'transparent', charColor);

  io.to(req.params?.pagenumber).emit('cellCharColorUpdate', x, y, charColor);
  res.sendStatus(200);
});

app.put('/page/:pagenumber/cellbgcolor', (req, res) => {
  //deny if page 1
  if (req.params?.pagenumber == 1) {
    return res.status(403).json({ error: 'Cannot edit page 1' });
  }
  console.log(`cell bg color update ${JSON.stringify(req.body)} for page ${req.params.pagenumber}`);
  const { x, y, bgColor } = req.body;

  if (x == null || y == null || !bgColor) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  let prevCell = getCellByPageIdAndCoordinates.get(req.params?.pagenumber, x, y);
  markCellOverriden.run(req.params?.pagenumber, x, y);
  insertCell.run(req.params?.pagenumber, Date.now(), 0, x, y, prevCell?.font || 'VT323', prevCell?.char || '', bgColor, prevCell?.char_color || 'black');

  io.to(req.params?.pagenumber).emit('cellBgColorUpdate', x, y, bgColor);
  res.sendStatus(200);
});

httpServer.listen(3000, () => {
  console.log('Server is running on port 3000');
});
