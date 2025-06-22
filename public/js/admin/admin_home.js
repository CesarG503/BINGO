const form_create_room = document.getElementById("btn-create-room");
const btnUnirse = document.getElementById("btn-unirse");

form_create_room.addEventListener("click", createRoom);
btnUnirse.addEventListener("click", unirseSala);

async function createRoom(event) {
    event.preventDefault();
    const room = await fetch("https://bingo-api.mixg-studio.workers.dev/api/partida/nueva");
    const roomData = await room.json();

    if(!roomData || !roomData["id"]){
        console.error("Error al crear la sala");
        return;
    }

    const response = await fetch(`/api/partidas/nueva`,{
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
    window.location.href = `/room/host/${roomData["id"]}`;
}

async function unirseSala(event){
    event.preventDefault();
    const roomId = document.getElementById("room-id").value;
    window.location.href = `/room/${roomId}`;
    return;
}
