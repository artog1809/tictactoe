const http = require("http");
const fs = require("fs");
const path = require("path");
const cells = new Array(9).fill("");
let users = [];
let rooms = [];
let players = [];
let roomStates = {};

const server = http.createServer((req, res) => {
    let filePath;
    // Отбросить параметры из адреснйо строки
    let url = req.url.split('?')[0]; 
    
    if (url === "/") {
        //Домашняя страница
        filePath = path.join(__dirname, "public", "identification.html");
    }
    else {
        // Остальные страницы
        filePath = path.join(__dirname, "public", req.url.slice(1)); // Удаляем начальный слэш
    }
    // Узнать расширение файла
    const extname = path.extname(filePath);
    // По умолчанию расширение html
    let contentType = "text/html";
    
    // Устанавливаем contentType в зависимости от расширения файла
    switch (extname) {
        case ".css":
            contentType = "text/css";
            break;
        case ".js":
            contentType = "text/javascript";
            break;
        case ".json":
            contentType = "application/json";
            break;
        case ".png":
            contentType = "image/png";
            break;
        case ".jpg":
            contentType = "image/jpg";
            break;
    }
    // Обход ошибки 
    if (url === "/favicon.ico") {
        res.writeHead(204);
        res.end();
        return;
    }  
    // Страница комнаты
    if (url === "/room.html") {
        filePath = path.join(__dirname, "public", "room.html");
        fs.readFile(filePath, (err, data) => {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(data);
        });
        return;
    } 
    // Получить список комнат
    if(req.method === "GET" && url !== "/getRooms") {
        fs.readFile(filePath, (err, data) => {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(data);
        });
        return;
    }
    // Страница идентификации
    if(url === "/ident" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });
        req.on("end", _ => {
            try {
                let player = JSON.parse(body);
                players.push(player);
                // Создать игрока при удачной регистрации
                createUser(player, res)
                // Сделать редирект на страницу со списком комнат
                res.writeHead(302, {'location':'/roomList.html'})
                res.end();
                return;
            } catch (error) {
                res.writeHead(400);
                res.end("invalid data");
            }
        });
        return;
    }
    // Создать комнату
    if(url === "/createRoom" && req.method === "POST") {
        let body = "";
    
        req.on("data", chunk => {
            body += chunk.toString()
        });
    
        req.on("end", _ => {
            try {
                let room = JSON.parse(body);
                // Добавить игрока создавшего комнату в комнату
                for(let i = 0; i < users.length; i++ ){
                    if(room.players[0] === users[i].name ) {
                        room.players[0] = users[i]
                        break;
                    }
                }
                // Добавить комнату в список комнат
                rooms.push(room);
                const roomName = room.roomName;
                // Создать параметры адресной строки
                const params = {roomName : roomName};
                // Сделать редирект в комнату
                const redirectUrl = `/room.html?${new URLSearchParams(params).toString()}`
                res.writeHead(302, {'Location': redirectUrl});
                res.end();
                return;
            } catch(error) {
                res.writeHead(400);
                res.end('invalid data');
            }
        });
        return;
    }
    // Войти в комнату
    if(url === "/enterRoom" && req.method === "POST") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString()
        });

        req.on("end", _ => {
            try {
                let room = JSON.parse(body)
                // Добавить игрока в комнату
                for(let i = 0; i < users.length; i++ ){
                    if(room.player === users[i].name ) {
                        room.player = users[i]
                        break;
                    }
                }
                // Проверить доступна ли комната
                if(checkRoomAvailable(room) === true) {
                    const roomName = room.roomName;
                    // Создать параметры адресной строки
                    const params = {roomName : roomName};
                    // Сделать редирект в комнату
                    const redirectUrl = `/room.html?${new URLSearchParams(params).toString()}`
                    res.writeHead(302, {'Location': redirectUrl});
                    res.end();
                    return;
                }
                
            } catch(error) {
                res.writeHead();
                res.end('invalid data');
            }
        });
        return;
    }
    // Конец игры
    if(url === "/gameOver" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        })

        req.on("end", _ => {
            try {
                const room = JSON.parse(body);
                const roomName = room.roomName;
                // Удалить комнату из массива состояний комнат
                delete roomStates[roomName];
                // Удалить комнату из глобального массива комнат
                for(let i = 0; i < rooms.length; i++) {
                    if(rooms[i].roomName === roomName) {
                        rooms.splice(i,1);
                        break;
                    }
                }
                // Сделать редирект на список комнат
                res.writeHead(302, {'location':'/roomList.html'})
                res.end();
                return;
            } catch (error) {
                res.writeHead(400);
                res.end("invalid data")
            }
        })
        return;
    }
    // Получить текущих игроков в комнате
    if(url === "/getPlayers" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        })

        req.on("end", _ => {
            try {
                const room = JSON.parse(body)
                const roomName = room.roomName;
                let players;
                let playersTotal = [];
                // Добавить в массив игроков, из состояния комнаты
                rooms.forEach(room => {
                    if(room.roomName === roomName) {
                        players = room.players;
                    }
                });
                // Добавить игроков в ответ с соответствующими сторонами
                for(let i = 0; i < players.length; i++) {
                    if(i == 0) {
                        playersTotal.push({name: players[i].name, side: 'X'})
                    }
                    if(i == 1) {
                        playersTotal.push({name: players[i].name, side: 'O'})
                    }
                }
                let owner = playersTotal[0];
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({owner: owner, players: playersTotal}));
                return;
            } catch(error) {
                res.writeHead(400);
                res.end('invalid data');
            }
        })
        return;
    }
    // Проверка состояния игры
    if (url === "/check" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        })
        req.on("end", _ => {
            try {
                const roomName = JSON.parse(body).roomName;
                // Назначить текущего игрока - Х, если игра только началась
                if(roomStates[roomName] === undefined) {
                    res.end(JSON.stringify({currentPlayer : 'X'}))
                    return;
                }
                // Обработка победы
                if (roomStates[roomName].winner) {
                    res.end(JSON.stringify({cells: roomStates[roomName].cells, 
                        currentPlayer: roomStates[roomName].currentPlayer, 
                        winner: roomStates[roomName].winner}));
                    return;
                }
                // Обработка ничьи
                if (roomStates[roomName].draw) {
                    res.end(JSON.stringify({cells: roomStates[roomName].cells, 
                        currentPlayer: roomStates[roomName].currentPlayer, 
                        draw: roomStates[roomName].draw}));
                    return;
                }
                // Следующий ход
                res.end(JSON.stringify({cells: roomStates[roomName].cells, 
                                        currentPlayer: roomStates[roomName].currentPlayer}));
                return;

            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: "Invalid JSON" }));
            }
        })
        return;
    }
    // Ход игрока
    if(url === "/move" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        })
        req.on("end", _ => {
            try {
                const {index, player} = JSON.parse(body);
                const roomName = player.roomName;
                // Если комната только создана, заполнить клетки пустотой
                if(!roomStates[roomName]) {
                    roomStates[roomName] = {
                        cells: new Array(9).fill(""),
                        currentPlayer: 'X'
                    }
                }
                const currentState = roomStates[roomName];
                if(index == null || !player) {
                    res.writeHead(400);
                    res.end(JSON.stringify({success: false, message: "Invalid request 400"}));
                    return;
                }
                lastMoveIndex = index;
                // Выигрышные комбинации
                const winningCombinations = [
                                    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
                                    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
                                    [0, 4, 8], [2, 4, 6] 
                ]; 
                currentState.cells[index] = player.side;
                currentPlayer = player.side;
                // Проверка на победу
                for (const combo of winningCombinations) {
                    const [a, b, c] = combo;
                    if (
                        currentState.cells[a] &&
                        currentState.cells[a] === currentState.cells[b] &&
                        currentState.cells[a] === currentState.cells[c]
                    ) {
                        // Добавить в массив пользователей клиенты
                        const clients = []
                        users.forEach(user => {
                            clients.push(user.client)
                        })
                        // Определить победтиля
                        roomStates[roomName].winner = currentState.currentPlayer
                        // Отправить клиенту оповещение о победе
                        const clientsData = clients.map(client => {
                            return {success: true, winner: currentState.currentPlayer, cells: currentState.cells};
                        })
                        res.end(JSON.stringify(clientsData));
                        return;
                    }
                }
                // Проверяем на ничью
                if (!currentState.cells.includes("")) {
                    const clients = []
                    users.forEach(user => {
                        clients.push(user.client)
                    })
                    roomStates[roomName].draw = true
                    // Отправить клиенту оповещение о ничье
                    const clientsData = clients.map(client => {
                        return {success: true, draw: true, cells: currentState.cells};
                    })
                    res.end(JSON.stringify(clientsData));
                    return;
                }
                // Переключаем текущего игрока
                currentState.currentPlayer = currentState.currentPlayer === "X" ? "O" : "X";
                // Оповещаем клиентов о ходе и обновляем состояние игры
                const clients = []
                users.forEach(user => {
                    clients.push(user.client)
                })
                
                const clientsData = clients.map(client => {
                    return {success: true, cells: currentState.cells, currentPlayer: currentState.currentPlayer};
                })
                
                res.end(JSON.stringify(clientsData));
                return;               
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: "Invalid JSON" }));
            }
        })
        return;
    }
    // Получить список созданных комнат
    if (url === "/getRooms" && req.method === "GET") {
        let roomNames = [];
        rooms.forEach(room => {
            roomNames.push({roomName: room.roomName, count: room.players.length})
        })
        // Проверяем, существует ли массив комнат
        if (roomNames.length < 1) {
            res.writeHead(200, { "Content-Type": "application/json" });
            // Отправляем пустой массив комнат
            res.end(JSON.stringify({rooms: roomNames, player: users[users.length-1].name})); 
            return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({rooms: roomNames, player: users[users.length-1].name}));
        return;
    }
    res.writeHead(404);
    res.end("Not Found");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Создание пользователя
function createUser(name, res) {
    users.push({
        name: name.name,
        client: res
    })
    return {name: name, client: res}
}

// Проверка комнату на доступность
function checkRoomAvailable(room2) {
    let foundRoom = rooms.filter(room => room.roomName == room2.roomName);

    // Если такой комнаты нет в списке
    if(foundRoom[0].length == 0) {
        console.log("Room not found");
        return false;
    }

    // Если в комнате уже 2 игрока
    if(foundRoom[0].players.length > 1) {
        console.log("Room is full");
        return false;
    }
    
    // Если комната доступна войти в нее
    foundRoom[0].players.push(room2.player);
    console.log(`${room2.player} join room ${room2.roomName}`)
    return true;
}