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

// const url = "mongodb://gomoku:gomoku1@ds213968.mlab.com:13968/gomoku";
var port = mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null) {
  var mongoHost, mongoPort, mongoDatabase, mongoPassword, mongoUser;
  // If using plane old env vars via service discovery
  if (process.env.DATABASE_SERVICE_NAME) {
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
    mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'];
    mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'];
    mongoDatabase = process.env[mongoServiceName + '_DATABASE'];
    mongoPassword = process.env[mongoServiceName + '_PASSWORD'];
    mongoUser = process.env[mongoServiceName + '_USER'];

  // If using env vars from secret from service binding  
  } else if (process.env.database_name) {
    mongoDatabase = process.env.database_name;
    mongoPassword = process.env.password;
    mongoUser = process.env.username;
    var mongoUriParts = process.env.uri && process.env.uri.split("//");
    if (mongoUriParts.length == 2) {
      mongoUriParts = mongoUriParts[1].split(":");
      if (mongoUriParts && mongoUriParts.length == 2) {
        mongoHost = mongoUriParts[0];
        mongoPort = mongoUriParts[1];
      }
    }
  }

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
  }
}
const url = mongoURL;
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

app.listen(1234);
