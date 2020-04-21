const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app); //creat server with native http so it can be used in socket io config
const socketio = require("socket.io");
const io = socketio(server);
const port = process.env.port || 3000;

const path = require("path");
const Filter = require("bad-words");
const { messages, generateLocationMessage } = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);
    socket.emit("message", messages(user.username, "Welcome!")); //send this to the new connection only
    socket.broadcast.to(user.room).emit(
      "message",
      messages(
        user.username,
        `
    ${username} has joined`
      )
    ); //send this to every on but new user
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });
  //socket.emit io.emit socket.broadcast.emit
  //io.to.emit,socket.broadcast.to.emit

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("profain messages are not allowed ");
    }
    io.to(user.room).emit("message", messages(user.username, message)); //send this to the all connected devices
    callback(); //to acknowlodge that the message was delivered from the client to the server
  });

  socket.on("sendLocation", (location, cb) => {
    const user = getUser(socket.id);

    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://www.google.com/maps?q=${location.lat},${location.long}`
      )
    );
    // io.emit("message", location.longitude);
    cb();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        messages(user.username, `${user.username} has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log("server is running at port 3000");
});
