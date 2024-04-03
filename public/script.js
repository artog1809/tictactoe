const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomName = urlParams.get('roomName');

document.addEventListener('DOMContentLoaded', getPlayers);
document.addEventListener('DOMContentLoaded', checkChanges);
// document.addEventListener('DOMContentLoaded', pollServer);
// document.addEventListener('DOMContentLoaded', subscribe);

const title = document.querySelector('.roomName');
const cells = document.querySelectorAll('.cell');
const board = document.querySelector('.gameField');
const restart = document.querySelector('.restart');
const pl = document.querySelector('.playerName');
const plSide = document.querySelector('.playerSide');
const opp = document.querySelector('.opponentName');
const oppSide = document.querySelector('.opponentSide');
const movePl = document.querySelector('.move')

title.textContent = `Игровая комната ${roomName}`;

let currentPlayer = 'X';
let namePlayer;

for (let i = 0; i < cells.length; i++) {
    cells[i].addEventListener('click', _ => {
        if (!cells[i].textContent) {
            move(i);
        }
    });
}

// Добавляем переменную для хранения статуса текущего хода
let canMove = true;

// Изменяем логику отправки хода
function move(index) {
    // debugger
    if (!canMove) return; // Проверяем, можем ли мы делать ход
    // debugger;
    fetch("/move", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ index, player: { roomName: roomName, side: currentPlayer } }) // Добавляем информацию о комнате и стороне
    })
    .then(response => response.json())
    .then(data => {
        // debugger
        if (data[0].success) {
            if (data[0].winner) {
                if(data[0].winner)
                alert(`${data[0].winner} wins!`);
                resetBoard();
            }
            if (data[0].draw) {
                alert("It's a draw")
                resetBoard();
            }
            if (!data[0].winner && !data[0].draw) {
                // Обновляем текущего игрока только после успешного хода
                // console.log(data)
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
    // debugger
    fetch ("/check", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({roomName: roomName})
    })
    .then(response => response.json())
    .then(data => {
        console.log(currentPlayer)
        // console.log(Object.keys(data).length)
        if(Object.keys(data).length > 1) updateBoard(data.cells);
        // console.log(plSide.textContent)
        if(data.currentPlayer != plSide.textContent){
            // console.log("ожидание хода соперника")
            setTimeout(checkChanges(), 10000)
        }
        if(data.currentPlayer == plSide.textContent){
            console.log("ваш ход")
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
    // setTimeout(checkChanges(), 10000)
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
        // console.log(data.owner);
        // console.log(data.players);
        // debugger
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

