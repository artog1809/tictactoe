document.addEventListener('DOMContentLoaded', getRoomList);
const create = document.querySelector('.createRoom');
const refresh = document.querySelector('.refreshList')
create.addEventListener('click', createRoom);
refresh.addEventListener('click', getRoomList);
const rooms = [];
let namePlayer;

function createRoom() {
    const roomNameInput = document.querySelector('.roomName');
    const roomName = roomNameInput.value;
    fetch("/createRoom", {
        method: "POST",
        headers: {
            "Content-Type": "application/json" // Исправлено на "Content-Type"
        },
        body: JSON.stringify({ roomName: roomName, players: [namePlayer] }) // Исправлено на roomName
    })
    .then(response => {
        if(response.ok) {
            // rooms.push(roomName); // Это можно закомментировать, если rooms уже обновляется при получении списка комнат
            window.location.href = `/room.html?roomName=${encodeURIComponent(roomName)}`; // Перенаправление с параметром roomName
            getRoomList();
        } else {
            console.error("Невозможно создать комнату");
        }
    })
    .catch(error => {
        console.error("Произошла ошибка при создании комнаты:", error);
    });
}


function createRoomWithName(name) {
    console.log("created room with name: " + name);
    const roomDiv = document.createElement('div');
    roomDiv.textContent = name;
    roomDiv.classList.add('room');
    const parentElement = document.querySelector('.list');
    if(parentElement) {
        parentElement.appendChild(roomDiv);
    } else {
        console.error("Родительский элемент не найден");
    }
    roomDiv.addEventListener('click', _ => {enterRoom(name)})
}


function getRoomList() {
    // debugger
    fetch("/getRooms", {
        method: "GET"
    })
    .then(response => response.json())
    .then(data => {
        namePlayer = data.player;
        let serverRooms = [];
        data.rooms.forEach(room => {
            serverRooms.push(room);
        })

        serverRooms.forEach(room => {
            if(rooms.includes(room)) {
                console.log(`Элемент '${room}' присутствует в обоих массивах.`);
            } else {
                rooms.push(room);
                createRoomWithName(room);
            }
        })
    })
}

function enterRoom(roomName) {
    fetch("/enterRoom", {
        method: "POST",
        headers: {
            "ContentType" : "application/json"
        },
        body: JSON.stringify({roomName: roomName, player: namePlayer})
    })
    .then(response => { 
        if(response.ok){
            window.location.href = `/room.html?roomName=${encodeURIComponent(roomName)}`;
            console.log(`you join room ${roomName}`)
        }
    })
}

  
