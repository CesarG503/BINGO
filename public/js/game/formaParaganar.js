import { socket } from '/js/room/host_connection.js';

const tablaPatron = document.getElementById("tabla-bingo-patron");
const celdasPatron = tablaPatron.querySelectorAll("tbody td");
const btnConfirmarPatron = document.getElementById("btn-confirmar-patron");


celdasPatron.forEach(celda => {
    if (!celda.classList.contains("free-space")) {
        celda.addEventListener("click", () => {
            console.log("funciona");
            celda.classList.toggle("seleccionadotd");
        });
    }
});

// Función para obtener el patrón como matriz 5x5
function obtenerPatronGanador() {
    const patron = [];
    const filas = tablaPatron.querySelectorAll("tbody tr");

    filas.forEach((fila, i) => {
        patron[i] = [];
        const celdas = fila.querySelectorAll("td");
        celdas.forEach((celda, j) => {
            
            // Si es la casilla central (2, 2), siempre es '0'
            if (i === 2 && j === 2) {
                patron[i].push("0");
            } else {
                // Para las demás casillas, usa la clase 'seleccionadotd'
                const isSelected = celda.classList.contains("seleccionadotd");
                patron[i].push(isSelected ? "1" : "0");
            }
            
        });
    });
    return patron;
}

// Listener para enviar el patrón al servidor
btnConfirmarPatron.addEventListener("click", async () => { 

    
    if (btnConfirmarPatron.textContent.trim() !== "Confirmar Forma") { 
        return; // Salir si no es el botón "Confirmar Forma" (evita que el botón "NUEVA BOLA" haga esto)
    }

    const idPartida = document.getElementById("id-room").textContent.trim();
    const patron = obtenerPatronGanador();

    try {
        const response = await fetch(`/api/partida/patron/${idPartida}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ patron: patron })
        });

        if (response.ok) {
            Swal.fire('¡Patrón Guardado!', 'La forma ganadora ha sido confirmada.', 'success');
            // Emitir el evento de socket para actualizar en tiempo real
            if (socket) {
                socket.emit('patronActualizado', { id_room: idPartida, patron: patron });
            }
            // Deshabilitar la selección después de confirmar para evitar cambios accidentales
            celdasPatron.forEach(celda => celda.removeEventListener("click", this));
        } else {
            const errorData = await response.json();
            Swal.fire('Error', `No se pudo guardar el patrón: ${errorData.message}`, 'error');
        }
    } catch (error) {
        console.error('Error al enviar el patrón:', error);
        Swal.fire('Error de Conexión', 'Hubo un problema de red al guardar el patrón.', 'error');
    }
});