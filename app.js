const http = require("http");
const fs = require("fs");
const path = require("path");
const cells = new Array(9).fill("");
let canMove = false;
let lastMoveIndex = null;
let users = [];
let clients = [];
let rooms = [];
let players = [];
let currentPlayer;
let roomStates = {};

const server = http.createServer((req, res) => {
    let filePath;
    let url = req.url.split('?')[0]; 
    
    if (url === "/") {
        filePath = path.join(__dirname, "public", "identification.html");
    }
    else {
        filePath = path.join(__dirname, "public", req.url.slice(1)); // Удаляем начальный слэш
    }
    const extname = path.extname(filePath);
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
    if (url === "/favicon.ico") {
        res.writeHead(204);
        res.end();
        return;
    }  
    if (url === "/room.html") {
        filePath = path.join(__dirname, "public", "room.html");
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error(err);
                res.writeHead(500);
                res.end("500 Internal Server Error");
                
            } else {
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(data);
            }
        });
        return;
    }  
    if(req.method === "GET" && url !== "/getRooms") {
        fs.readFile(filePath, (err, data) => {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(data);
        });
        return;
    }

    if(url === "/ident" && req.method === "POST") {
        let body = "";
        // console.log(rooms)
        req.on("data", chunk => {
            body += chunk.toString();
        });
    
        req.on("end", _ => {
            try {
                let player = JSON.parse(body);
                players.push(player);
                createUser(player, res)
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

    if(url === "/createRoom" && req.method === "POST") {
        let body = "";
    
        req.on("data", chunk => {
            body += chunk.toString()
        });
    
        req.on("end", _ => {
            try {
                let room = JSON.parse(body);
                for(let i = 0; i < users.length; i++ ){
                    if(room.players[0] === users[i].name ) {
                        room.players[0] = users[i]
                        break;
                    }
                }
                rooms.push(room);
                const roomName = room.roomName;
                const params = {roomName : roomName};
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
    
    if(url === "/enterRoom" && req.method === "POST") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString()
        });

        req.on("end", _ => {
            try {
                let room = JSON.parse(body)
                for(let i = 0; i < users.length; i++ ){
                    if(room.player === users[i].name ) {
                        room.player = users[i]
                        break;
                    }
                }
                //console.log(room) room.player.name
                checkRoomAvailable(room)
                // console.log(rooms[0].players)
                const roomName = room.roomName;
                const params = {roomName : roomName};
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
                // console.log(rooms)
                // console.log(rooms[0].players)
                rooms.forEach(room => {
                    if(room.roomName === roomName) {
                        players = room.players;
                    }
                });
                for(let i = 0; i < players.length; i++) {
                    if(i == 0) {
                        playersTotal.push({name: players[i].name, side: 'X'})
                    }
                    if(i == 1) {
                        playersTotal.push({name: players[i].name, side: 'O'})
                    }
                }
                let owner = playersTotal[0];
                // console.log(owner)
                // console.log(playersTotal);
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
    if (url === "/check" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        })

        req.on("end", _ => {
            try {
                const roomName = JSON.parse(body).roomName;
                if(roomStates[roomName] === undefined) {
                    res.writeHead(200);
                    res.end(JSON.stringify({currentPlayer: 'X'}))
                    return;
                }
                res.writeHead(200);
                res.end(JSON.stringify({cells: roomStates[roomName].cells, currentPlayer: roomStates[roomName].currentPlayer}))
                return;

            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: "Invalid JSON" }));
            }
            return;
        })
        return;
    }
    if(url === "/move" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        })

        req.on("end", _ => {
            try {
                const {index, player} = JSON.parse(body);
                const roomName = player.roomName;
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
                const winningCombinations = [
                                    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
                                    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
                                    [0, 4, 8], [2, 4, 6] 
                ]; 
                // console.log(roomStates[roomName])
                currentState.cells[index] = player.side;
                currentPlayer = player.side;
                // console.log(roomStates[roomName])
                // console.log(users)
                for (const combo of winningCombinations) {
                    const [a, b, c] = combo;
                    if (
                        currentState.cells[a] &&
                        currentState.cells[a] === currentState.cells[b] &&
                        currentState.cells[a] === currentState.cells[c]
                    ) {
                        // Оповещаем клиентов о победе и очищаем состояние игры
                        const clients = []
                        users.forEach(user => {
                            clients.push(user.client)
                            // console.log(user.name)
                        })
                        const clientsData = clients.map(client => {
                            console.log(client)
                            return {success: true, winner: currentState.currentPlayer};
                        })
                        res.end(JSON.stringify(clientsData));
                        // Очищаем состояние игры после победы
                        roomStates[roomName] = {
                            cells: new Array(9).fill(""),
                            currentPlayer: "X"
                        };
                        return;
                    }
                }
                // Проверяем на ничью
                if (!currentState.cells.includes("")) {
                    const clients = []
                    users.forEach(user => {
                        clients.push(user.client)
                        // console.log(user.name)
                    })
                    const clientsData = clients.map(client => {
                        return {success: true, draw: true};
                    })
                    res.end(JSON.stringify(clientsData));
                    // Очищаем состояние игры после ничьи
                    roomStates[roomName] = {
                        cells: new Array(9).fill(""),
                        currentPlayer: "X"
                    };
                    return;
                }
                // console.log(users)
                // Переключаем текущего игрока
                currentState.currentPlayer = currentState.currentPlayer === "X" ? "O" : "X";
                // Оповещаем клиентов о ходе и обновляем состояние игры
                const clients = []
                users.forEach(user => {
                    clients.push(user.client)
                    // console.log(user.name)
                })
                
                const clientsData = clients.map(client => {
                    return {success: true, cells: currentState.cells, currentPlayer: currentState.currentPlayer};
                })

                // console.log(roomStates)
                res.end(JSON.stringify(clientsData));
                return;               
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: "Invalid JSON" }));
            }
        })
        return;
    }
    if (url === "/getRooms" && req.method === "GET") {
        let roomNames = [];
        rooms.forEach(room => {
            roomNames.push(room.roomName)
        })
        // console.log(rooms)
        // Проверяем, существует ли массив комнат
        if (roomNames.length < 1) {
            console.log("rooms is empty now")
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({rooms: roomNames, player: users[users.length-1].name})); // Отправляем пустой массив комнат
            return;
        }
        console.log("rooms not empty now")
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({rooms: roomNames, player: users[users.length-1].name}));
        return;
    }
    if (url === "/reset" && req.method === "HEAD") {
        currentPlayer = 'X';
        cells.fill("");
        return;
    }
    
    res.writeHead(404);
    res.end("Not Found");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

function createUser(name, res) {
    users.push({
        name: name.name,
        client: res
    })
    return {name: name, client: res}
    // console.log(users)
}

function checkRoomAvailable(room2) {
    let foundRoom = rooms.filter(room => room.roomName == room2.roomName);

    if(foundRoom[0].length == 0) {
        console.log("Room not found");
        return;
    }

    if(foundRoom[0].players.length > 1) {
        console.log("Room is full");
        return;
    }

    foundRoom[0].players.push(room2.player);
    console.log(`${room2.player} join room ${room2.roomName}`)

}