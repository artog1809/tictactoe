const next = document.querySelector('.next');
next.addEventListener('click', identification);

function identification() {
    const playerName = document.querySelector('.playerName');
    glName = playerName;
    fetch("/ident", {
        method: "POST", 
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({name: playerName.value})
    })
    .then(response => {
        if(response.ok) {
            window.location.href = "/roomList.html";
        } else {
            console.error("Ошибка при отправке данных на сервер");
        }
    })
};
