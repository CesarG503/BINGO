import getCookieValue from "/js/util/get_cookie.js"
import { iniciarRuletazo, addBallGrid } from "/js/game/game.js"
import { generarCartonGanadorDOM, mostrarModalBolasExtraidas } from "/js/util/bingo_helper.js"

const btnEliminar = document.querySelector("#btn-eliminar-sala")
const btnCerrar = document.querySelector("#btn-cerrar-sala")
const btnIniciar = document.querySelector("#btn-iniciar-sala a")
const idRoom = document.getElementById("id-room")
export const btnNuevoNumero = document.getElementById("btn-new-number")
const btnVerBolasHost = document.getElementById("btn-ver-bolas-host")
const jugadores = document.getElementById("n-jugadores")
const controles = document.getElementById("game-controls")
const lobby = document.getElementById("waiting-room")
const fondo = [
  "bg-primary",
  "bg-success",
  "bg-info",
  "bg-warning",
  "bg-danger",
];

export let socket
export let listaNumerosLlamadosHost = []
let juegoTerminadoHost = false
let datosGanadorHost = null

async function getSala() {
  const response = await fetch(`/api/partidas/${idRoom.textContent}`)
  if (!response.ok) {
    console.error("Error al obtener la sala")
    return
  }
  return await response.json()
}

async function getUsuario() {
  const response = await fetch(`/api/usuarios/actual`)
  if (!response.ok) {
    console.log("Error al obtener el usuario actual")
    return null
  }
  return await response.json()
}

function actualizarBadgeBolasHost() {
  const badge = document.getElementById("host-bolas-badge")
  if (badge) {
    badge.textContent = listaNumerosLlamadosHost.length
  }
}

async function getNuevoNumero(id_room, id_host) {
  const response = await fetch(`/api/juego/extraer/${id_room}`)
  if (!response.ok) {
    console.error("Error al obtener un nuevo número")
    return
  }
  const data = await response.json()
  const num = Number(data.extraido)
  if (!isNaN(num) && !listaNumerosLlamadosHost.includes(num)) {
    listaNumerosLlamadosHost.push(num)
    actualizarBadgeBolasHost()
  }
  iniciarRuletazo(data.extraido, id_room, id_host)
}

export function emitirNumeroNuevo(numero, id_room, id_host) {
  const num = Number(numero)
  if (!isNaN(num) && !listaNumerosLlamadosHost.includes(num)) {
    listaNumerosLlamadosHost.push(num)
    actualizarBadgeBolasHost()
  }
  socket.emit("getNuevoNumero", { extraido: numero, id_room: id_room, host: id_host })
}

async function renderNumerosLlamados(id_room) {
  const response = await fetch(`/api/juego/estado/${id_room}`)
  if (!response.ok) {
    console.error("Error al obtener los números llamados")
    return
  }

  const data = await response.json()
  const nums = data.numbers || data.numeros_llamados || []
  listaNumerosLlamadosHost = nums.map(n => Number(n)).filter(n => !isNaN(n))
  actualizarBadgeBolasHost()
  nums.forEach((numero) => {
    addBallGrid(numero)
  })
}

