import { socket } from '/js/room/host_connection.js';

const tablaPatron = document.getElementById("tabla-bingo-patron");
const celdasPatron = tablaPatron ? tablaPatron.querySelectorAll("tbody td") : [];
const btnConfirmarPatron = document.getElementById("btn-confirmar-patron");

if (celdasPatron.length > 0) {
    celdasPatron.forEach(celda => {
        if (!celda.classList.contains("free-space")) {
            celda.addEventListener("click", () => {
                celda.classList.toggle("seleccionadotd");
            });
        }
    });
}

// Función para aplicar una matriz 5x5 a la tabla visual del host
export function aplicarPatronEnTabla(patron) {
    if (!tablaPatron || !patron || !Array.isArray(patron)) return;
    const filas = tablaPatron.querySelectorAll("tbody tr");

    filas.forEach((fila, i) => {
        if (!patron[i]) return;
        const celdas = fila.querySelectorAll("td");
        celdas.forEach((celda, j) => {
            if (i === 2 && j === 2) return; // casilla central FREE
            const val = patron[i][j];
            if (val === "1" || val === 1 || val === true) {
                celda.classList.add("seleccionadotd");
            } else {
                celda.classList.remove("seleccionadotd");
            }
        });
    });
}

// Cargar el patrón existente de la partida para que no se pierda al recargar
export async function cargarPatronExistente() {
    const idRoomEl = document.getElementById("id-room");
    if (!idRoomEl) return;
    const idPartida = idRoomEl.textContent.trim();
    if (!idPartida) return;

    try {
        const response = await fetch(`/api/partidas/${idPartida}`);
        if (!response.ok) return;
        const data = await response.json();
        if (data && data.patron_ganador) {
            aplicarPatronEnTabla(data.patron_ganador);
        }
    } catch (e) {
        console.warn("No se pudo cargar el patrón existente:", e);
    }
}

// Cargar de inmediato al inicializar el script
cargarPatronExistente();

// Función para obtener el patrón como matriz 5x5
export function obtenerPatronGanador() {
    if (!tablaPatron) return [];
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
if (btnConfirmarPatron) {
    btnConfirmarPatron.addEventListener("click", async () => { 
        if (!btnConfirmarPatron.textContent.includes("Confirmar")) { 
            return; // Salir si no es el botón "Confirmar Forma"
        }

        const idRoomEl = document.getElementById("id-room");
        if (!idRoomEl) return;
        const idPartida = idRoomEl.textContent.trim();
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
                const prevHtml = btnConfirmarPatron.innerHTML;
                btnConfirmarPatron.innerHTML = '<i class="fas fa-check-circle me-1 text-success"></i>¡Guardado!';
                setTimeout(() => {
                    btnConfirmarPatron.innerHTML = prevHtml;
                }, 2200);

                Swal.fire({
                    title: '¡Patrón Guardado!',
                    text: 'La forma ganadora ha sido confirmada.',
                    icon: 'success',
                    timer: 1600,
                    showConfirmButton: false,
                    background: '#1c1f2e',
                    color: '#fff',
                    customClass: { popup: 'swal-carton-ganador-popup' }
                });
                // Emitir el evento de socket para actualizar en tiempo real a los jugadores
                if (socket) {
                    socket.emit('patronActualizado', { id_room: idPartida, patron: patron });
                }
            } else {
                const errorData = await response.json();
                Swal.fire('Error', `No se pudo guardar el patrón: ${errorData.message || 'Error desconocido'}`, 'error');
            }
        } catch (error) {
            console.error('Error al enviar el patrón:', error);
            Swal.fire('Error de Conexión', 'Hubo un problema de red al guardar el patrón.', 'error');
        }
    });
}
