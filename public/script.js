// Получение url параметра
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
let winner;
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

// Ход игрока
function move(index) {
    // Проверить на доступность хода
    if (!canMove) return; 
    // Отправить информацию на сервер и получить ответ
    fetch("/move", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ index, player: { roomName: roomName, side: currentPlayer } }) 
    })
    .then(response => response.json())
    .then(data => {
        // Проверить получены ли данные
        if (data[0].success) {
            // Если есть победитель
            if (data[0].winner) {
                updateBoard(data[0].cells);
                highlightWinCombo(data[0].cells, data[0].winner);
                movePl.textContent = `Выиграл ${data[0].winner}`
                setTimeout(gameOver, 5000);
            }
            // Если ничья
            if (data[0].draw) {
                updateBoard(data[0].cells);
                movePl.textContent = 'Ничья'
                setTimeout(gameOver, 5000);
            }
            // Если игра продолжается
            if (!data[0].winner && !data[0].draw) {
                // Обновляем текущего игрока только после успешного хода
                currentPlayer = data[0].currentPlayer;
                
                // Проверяем, можем ли мы делать ход
                canMove = currentPlayer === plSide.textContent; 
                // Обновить поле
                updateBoard(data[0].cells);
                // Запустить проверку на изменение состояния игры
                checkChanges();
            }
        } 
        if(!data[0].success) {
            alert(data.message);
        }
    })
    .catch(error => console.error("Error:", error));
}

// Проверка на изменение состояния игры
function checkChanges() {
    // Получить информацию о состоянии игры с сервера
    fetch ("/check", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({roomName: roomName})
    })
    .then(response => response.json())
    .then(data => {
        // Если есть победитель
        if(data.winner) {
            updateBoard(data.cells);
            highlightWinCombo(data.cells, data.winner);
            movePl.textContent = `Выиграл ${data.winner}`
            setTimeout(gameOver, 5000);
            return;
        }
        // Если ничья
        if(data.draw) {
            updateBoard(data.cells);
            movePl.textContent = `Ничья`
            setTimeout(gameOver, 5000);
            return;
        }
        // Проверить сделан ли ход 
        if(Object.keys(data).length > 1) updateBoard(data.cells);
        // Если сейчас не ваш ход, подписаться на изменения комнаты
        if(data.currentPlayer != plSide.textContent){
            checkChanges();
        }
        currentPlayer = data.currentPlayer;
        // Показать чей ход сейчас
        if(currentPlayer === plSide.textContent) {
            movePl.textContent = `Ходит ${plSide.textContent}`
        }
        if(currentPlayer === oppSide.textContent) {
            movePl.textContent = `Ходит ${oppSide.textContent}`
        }
        // Установить доступность хода
        canMove = currentPlayer === plSide.textContent;
    })
}

// Обновить поле игры
function updateBoard(newCells) {
    for (let i = 0; i < newCells.length; i++) {
        cells[i].textContent = newCells[i];
        if(cells[i].textContent === 'O') [
            cells[i].classList.add('zero')
        ]
    }
}

// Получить данные об игроках в комнате
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
        // Если 1 игрок в комнате, подписаться на обновление игроков в комнате
        if(data.players.length === 1) {
            namePlayer = data.owner.name;
            plSide.textContent = data.owner.side;
            setTimeout(getPlayers, 1000);
        } 
        // Если в комнате 2 игрока
        if(data.players.length === 2) {
            // Отобразить первого игрока
            if(namePlayer === data.owner.name) {
                plSide.textContent = data.owner.side;
                oppSide.textContent = data.players[1].side;
            }
            // Отобразить второго игрока
            if(namePlayer !== data.owner.name) {
                plSide.textContent = data.players[1].side;
                oppSide.textContent = data.owner.side;
            }
        }
        
    })
}
// Конец игры
function gameOver() {
    // Отправить серверу комнату, в который игра окончена
    fetch("/gameOver", {
        method: "POST",
        headers: {
            "Content-Type":"applicaton/json"
        },
        body: JSON.stringify({roomName: roomName})
    })
    .then(response => {
        // Редирект на страницу списка комнат
        if(response.ok) {
            window.location.href = "/roomList.html";
        } else {
            console.error("Ошибка при отправке данных на сервер");
        }
    })
}

// Выделить цветом победную комбинацию
function highlightWinCombo(newCells, winner) {
    for (let i = 0; i < newCells.length; i++) {
        cells[i].textContent = newCells[i];
        if(cells[i].textContent === winner) {
            cells[i].classList.add('win')
        }
    }
}

