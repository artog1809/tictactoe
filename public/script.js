const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomName = urlParams.get('roomName');

document.addEventListener('DOMContentLoaded', getPlayers);
document.addEventListener('DOMContentLoaded', checkChanges);

const title = document.querySelector('.roomName');
const cells = document.querySelectorAll('.cell');
const board = document.querySelector('.gameField');
const restart = document.querySelector('.restart');
const pl = document.querySelector('.playerName');
const plSide = document.querySelector('.playerSide');
const opp = document.querySelector('.opponentName');
const oppSide = document.querySelector('.opponentSide');
const movePl = document.querySelector('.move')
const gameMessage = document.querySelector('.gameMessage')

title.textContent = `Игровая комната ${roomName}`;

let currentPlayer = 'X';
let namePlayer;


// Повесить на каждую клетку поля обработчик клика
for (let i = 0; i < cells.length; i++) {
    cells[i].addEventListener('click', _ => {
        if (!cells[i].textContent) {
            move(i);
        }
    });
}

// Переменная для определения доступности хода игрока
let canMove = true;

function move(index) {
    if (!canMove) return; // Проверяем, можем ли мы делать ход
    fetch("/move", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ index, player: { roomName: roomName, side: currentPlayer } }) // Добавляем информацию о комнате и стороне
    })
    .then(response => response.json())
    .then(data => {
        if (data[0].success) {
            if (data[0].winner) {
                if(data[0].winner)
                movePl.textContent = `Выиграл ${data[0].winner}`
                setTimeout(gameOver, 5000);
            }
            if (data[0].draw) {
                movePl.textContent = 'Ничья'
                setTimeout(gameOver, 5000);
            }
            if (!data[0].winner && !data[0].draw) {
                // Обновляем текущего игрока только после успешного хода
                currentPlayer = data[0].currentPlayer;
                
                canMove = currentPlayer === plSide.textContent; // Проверяем, можем ли мы делать ход
                updateBoard(data[0].cells);
                checkChanges();
            }
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error("Error:", error));
}

function checkChanges() {
    fetch ("/check", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({roomName: roomName})
    })
    .then(response => response.json())
    .then(data => {
        // console.log(data)
        if(data.winner !== undefined) {
            movePl.textContent = `Выиграл ${data.winner}`
            setTimeout(gameOver, 5000);
            return;
        }
        if(data.draw !== undefined) {
            movePl.textContent = `Ничья`
            setTimeout(gameOver, 5000);
            return;
        }
        if(Object.keys(data).length > 1) updateBoard(data.cells);
        if(data.currentPlayer != plSide.textContent){
            setTimeout(checkChanges(), 10000)
        }
        currentPlayer = data.currentPlayer;
        if(currentPlayer === plSide.textContent) {
            movePl.textContent = `Ход игрока ${pl.textContent}`
        }
        if(currentPlayer === oppSide.textContent) {
            movePl.textContent = `Ход игрока ${opp.textContent}`
        }
        canMove = currentPlayer === plSide.textContent;
    })
}

function updateBoard(newCells) {
    for (let i = 0; i < newCells.length; i++) {
        cells[i].textContent = newCells[i];
    }
}

function resetBoard() {
    fetch("/reset", {
        method: "HEAD"
    })
    .then(console.log("reset board"))
    .then(updateBoard(['','','','','','','','','',]))
}

function getPlayers() {
    fetch("/getPlayers", {
        method: "POST",
        headers: {
            "ContentType":"application/json"
        },
        body: JSON.stringify({roomName: roomName})
    })
    .then(response => response.json())
    .then(data => {
        if(data.players.length === 1) {
            namePlayer = data.owner.name;
            pl.textContent = namePlayer;
            plSide.textContent = data.owner.side;
            setTimeout(getPlayers(), 1000);
        } 
        if(data.players.length === 2) {
            if(namePlayer === data.owner.name) {
                pl.textContent = namePlayer;
                plSide.textContent = data.owner.side;
                opp.textContent = data.players[1].name;
                oppSide.textContent = data.players[1].side;
            }
            if(namePlayer !== data.owner.name) {
                namePlayer = data.players[1].name;
                pl.textContent = namePlayer;
                plSide.textContent = data.players[1].side;
                opp.textContent = data.owner.name;
                oppSide.textContent = data.owner.side;
            }
        }
        
    })
}

function gameOver() {
    fetch("/gameOver", {
        method: "POST",
        headers: {
            "Content-Type":"applicaton/json"
        },
        body: JSON.stringify({roomName: roomName})
    })
    .then(response => {
        if(response.ok) {
            window.location.href = "/roomList.html";
        } else {
            console.error("Ошибка при отправке данных на сервер");
        }
    })
}

