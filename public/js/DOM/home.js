const roomId = document.getElementById("room-id");
const btnJoinRoom = document.getElementById("btn-unirse");

btnJoinRoom.addEventListener("click", () => {
    const id = roomId.value.trim();
    if (id === "") {
        alert("Por favor, ingresa un ID de sala válido.");
        return;
    }
    window.location.href = `/room/${id}`;
});