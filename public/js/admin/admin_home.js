import API_BASE_URL from "../util/base_url.js";

const form_create_room = document.getElementById("create-room-form");

form_create_room.addEventListener("submit", createRoom);

async function createRoom(event) {
    event.preventDefault();
    const room = await fetch("https://bingo-api.mixg-studio.workers.dev/api/partida/nueva");
    const roomData = await room.json();

    if(!roomData || !roomData["id"]){
        console.error("Error al crear la sala");
        return;
    }

    const response = await fetch(`${API_BASE_URL}/api/partidas/nueva`,{
        method: "POST",
        headers: {
            "Content-Type": "application/json"},
        body: JSON.stringify({
            id_partida: roomData["id"]
        })
    });

    if(!response.ok){
        console.error("Error al crear la partida en la base de datos:", await response.text());
        return;
    }
    const roomInfo = await response.json();
    console.log("Sala creada:", roomInfo);
    window.location.href = `/room/${roomData["id"]}`;
}


