
const form_create_room = document.getElementById("create-room-form");

form_create_room.addEventListener("submit", createRoom);

function createRoom(e){
    e.preventDefault();
    console.log(localStorage.getItem('token'));
}