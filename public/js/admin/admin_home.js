const form_create_room = document.getElementById("btn-create-room");
const btn_create_room_qr = document.getElementById("btn-create-room-qr");
const btnUnirse = document.getElementById("btn-unirse");

if (form_create_room) {
    form_create_room.addEventListener("click", createRoom);
}

if (btn_create_room_qr) {
    btn_create_room_qr.addEventListener("click", createRoomWithQR);
}

if (btnUnirse) {
    btnUnirse.addEventListener("click", unirseSala);
}

async function createRoom(event) {
    event.preventDefault();
    if (!form_create_room || form_create_room.dataset.loading === "true") {
        return;
    }

    form_create_room.dataset.loading = "true";
    form_create_room.style.pointerEvents = "none";
    form_create_room.style.opacity = "0.7";
    const originalContent = form_create_room.innerHTML;
    const spanText = form_create_room.querySelector("span");
    if (spanText) {
        spanText.textContent = "Creando sala...";
    }

    try {
        const room = await fetch("/api/juego/crear");
        if (!room.ok) {
            throw new Error("Error en la solicitud de creación de sala");
        }
        const roomData = await room.json();

        if (!roomData || !roomData["id"]) {
            throw new Error("Respuesta inválida al crear la sala");
        }

        const response = await fetch(`/api/partidas/nueva`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_partida: roomData["id"]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || "Error al crear la partida en la base de datos");
        }

        const roomInfo = await response.json();
        console.log("Sala creada:", roomInfo);
        window.location.href = `/room/host/${roomData["id"]}?modo=normal`;
    } catch (error) {
        console.error("Error al crear la sala:", error);
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo crear la sala. Por favor, inténtalo de nuevo.",
                background: "#1A1A1A",
                color: "#fff"
            });
        } else {
            alert("No se pudo crear la sala. Por favor, inténtalo de nuevo.");
        }
        form_create_room.dataset.loading = "false";
        form_create_room.style.pointerEvents = "auto";
        form_create_room.style.opacity = "1";
        form_create_room.innerHTML = originalContent;
    }
}

async function createRoomWithQR(event) {
    event.preventDefault();
    if (!btn_create_room_qr || btn_create_room_qr.dataset.loading === "true") {
        return;
    }

    btn_create_room_qr.dataset.loading = "true";
    btn_create_room_qr.style.pointerEvents = "none";
    btn_create_room_qr.style.opacity = "0.7";
    const originalContent = btn_create_room_qr.innerHTML;
    const spanText = btn_create_room_qr.querySelector("span");
    if (spanText) {
        spanText.textContent = "Creando QR...";
    }

    try {
        const room = await fetch("/api/juego/crear");
        if (!room.ok) {
            throw new Error("Error en la solicitud de creación de sala con QR");
        }
        const roomData = await room.json();

        if (!roomData || !roomData["id"]) {
            throw new Error("Respuesta inválida al crear la sala con QR");
        }

        const response = await fetch(`/api/partidas/nueva-qr`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_partida: roomData["id"]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || "Error al crear la partida con QR en la base de datos");
        }

        const roomInfo = await response.json();
        console.log("Sala con QR creada:", roomInfo);
        window.location.href = `/room/host/${roomData["id"]}?modo=qr`;
    } catch (error) {
        console.error("Error al crear la sala con QR:", error);
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo crear la sala con QR. Por favor, inténtalo de nuevo.",
                background: "#1A1A1A",
                color: "#fff"
            });
        } else {
            alert("No se pudo crear la sala con QR. Por favor, inténtalo de nuevo.");
        }
        btn_create_room_qr.dataset.loading = "false";
        btn_create_room_qr.style.pointerEvents = "auto";
        btn_create_room_qr.style.opacity = "1";
        btn_create_room_qr.innerHTML = originalContent;
    }
}

async function unirseSala(event) {
    event.preventDefault();
    const inputRoom = document.getElementById("room-id");
    const roomId = inputRoom ? inputRoom.value.trim() : "";
    if (roomId) {
        window.location.href = `/room/user/${roomId}`;
    }
}
