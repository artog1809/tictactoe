// Подключаем необходимые модули
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Создаем экземпляр Express
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Папка со статическими файлами (HTML, CSS, JS)
app.use(express.static(__dirname + "/public"));
