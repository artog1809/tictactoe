document.addEventListener('DOMContentLoaded', getRoomList);
const create = document.querySelector('.createRoom');
create.addEventListener('click', createRoom);
const rooms = [];
let namePlayer;

// Создать комнату
function createRoom() {
    const roomNameInput = document.querySelector('.roomName');
    const roomName = roomNameInput.value;
    // Отправить название комнаты и игроков на сервер
    fetch("/createRoom", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json" 
        },
        // Создать комнату отправив имя и игрока создавшего ее
        body: JSON.stringify({ roomName: roomName, players: [namePlayer] }) 
    })
    .then(response => {
        if(response.ok) {
            // Сделать редирект с параметром в адресе
            window.location.href = `/room.html?roomName=${encodeURIComponent(roomName)}`;
            getRoomList();
        } 
        if(!response.ok) {
            console.error("Невозможно создать комнату");
        }
    })
    .catch(error => {
        console.error("Произошла ошибка при создании комнаты:", error);
    });
}

// Создание верстки для создания комнаты
function createRoomWithName(name, count) {
    const roomDiv = document.createElement('div');
    roomDiv.textContent = name;
    roomDiv.classList.add('room');
    roomDiv.classList.add('available');
    const parentElement = document.querySelector('.roomList');
    if(parentElement) {
        parentElement.appendChild(roomDiv);
    } 
    if(!parentElement) {
        console.error("Родительский элемент не найден");
    }
    roomDiv.addEventListener('click', _ => {enterRoom(name)})
}


// Получить список комнат
function getRoomList() {
    fetch("/getRooms", {
        method: "GET"
    })
    .then(response => response.json())
    .then(data => {
        namePlayer = data.player;
        let serverRooms = [];
        // Получить названия комнат и количество игроков в каждой 
        data.rooms.forEach(room => {
            serverRooms.push({room:room.roomName, count:room.count});
        })
        // Проверить есть ли комнаты
        if (serverRooms.length > 0){
            deleteEmptyList();
            serverRooms.forEach(room => {
                // Если комната еще не отрисована
                if(!rooms.includes(room.room)) {
                    rooms.push(room.room);
                    createRoomWithName(room.room, room.count);
                }
                // Если количество игроков в комнате = 2
                if(room.count > 1) {
                    document.querySelector('.room').classList.add('full')
                }
            })
        }
        // Если комнат нет
        if (serverRooms.length == 0) {
            createEmptyList();
            deleteRooms();
        }
        setTimeout(getRoomList, 1000)
    })
}
// Войти в комнату
function enterRoom(roomName) {
    fetch("/enterRoom", {
        method: "POST",
        headers: {
            "ContentType" : "application/json"
        },
        // Отправить на сервер имя комнаты в которую заходит игрок и его имя
        body: JSON.stringify({roomName: roomName, player: namePlayer})
    })
    .then(response => { 
        if(response.ok){
            // При успешном ответе сделать редирект на страницу комнаты
            window.location.href = `/room.html?roomName=${encodeURIComponent(roomName)}`;
            console.log(`you join room ${roomName}`)
        }
    })
}

// Очистить верстку списка комнат
function deleteRooms() {
    document.querySelectorAll('.room').forEach(room => {
        const parentElement = document.querySelector('.roomList');
        parentElement.removeChild(room);
    })
}

// Создать сообщение об отсутствии комнат 
function createEmptyList() {
    const listDiv = document.createElement('div');
    listDiv.textContent = "Список комнат пуст";
    listDiv.classList.add('empty');
    const parentElement = document.querySelector('.roomList');
    if(parentElement) {
        if(parentElement.childElementCount < 1) {
            parentElement.appendChild(listDiv);
        }
    }  
    if(!parentElement) {
        console.error("Родительский элемент не найден");
    }
}

// Убрать сообщение об отсутствии комнат
function deleteEmptyList() {
    const empty = document.querySelector('.empty');
    if(empty) {
        const parentElement = document.querySelector('.roomList');
        parentElement.removeChild(empty);
    }
}

  