async function renderUsuariosEnSala() {
  const usuarios = await usuariosEnSala();
  if (!usuarios) {
    console.error("No se pudieron obtener los usuarios en la sala");
    return;
  }
  
  // Actualizar el contador de jugadores
  const contadorJugadores = document.getElementById("n-jugadores");
  if(contadorJugadores){
    contadorJugadores.textContent = usuarios.length;
  }
  const countNumber = document.getElementById("count-number");
  if (countNumber) {
    countNumber.textContent = `${usuarios.length} Jugador${usuarios.length === 1 ? '' : 'es'}`;
  }

  // Renderizar la lista detallada de jugadores
  const jugadores_content = document.getElementById("jugadores_content");
  if (!jugadores_content) {
    console.error('No se encontró el contenedor con id "jugadores_content" en el DOM.');
    return;
  }
  jugadores_content.innerHTML = ""; // Limpiar la lista antes de renderizar

  let currentUser = null;
  try {
    currentUser = await getUsuario();
  } catch (e) {}

  let sala = null;
  try {
    sala = await getSala();
  } catch (e) {}

  usuarios.forEach((usuario) => {
    const isHost = sala && (sala.host === usuario.id_usuario || usuario.rol === 0);
    const isMe = currentUser && (currentUser.id_usuario === usuario.id_usuario);

    const chip = document.createElement("div");
    chip.className = `player-chip ${isHost ? 'is-host' : ''} ${isMe ? 'is-me' : ''}`;
    chip.setAttribute("data-username", (usuario.username || "").toLowerCase());
    chip.title = `${usuario.username}${isHost ? ' (Host)' : ''}${isMe ? ' (Tú)' : ''}`;

    const img = document.createElement("img");
    img.className = "player-chip-avatar";
    img.src = usuario.img_id ? `/img/Flork/${usuario.img_id}.jpg` : "/img/Flork/1.jpg";
    img.alt = usuario.username || "Jugador";
    img.onerror = () => { img.src = "/img/Flork/1.jpg"; };

    const info = document.createElement("div");
    info.className = "player-chip-info";

    const name = document.createElement("span");
    name.className = "player-chip-name";
    name.textContent = usuario.username || "Sin nombre";

    info.appendChild(name);

    if (isHost) {
      const badge = document.createElement("span");
      badge.className = "player-chip-badge badge-host";
      badge.innerHTML = '<i class="fas fa-crown text-warning me-1"></i>Host';
      info.appendChild(badge);
    } else if (isMe) {
      const badge = document.createElement("span");
      badge.className = "player-chip-badge badge-me";
      badge.textContent = "Tú";
      info.appendChild(badge);
    }

    chip.appendChild(img);
    chip.appendChild(info);
    jugadores_content.appendChild(chip);
  });

  // Configurar buscador en tiempo real si aún no está enlazado
  const searchInput = document.getElementById("player-search");
  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = "true";
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      const chips = jugadores_content.querySelectorAll(".player-chip");
      let visible = 0;
      chips.forEach((c) => {
        const uName = c.getAttribute("data-username") || "";
        if (!term || uName.includes(term)) {
          c.style.display = "flex";
          visible++;
        } else {
          c.style.display = "none";
        }
      });

      let noMatch = document.getElementById("no-players-search-msg");
      if (visible === 0) {
        if (!noMatch) {
          noMatch = document.createElement("div");
          noMatch.id = "no-players-search-msg";
          noMatch.className = "no-players-match";
          noMatch.textContent = "No se encontraron jugadores que coincidan.";
          jugadores_content.appendChild(noMatch);
        }
      } else if (noMatch) {
        noMatch.remove();
      }
    });
  }
}

async function usuariosEnSala() {
  const response = await fetch(`/api/partidas/${idRoom.textContent}/usuarios`)
  if (!response.ok) {
    console.error("Error al obtener los usuarios en la sala")
    return
  }
  return await response.json()
}

