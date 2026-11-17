import getCookieValue from "/js/util/get_cookie.js"
import { iniciarRuletazo, addBallGrid } from "/js/game/game.js"

const btnEliminar = document.querySelector("#btn-eliminar-sala")
const btnCerrar = document.querySelector("#btn-cerrar-sala")
const btnIniciar = document.querySelector("#btn-iniciar-sala a")
const idRoom = document.getElementById("id-room")
export const btnNuevoNumero = document.getElementById("btn-new-number")
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

async function getNuevoNumero(id_room, id_host) {
  const response = await fetch(`/api/juego/extraer/${id_room}`)
  if (!response.ok) {
    console.error("Error al obtener un nuevo número")
    return
  }
  const data = await response.json()
  iniciarRuletazo(data.extraido, id_room, id_host)
}

export function emitirNumeroNuevo(numero, id_room, id_host) {
  socket.emit("getNuevoNumero", { extraido: numero, id_room: id_room, host: id_host })
}

async function renderNumerosLlamados(id_room) {
  const response = await fetch(`/api/juego/estado/${id_room}`)
  if (!response.ok) {
    console.error("Error al obtener los números llamados")
    return
  }

  const data = await response.json()
  data.numbers.forEach((numero) => {
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
      badge.innerHTML = "👑 Host";
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
  lobby.classList.add("visually-hidden")
  controles.classList.remove("visually-hidden")

  renderNumerosLlamados(id_room)

  btnNuevoNumero.addEventListener("click", async () => {
    btnNuevoNumero.disabled = true
    await getNuevoNumero(id_room, id_host)
  })
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
  else if (sala.estado === 1) {
    activarControles(sala.id_partida, usuario.id_usuario)
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
}

// Mostrar alerta de ganador
function jugadorGanador(usuario, carton, numerosSeleccionados, numerosGanadores = []) {
  Swal.fire({
    title: "<strong>🎉 ¡Bingo! 🎉</strong>",
    width: 700,
    padding: "2.5em",
    background: "#1A1A1A",
    color: "#fff",
    html: `
      <div id="contenido-ganador" style="display: flex; flex-direction: column; align-items: center; color: #fff;">
        <img src="/img/Flork/${usuario.img_id}.jpg"
             alt="Ganador"
             style="width: 120px; height: 120px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.2);" />
        <p style="font-size: 1.2em; margin: 0;">El jugador ganador es:</p>
        <h1 style="margin: 10px 0 20px; font-size: 2.2em; color: #48e;">${usuario.username}</h1>
        <div id="carton-render"></div>
      </div>
    `,
    showCloseButton: true,
    showConfirmButton: false,
    allowOutsideClick: false,
    didOpen: () => {
      const contenedor = document.getElementById("carton-render");
      // Pintar el cartón del ganador
      const cartonHTML = generarCartonHTML(carton, 0, numerosSeleccionados, numerosGanadores);
      contenedor.appendChild(cartonHTML);
    },
  });
}


// Crear el HTML del cartón
function generarCartonHTML(cartonData, index = 0, numerosSeleccionados = [], numerosGanadores = []) {
  const container = document.createElement("div");
  container.className = "tablas-numeros text-center";
  container.id = "carton-" + (index + 1);

  const carton = document.createElement("div");
  carton.className = "carton visible g-col-12 g-col-md-6 g-col-xl-4";
  carton.style.width = "100%";

  const table = document.createElement("table");
  table.className = "tabla-numeros";
  table.style.width = "100%";

  const letras = ["b", "i", "n", "g", "o"];

  // Encabezado
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");

  for (let i = 0; i < letras.length; i++) {
    const th = document.createElement("th");
    th.className = fondo[i] || ""; // Por si fondo[i] no existe
    const div = document.createElement("div");
    div.className = "bola bola-" + letras[i];
    div.textContent = letras[i].toUpperCase();
    th.appendChild(div);
    trHead.appendChild(th);
  }

  thead.appendChild(trHead);
  table.appendChild(thead);

  // Cuerpo de tabla
  const tbody = document.createElement("tbody");
  for (let i = 0; i < cartonData.length; i++) {
    const tr = document.createElement("tr");
    for (let j = 0; j < cartonData[i].length; j++) {
      const td = document.createElement("td");
      const valor = cartonData[i][j];
      td.textContent = valor;
      td.setAttribute("data-valor", valor);
      td.className = "seleccionable";

      // Estilo si fue seleccionado
      if (numerosSeleccionados.includes(valor)) {
        td.style.backgroundColor = "#F9F2F2";
        td.style.color = "black";
        td.style.fontWeight = "bold";
      }

      // Pintar "FREE" al centro (3,3)
      if (valor === "FREE") {
        td.style.backgroundColor = "#F9F2F2";
        td.style.color = "black";
        td.style.fontWeight = "bold";
      }

      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  carton.appendChild(table);
  container.appendChild(carton);

  // Pintar ganadores
  pintarGanadores(container, numerosGanadores);

  return container;
}


function pintarGanadores(cartonElement, numerosGanadores = []) {
  const celdas = cartonElement.querySelectorAll("td[data-valor]");

  celdas.forEach((td) => {
    const valor = td.getAttribute("data-valor");

    // Pintar si el valor está en los ganadores
    if (valor !== "FREE" && numerosGanadores.includes(Number(valor))) {
      td.style.backgroundColor = "orange";
      td.style.color = "black";
      td.style.fontWeight = "bold";
      td.style.border = "2px solid #333";
    }

    // Pintar "FREE" solo si hay 4 ganadores (FREE completa la línea)
    if (valor === "FREE" && numerosGanadores.length === 4) {
      td.style.backgroundColor = "orange";
      td.style.color = "black";
      td.style.fontWeight = "bold";
      td.style.border = "2px solid #333";
    }
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

// Cargar o regenerar QR si no viene renderizado del servidor
async function checkOrGenerateQR() {
  const qrImg = document.getElementById("qr-code-img");
  if (qrImg && (!qrImg.getAttribute("src") || qrImg.getAttribute("src") === "")) {
    try {
      const idPartida = idRoom.textContent.trim();
      const response = await fetch(`/api/qr/${idPartida}`);
      if (response.ok) {
        const data = await response.json();
        if (data.qr_code) {
          qrImg.src = data.qr_code;
        }
      }
    } catch (e) {
      console.warn("No se pudo cargar el QR secundario:", e);
    }
  }
}

checkOrGenerateQR();
    
inicializar()
