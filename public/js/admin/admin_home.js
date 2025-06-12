import { API_BASE_URL } from "../util/base_url";

const form_create_room = document.getElementById("create-room-form");

form_create_room.addEventListener("submit", createRoom);

function createRoom(e){
    console.log(localStorage.getItem('userId'))
}