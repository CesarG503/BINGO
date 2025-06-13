
const form_create_room = document.getElementById("create-room-form");

form_create_room.addEventListener("submit", createRoom);

function createRoom(e){
    e.preventDefault();
    console.log(localStorage.getItem('token'));
}

document.addEventListener("DOMContentLoaded", () => {
  autenticarRol()
})

function autenticarRol() {
    const token = localStorage.getItem("token")
    if (!token) {
        window.location.href = "login.html"
        return
    }
    try {
        const rol_usuario = JSON.parse(atob(token.split('.')[1]))
        if (rol_usuario.rol !== 0) {
            window.location.href = "index.html"
            return
        }
    } catch (e) {
        window.location.href = "login.html"
        return
    }
}