async function eliminarSala(id_room, id_usuario) {
  const response = await fetch(`/api/partidas/${id_room}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    console.error("Error al eliminar la sala")
    alert("No se obtuvo una respuesta valida del servidor.")
    return
  }

  const result = await response.json()
  if (result.success) {
    socket.emit("salaEliminada", {
      id_room: id_room,
      host: id_usuario,
    })
    socket.disconnect()
    window.location.href = "/" // Redireccionar a la página de inicio
  } else {
    alert("No se pudo eliminar la sala. Inteténtalo de nuevo más tarde.")
  }
}

async function iniciarSala(id_room, id_usuario) {
  const response = await fetch(`/api/partidas/${id_room}/estado`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ estado: 1 }), // Cambiar el estado a 1 (iniciado)
  })

  if (!response.ok) {
    console.error("Error al iniciar la sala")
    alert("No se pudo iniciar la sala. Inténtalo de nuevo.")
    console.log(await response.text())
    return
  }

  socket.emit("iniciarSala", {
    id_room: id_room,
    host: id_usuario,
  })
}

async function activarControles(id_room, id_host) {
  document.body.classList.add("host-playing")
  lobby.classList.add("visually-hidden")
  controles.classList.remove("visually-hidden")

  renderNumerosLlamados(id_room)

  if (!btnNuevoNumero.dataset.bound) {
    btnNuevoNumero.dataset.bound = "true"
    btnNuevoNumero.addEventListener("click", async () => {
      btnNuevoNumero.disabled = true
      await getNuevoNumero(id_room, id_host)
    })
  }
}

async function inicializar() {
  const sala = await getSala()
  const usuario = await getUsuario()
  if (!usuario) {
    console.error("No se pudo obtener el usuario actual")
    return
  }

  if (!sala) {
    console.error("No se pudo obtener la sala")
    window.location.href = "/"
    return
  }

  //Validacion de host
  if (sala.host !== usuario.id_usuario) {
    await menssaje("Error", "No tienes permiso para administrar esta sala.", "error");
    window.location.href = "/"
    return
  }
  //Validacion de estado
  if (sala.estado === 1) {
    activarControles(sala.id_partida, usuario.id_usuario)
  } else if (sala.estado === 2) {
    activarControles(sala.id_partida, usuario.id_usuario)
    mostrarEstadoFinalizadoHost(sala)
  } else if (sala.estado !== 0) {
    await menssaje("Error", "La sala ya finalizo.", "error");
    window.location.href = "/"
    return
  }

  renderUsuariosEnSala()

  const token = getCookieValue("token")
  if (!token) {
    await menssaje("Error","Error inesperado, no posees un usuario valido.","error");
  }
  socket = io({ auth: { token } }) // Usar la variable global

  socket.emit("unirseSala", sala.id_partida)

  socket.on("nuevoUsuario", (data) => {
    renderUsuariosEnSala()
  })

  socket.on("usuarioAbandono", () => {
    renderUsuariosEnSala(sala.id_partida)
  })

  socket.on("inicioSala", () => {
    activarControles(sala.id_partida, usuario.id_usuario)
  })

  socket.on("ganador", (data) => {
    if (juegoTerminadoHost && Swal.isVisible()) return; // Prevenir spam de popups
    juegoTerminadoHost = true;
    datosGanadorHost = data;
    mostrarEstadoFinalizadoHost({
      ganador_username: data.ganador ? data.ganador.username : "Jugador",
      ganador: data.ganador ? data.ganador.id_usuario : null
    });
    jugadorGanador(data.ganador, data.carton, data.numerosSeleccionados, data.numerosGanadores);
  });

  if (btnIniciar) {
    btnIniciar.addEventListener("click", () => {
      iniciarSala(sala.id_partida, usuario.id_usuario)
    })
  }
  if (btnEliminar) {
    btnEliminar.addEventListener("click", async () => {
      const confirmar = await cuestion("¿Estás seguro de eliminar la sala?");
      if (confirmar) {
        eliminarSala(sala.id_partida, usuario.id_usuario);
      }
    });
  }
  if (btnCerrar) {
    btnCerrar.addEventListener("click", async () => {
      const confirmar = await cuestion("¿Estás seguro de eliminar la sala?");
      if (confirmar) {
        eliminarSala(sala.id_partida, usuario.id_usuario);
      }
    })
  }

  if (btnVerBolasHost) {
    btnVerBolasHost.addEventListener("click", () => {
      mostrarModalBolasExtraidas(listaNumerosLlamadosHost, "Historial de Bolas Extraídas");
    });
  }
}

function mostrarEstadoFinalizadoHost(sala) {
  juegoTerminadoHost = true;
  if (btnNuevoNumero) {
    btnNuevoNumero.disabled = true;
    btnNuevoNumero.textContent = "Partida Finalizada";
    btnNuevoNumero.classList.remove("btn-success");
    btnNuevoNumero.classList.add("btn-secondary");
  }

  const banner = document.getElementById("host-banner-ganador");
  const nombreGanador = document.getElementById("host-ganador-nombre");
  if (banner) {
    banner.classList.remove("d-none");
    if (nombreGanador) {
      const gName = sala.ganador_username || (datosGanadorHost && datosGanadorHost.ganador && datosGanadorHost.ganador.username) || "Jugador";
      nombreGanador.innerHTML = `Ganador: <strong class="text-warning">${gName}</strong>`;
    }
  }

  const btnVerCarton = document.getElementById("btn-ver-carton-ganador");
  if (btnVerCarton) {
    btnVerCarton.onclick = () => {
      if (datosGanadorHost) {
        jugadorGanador(
          datosGanadorHost.ganador,
          datosGanadorHost.carton,
          datosGanadorHost.numerosSeleccionados,
          datosGanadorHost.numerosGanadores
        );
      } else {
        menssaje("Información", `El ganador de esta partida fue ${sala.ganador_username || 'un jugador'}.`, "info");
      }
    };
  }

  const btnBannerBolas = document.getElementById("btn-banner-ver-bolas");
  if (btnBannerBolas) {
    btnBannerBolas.onclick = () => {
      mostrarModalBolasExtraidas(listaNumerosLlamadosHost, "Historial de Bolas Extraídas");
    };
  }
}

// Mostrar alerta de ganador con cartón y opción de revisar bolas
function jugadorGanador(usuario, carton, numerosSeleccionados, numerosGanadores = []) {
  Swal.fire({
    title: "<strong>🎉 ¡Bingo! 🎉</strong>",
    width: "min(94vw, 560px)",
    padding: "1.25em 0.75em",
    background: "#1c1f2e",
    color: "#fff",
    customClass: {
      popup: "swal-carton-ganador-popup"
    },
    html: `
      <div id="contenido-ganador" style="display: flex; flex-direction: column; align-items: center; color: #fff; width: 100%;">
        <img src="/img/Flork/${usuario.img_id || 1}.jpg"
             alt="Ganador"
             onerror="this.src='/img/Flork/1.jpg'"
             style="width: 85px; height: 85px; border-radius: 50%; margin-bottom: 12px; border: 3px solid #00ff88; box-shadow: 0 0 15px rgba(0,255,136,0.4);" />
        <p style="font-size: 1.05em; margin: 0; color: #94a3b8;">El jugador ganador es:</p>
        <h2 style="margin: 6px 0 14px; font-size: 1.8em; color: #00f0ff; font-weight: bold;">${usuario.username}</h2>
        <div id="carton-render" style="width: 100%; display: flex; justify-content: center;"></div>
        <div class="mt-3">
          <button id="btn-swal-ver-bolas" class="btn btn-outline-info btn-sm">
            <i class="fas fa-list-ol me-2"></i>Ver Bolas Extraídas (${listaNumerosLlamadosHost.length})
          </button>
        </div>
      </div>
    `,
    showCloseButton: true,
    showConfirmButton: true,
    confirmButtonText: "Entendido",
    confirmButtonColor: "#059669",
    allowOutsideClick: true,
    didOpen: () => {
      const contenedor = document.getElementById("carton-render");
      if (contenedor && carton) {
        const cartonDOM = generarCartonGanadorDOM(carton, numerosSeleccionados, numerosGanadores);
        contenedor.appendChild(cartonDOM);
      }
      const btnBolas = document.getElementById("btn-swal-ver-bolas");
      if (btnBolas) {
        btnBolas.addEventListener("click", () => {
          mostrarModalBolasExtraidas(listaNumerosLlamadosHost, "Historial de Bolas Extraídas");
        });
      }
    },
  });
}

async function menssaje(titulo, texto, icono = null) {
  await Swal.fire({
    title: titulo,
    text: texto,
    icon: icono,
  });
}

async function cuestion(texto) {
  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: "btn btn-success",
      cancelButton: "btn btn-danger",
    },
    buttonsStyling: false,
  });

  const result = await swalWithBootstrapButtons.fire({
    title: "¿Estás seguro?",
    text: texto,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "No, cancelar",
    reverseButtons: true,
  });

  return result.isConfirmed;
}

// Cargar o regenerar QR si no viene renderizado del servidor o si el origen cambió
async function checkOrGenerateQR() {
  const qrImg = document.getElementById("qr-code-img");
  const joinInput = document.getElementById("join-url-input");
  const idPartida = idRoom ? idRoom.textContent.trim() : "";

  if (!idPartida) return;

  const currentJoinUrl = joinInput ? joinInput.value.trim() : "";
  const clientOrigin = window.location.origin;

  // Detectar si el QR no tiene imagen o si apunta a localhost mientras el navegador accede desde otra IP o dominio
  const hasEmptyQR = !qrImg || !qrImg.getAttribute("src") || qrImg.getAttribute("src") === "";
  const isUrlLocalhost = currentJoinUrl.includes("localhost") || currentJoinUrl.includes("127.0.0.1");
  const isClientRemote = !clientOrigin.includes("localhost") && !clientOrigin.includes("127.0.0.1");
  const needsSync = hasEmptyQR || (isUrlLocalhost && isClientRemote);

  if (needsSync) {
    try {
      const response = await fetch(`/api/qr/${idPartida}?origin=${encodeURIComponent(clientOrigin)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.qr_code && qrImg) {
          qrImg.src = data.qr_code;
        }
        if (data.join_url && joinInput) {
          joinInput.value = data.join_url;
        }
      }
    } catch (e) {
      console.warn("No se pudo regenerar el QR adaptativo:", e);
    }
  }

  // Manejar botón para copiar enlace de invitación
  const btnCopy = document.getElementById("btn-copy-join-url");
  if (btnCopy && joinInput) {
    btnCopy.addEventListener("click", async () => {
      const urlToCopy = joinInput.value.trim() || `${window.location.origin}/join/${idPartida}`;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(urlToCopy);
        } else {
          joinInput.select();
          document.execCommand("copy");
        }

        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "success",
            title: "¡Enlace copiado!",
            text: urlToCopy,
            timer: 2000,
            showConfirmButton: false,
            background: "#1A1A1A",
            color: "#fff"
          });
        } else {
          alert(`¡Enlace copiado!\n${urlToCopy}`);
        }
      } catch (err) {
        console.error("Error al copiar enlace:", err);
      }
    });
  }
}

checkOrGenerateQR();
    
inicializar()
