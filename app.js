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

// Объект для хранения игровых комнат
const rooms = {};

// Функция для создания новой игровой комнаты
function createRoom(playerName, roomName) {
    rooms[roomName] = {
        players: [{ name: playerName, symbol: 'X', id: null }],
        currentPlayer: 'X',
        board: ['', '', '', '', '', '', '', '', ''],
        winner: null
    };
}

// Функция для проверки выигрышной комбинации
function checkWinner(board, player) {
    const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Горизонтальные линии
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Вертикальные линии
        [0, 4, 8], [2, 4, 6]              // Диагонали
    ];

    return winningCombos.some(combo => {
        return combo.every(index => board[index] === player);
    });
}

// Обработчик подключения нового клиента
io.on('connection', socket => {
    let playerName = '';

    // Обработчик создания новой комнаты и присоединения к ней
    socket.on('createRoom', (data) => {
        playerName = data.playerName;
        const roomName = data.roomName;
        
        // Создаем новую комнату и добавляем первого игрока
        createRoom(playerName, roomName);
        socket.join(roomName);
        rooms[roomName].players[0].id = socket.id;

        // Отправляем клиенту информацию о созданной комнате
        socket.emit('roomCreated', { roomName, playerName });
    });

    // Обработчик присоединения ко второй комнате
    socket.on('joinRoom', (data) => {
        playerName = data.playerName;
        const roomName = data.roomName;

        // Проверяем существование комнаты
        if (rooms[roomName] && rooms[roomName].players.length === 1) {
            // Добавляем второго игрока
            rooms[roomName].players.push({ name: playerName, symbol: 'O', id: socket.id });
            socket.join(roomName);

            // Отправляем обоим игрокам информацию о начале игры
            io.to(roomName).emit('gameStart', rooms[roomName]);
        } else {
            // В случае ошибки отправляем сообщение об ошибке
            socket.emit('roomError', { message: 'Комната уже заполнена или не существует' });
        }
    });

    // Обработчик хода игрока
    socket.on('move', (data) => {
        const { roomName, index } = data;
        const room = rooms[roomName];
        
        // Проверяем, возможен ли ход
        if (!room.winner && room.board[index] === '') {
            // Обновляем состояние игры
            room.board[index] = room.currentPlayer;

            // Проверяем, есть ли победитель
            if (checkWinner(room.board, room.currentPlayer)) {
                room.winner = room.currentPlayer;
            } else {
                // Переключаем текущего игрока
                room.currentPlayer = room.currentPlayer === 'X' ? 'O' : 'X';
            }

            // Отправляем обновленное состояние игры всем игрокам в комнате
            io.to(roomName).emit('gameState', room);
        }
    });

    // Обработчик перезапуска игры
    socket.on('restart', (roomName) => {
        // Сбрасываем состояние игры в указанной комнате
        rooms[roomName] = {
            players: rooms[roomName].players,
            currentPlayer: 'X',
            board: ['', '', '', '', '', '', '', '', ''],
            winner: null
        };

        // Отправляем начальное состояние игры всем игрокам в комнате
        io.to(roomName).emit('gameState', rooms[roomName]);
    });

    // Обработчик отключения клиента
    socket.on('disconnect', () => {
        // Если игрок был присоединен к комнате, удаляем его из комнаты
        if (playerName) {
            for (const roomName in rooms) {
                const players = rooms[roomName].players;
                const index = players.findIndex(player => player.name === playerName);
                if (index !== -1) {
                    players.splice(index, 1);
                    if (players.length === 0) {
                        delete rooms[roomName];
                    } else {
                        io.to(roomName).emit('playerLeft', playerName);
                    }
                    break;
                }
            }
        }
    });
});

// Запускаем сервер на порту 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
