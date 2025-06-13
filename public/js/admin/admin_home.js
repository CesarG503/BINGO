import API_BASE_URL from './../util/base_url.js';
import getCookieValue from './../util/get_cookie.js';

const form_create_room = document.getElementById("create-room-form");

form_create_room.addEventListener("submit", createRoom);

function createRoom(e){
    e.preventDefault();
    console.log(API_BASE_URL);
    const token = getCookieValue("token");
    if(!token){
        alert("No tienes permiso para crear una sala. Por favor, inicia sesión.");
        return;
    }
    const socket = io({
        auth: {
            token
        }
    });

    socket.emit("crearSala", {
        sala: "test"
    });
}

