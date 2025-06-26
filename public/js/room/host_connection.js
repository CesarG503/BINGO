import getCookieValue from "/js/util/get_cookie.js"
import { iniciarRuletazo, addBallGrid } from "/js/game/game.js"

const btnEliminar = document.querySelector("#btn-eliminar-sala a")
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

let socket

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
  const response = await fetch(`https://bingo-api.mixg-studio.workers.dev/api/partida/${id_room}/extraer`)
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
  const response = await fetch(`https://bingo-api.mixg-studio.workers.dev/api/partida/${id_room}`)
  if (!response.ok) {
    console.error("Error al obtener los números llamados")
    return
  }

  const data = await response.json()
  data.partida.numbers.forEach((numero) => {
    addBallGrid(numero)
  })
}

async function renderUsuariosEnSala() {
  const usuarios = await usuariosEnSala()
  if (!usuarios) {
    console.error("No se pudieron obtener los usuarios en la sala")
    return
  }
  jugadores.textContent = usuarios.length
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
    alert("No tienes permiso para administrar esta sala.")
    menssaje("Error", "La sala ya finalizo.", "error");
    window.location.href = "/"
    return
  }
  //Validacion de estado
  else if (sala.estado === 1) {
    activarControles(sala.id_partida, usuario.id_usuario)
  } else if (sala.estado !== 0) {
    menssaje("Error", "La sala ya finalizo.", "error");
    window.location.href = "/"
    return
  }

  renderUsuariosEnSala()

  const token = getCookieValue("token")
  if (!token) {
    menssaje("Error","Error inesperado, no posees un usuario valido.","error");
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

  if (btnIniciar) {
    btnIniciar.addEventListener("click", () => {
      iniciarSala(sala.id_partida, usuario.id_usuario)
    })
  }
  if (btnEliminar) {
    btnEliminar.addEventListener("click", async () => eliminarSala(sala.id_partida, usuario.id_usuario))
  }
  if (btnCerrar) {
    btnCerrar.addEventListener("click", () => eliminarSala(sala.id_partida, usuario.id_usuario))
  }
}

// Escuchar el botón
// Evento principal
document.getElementById('btnGanador').addEventListener('click', () => {
  // Datos de ejemplo
  const arreglo = [
    [11, 26, 41, 56, 71],
    [12, 27, 42, 57, 72],
    [13, 28, "FREE", 58, 73],
    [14, 29, 44, 59, 74],
    [15, 30, 45, 60, 75],
  ];
  const numerosSeleccionados = [13, 28, 58, 74, 75, 11, 73, 26, 27, 29, 30];
  const numerosGanadores = [15,29,57,71];

  jugadorGanador('Juan', arreglo, numerosSeleccionados, numerosGanadores);
});


// Mostrar alerta de ganador
function jugadorGanador(nombre, carton, numerosSeleccionados, numerosGanadores = []) {
  Swal.fire({
    title: "<strong>🎉 ¡Bingo! 🎉</strong>",
    width: 700,
    padding: "2.5em",
    background: "#1A1A1A",
    color: "#fff",
    html: `
      <div id="contenido-ganador" style="display: flex; flex-direction: column; align-items: center; color: #fff;">
        <img src="https://bingo-api.mixg-studio.workers.dev/api/profile/3"
             alt="Ganador"
             style="width: 120px; height: 120px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.2);" />
        <p style="font-size: 1.2em; margin: 0;">El jugador ganador es:</p>
        <h1 style="margin: 10px 0 20px; font-size: 2.2em; color: #48e;">${nombre}</h1>
        <div id="carton-render"></div>
      </div>
    `,
    showCloseButton: true,
    showConfirmButton: false,
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


function menssaje(titulo, texto, icono = null) {
  Swal.fire({
    title: titulo,
    text: texto,
    icon: icono,
  });
}
    
    
inicializar()