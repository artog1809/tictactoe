const next = document.querySelector('.next');
next.addEventListener('click', identification);

// Идентификация пользователя
function identification() {
    const playerName = document.querySelector('.playerName');
    glName = playerName;
    // Отравить на сервер имя полученное из формы
    fetch("/ident", {
        method: "POST", 
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({name: playerName.value})
    })
    // Сделать редирект на страницу со списками комнат
    .then(response => {
        if(response.ok) {
            window.location.href = "/roomList.html";
        }  
        if(!response.ok) {
            console.error("Ошибка при отправке данных на сервер");
        }
    })
};
