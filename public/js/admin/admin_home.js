import API_BASE_URL from './../util/base_url.js';

const form_create_room = document.getElementById("create-room-form");

form_create_room.addEventListener("submit", createRoom);

function createRoom(e){
    e.preventDefault();
    console.log(API_BASE_URL);
}