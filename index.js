var express = require("express");
var app = express();
const cors = require("cors");
var CSGOGSI = require("./gamestate");
var http = require("http");
var socketio = require("socket.io");
const sqlite3 = require("sqlite3").verbose();

let db = new sqlite3.Database("./db/hud.db", (err) => {
  if (err) {
    return console.error(err.message);
  }

  console.log("Connected to database");
});

db.run(
  "CREATE TABLE IF NOT EXISTS players(steamID text primary key not null, playerName text default '', playerImage text default '')",
  (err) => {
    if (err) {
      return console.error(err.message);
    }
  }
);
db.run(
  "CREATE TABLE IF NOT EXISTS teams(id int primary key not null, teamName text, teamLogo text)",
  (err) => {
    if (err) {
      return console.error(err.message);
    }
  }
);

var render = true;

var allplayers = {};
var player = {};
var map = {};
var bomb = {};
var phase_countdowns = {};
var round = {};
var grenades = {};

app.use(cors);

const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: "*",
  },
});

let gsi = new CSGOGSI({
  port: 1349,
});

let playerSQL = "SELECT playerName, playerImage FROM players WHERE steamID = ?";

gsi.on("all", function (data) {
  if (data.activity == "menu") {
    io.emit("menu");
    render = false;
  } else {
    render = true;
  }
  if (Object.keys(data).includes("allplayers")) {
    if (Object.keys(allplayers).length > 10) {
      allplayers = {};
    }
    if (allplayers !== data.allplayers) {
      for (let player of Object.keys(data.allplayers)) {
        if (!Object.keys(allplayers).includes(player)) {
          allplayers[player] = {};
          allplayers[player].image = "";
          allplayers[player].name = data.allplayers[player].name;
        }
        allplayers[player].observer_slot =
          data.allplayers[player].observer_slot;

        allplayers[player].team = data.allplayers[player].team;

        allplayers[player].state = data.allplayers[player].state;

        allplayers[player].match_stats = data.allplayers[player].match_stats;

        allplayers[player].weapons = data.allplayers[player].weapons;

        allplayers[player].position = data.allplayers[player].position;

        allplayers[player].forward = data.allplayers[player].forward;

        let steamID = player;
        db.get(playerSQL, [steamID], (err, row) => {
          if (err) {
            return console.error(err.message);
          }
          if (row !== undefined) {
            allplayers[player].name = row.playerName;
            allplayers[player].image = row.playerImage;
          }
        });
      }
      io.emit("allplayers", allplayers);
    }
  }

  if (Object.keys(data).includes("player")) {
    if (player !== data.player) {
      player.observer_slot = data.player.observer_slot;

      player.steamid = data.player.steamid;

      player.team = data.player.team;

      player.state = data.player.state;

      player.match_stats = data.player.match_stats;

      player.weapons = data.player.weapons;

      player.position = data.player.position;

      player.forward = data.allplayers.forward;

      let steamID = player;
      db.get(playerSQL, [steamID], (err, row) => {
        if (err) {
          return console.error(err.message);
        }
        if (row !== undefined) {
          player.name = row.playerName;
        } else {
          player.name = data.player.name;
        }
      });
      io.emit("player", player);
    }
  }
  if (Object.keys(data).includes("map")) {
    map = data.map;
    io.emit("map", map);
  }
  if (Object.keys(data).includes("bomb")) {
    if (bomb !== data.bomb) {
      bomb = data.bomb;
      io.emit("bomb", bomb);
    }
  }
  if (Object.keys(data).includes("phase_countdowns")) {
    if (phase_countdowns !== data.phase_countdowns) {
      phase_countdowns = data.phase_countdowns;
      io.emit("phase_countdowns", phase_countdowns);
    }
  }
  if (Object.keys(data).includes("round")) {
    if (round !== data.round) {
      round = data.round;
      io.emit("round", round);
    }
  }
  if (Object.keys(data).includes("grenades")) {
    if (grenades !== data.grenades) {
      grenades = data.grenades;
      io.emit("grenades", grenades);
    }
  }
});

io.on("connection", (socket) => {
  console.log("User Connected");

  socket.on("swapTeams", () => {
    io.emit("swapTeams");
    console.log("Teams Swapped");
  });

  socket.on("setTeams", (teams) => {
    io.emit("getTeams", teams);
    console.log("Teams set");
  });
});

server.listen(3001, () => {
  console.log("listening on 3001");
});
