const express = require("express");
const MongoClient = require("mongodb").MongoClient;

const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

const url = "mongodb://gomoku:gomoku1@ds213968.mlab.com:13968/gomoku";
const dbName = "gomoku";

let collection;

MongoClient.connect(url, function(err, client) {
  const db = client.db(dbName);
  collection = db.collection("game");
});

const someoneWon = (board, currentPlayer) => {
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (
        i + "." + (j + 4) in board &&
        board[i + "." + j] === currentPlayer &&
        board[i + "." + (j + 1)] === currentPlayer &&
        board[i + "." + (j + 2)] === currentPlayer &&
        board[i + "." + (j + 3)] === currentPlayer &&
        board[i + "." + (j + 4)] === currentPlayer
      )
        return true;
      else if (
        i + 4 + "." + j in board &&
        board[i + "." + j] === currentPlayer &&
        board[i + 1 + "." + j] === currentPlayer &&
        board[i + 2 + "." + j] === currentPlayer &&
        board[i + 3 + "." + j] === currentPlayer &&
        board[i + 4 + "." + j] === currentPlayer
      )
        return true;
      else if (
        i + 4 + "." + (j + 4) in board &&
        board[i + "." + j] === currentPlayer &&
        board[i + 1 + "." + (j + 1)] === currentPlayer &&
        board[i + 2 + "." + (j + 2)] === currentPlayer &&
        board[i + 3 + "." + (j + 3)] === currentPlayer &&
        board[i + 4 + "." + (j + 4)] === currentPlayer
      )
        return true;
      else if (
        i - 4 + "." + (j + 4) in board &&
        board[i + "." + j] === currentPlayer &&
        board[i - 1 + "." + (j + 1)] === currentPlayer &&
        board[i - 2 + "." + (j + 2)] === currentPlayer &&
        board[i - 3 + "." + (j + 3)] === currentPlayer &&
        board[i - 4 + "." + (j + 4)] === currentPlayer
      )
        return true;
    }
  }

  return false;
};

app.set("view engine", "jade");
app.get("/", (_, res) => {
  collection.find({}, { datefield: -1 }).toArray((_, docs) => {
    let board = {};
    docs.forEach(d => {
      board[d.coordinate] = d.turn;
    });
    const currentTurn = docs.length > 0 ? docs[docs.length - 1].turn : 0;
    console.log(board);
    res.render("index", {
      board: board,
      turn: currentTurn,
      win: someoneWon(board, currentTurn)
    });
  });
});
app.post("/", (req, res) => {
  if ("restart" in req.body) {
    collection.deleteMany({}, () => {
      res.redirect("/");
    });
  } else {
    const cell = req.body.cell;
    const turn = req.body.turn;
    collection.update(
      { coordinate: cell },
      { coordinate: cell, turn: turn },
      { upsert: true },
      () => {
        res.redirect("/");
      }
    );
  }
});

app.listen(8080);
