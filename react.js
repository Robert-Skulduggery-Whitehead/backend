const express = require("express");
const path = require("path");
const app = express();

class ReactServer {
  constructor() {
    this.app = express();

    this.app.use(express.static(path.join(__dirname, "build")));

    this.app.get("/", function (req, res) {
      res.sendFile(path.join(__dirname, "build", "index.html"));
    });

    this.app.listen(9000);
  }
}

module.exports = ReactServer;
