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

let currentJoinUrl = "";
let qrListenersAttached = false;

function getServerLanIpValue() {
  const serverLanIpEl = document.getElementById("server-lan-ip");
  let ip = serverLanIpEl ? serverLanIpEl.textContent.trim() : "";
  if (!ip) {
    const fallbackEl = document.getElementById("lan-ip");
    ip = fallbackEl ? fallbackEl.textContent.trim() : "";
  }
  if (ip && ip !== "localhost" && ip !== "127.0.0.1" && ip !== "::1") {
    return ip;
  }
  return "";
}

function isHostLocalhost() {
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function ensureAbsoluteUrl(url) {
  if (!url || typeof url !== "string") {
    return window.location.origin + "/";
  }
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `${window.location.protocol}${trimmed}`;
  }
  if (trimmed.startsWith("/")) {
    return `${window.location.origin}${trimmed}`;
  }
  return `${window.location.origin}/join/${encodeURIComponent(trimmed)}`;
}

function computeJoinUrl() {
  const roomIdElement = document.getElementById("id-room");
  const roomId = roomIdElement ? roomIdElement.textContent.trim() : "";
  if (!roomId) return "";

  const protocol = window.location.protocol.startsWith("http") ? window.location.protocol : "http:";
  const port = window.location.port ? `:${window.location.port}` : "";
  const detectedLanIp = getServerLanIpValue();

  let hostToUse = window.location.hostname;
  if (isHostLocalhost() && detectedLanIp) {
    hostToUse = detectedLanIp;
  }

  hostToUse = hostToUse.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (hostToUse.includes(":")) {
    hostToUse = hostToUse.split(":")[0];
  }

  const rawUrl = `${protocol}//${hostToUse}${port}/join/${encodeURIComponent(roomId)}`;
  return ensureAbsoluteUrl(rawUrl);
}

function renderQRCode(containerId, url, size) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const absoluteUrl = ensureAbsoluteUrl(url);
  container.innerHTML = "";
  try {
    if (typeof QRCode !== "undefined") {
      new QRCode(container, {
        text: absoluteUrl,
        width: size,
        height: size,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
    }
  } catch (err) {
    console.error(`Error al generar código QR en #${containerId}:`, err);
  }
}

function initQRCode() {
  const roomIdElement = document.getElementById("id-room");
  const roomId = roomIdElement ? roomIdElement.textContent.trim() : "";
  if (!roomId) {
    return;
  }

  currentJoinUrl = computeJoinUrl();

  const inputUrl = document.getElementById("qr-room-url");
  if (inputUrl) {
    inputUrl.value = currentJoinUrl;
  }

  const modalUrlText = document.getElementById("qr-modal-url-text");
  if (modalUrlText) {
    modalUrlText.textContent = currentJoinUrl;
  }

  renderQRCode("qrcode-display", currentJoinUrl, 180);

  const modalQrDisplay = document.getElementById("qrcode-modal-display");
  if (modalQrDisplay) {
    renderQRCode("qrcode-modal-display", currentJoinUrl, 320);
  }

  setupQRCodeListeners();
}

function setupQRCodeListeners() {
  if (qrListenersAttached) {
    return;
  }
  qrListenersAttached = true;

  async function copiarEnlaceActual() {
    const urlToCopy = currentJoinUrl || computeJoinUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(urlToCopy);
      } else {
        const aux = document.createElement("input");
        aux.setAttribute("value", urlToCopy);
        document.body.appendChild(aux);
        aux.select();
        document.execCommand("copy");
        document.body.removeChild(aux);
      }
      Swal.fire({
        icon: "success",
        title: "Enlace copiado",
        text: "El enlace de acceso se ha copiado al portapapeles.",
        timer: 1800,
        showConfirmButton: false,
        background: "#1A1A1A",
        color: "#fff",
      });
    } catch (err) {
      console.error("Error al copiar enlace:", err);
      Swal.fire({
        icon: "error",
        title: "Error al copiar",
        text: "No se pudo copiar automáticamente. Por favor copia el texto manualmente.",
        background: "#1A1A1A",
        color: "#fff",
      });
    }
  }

  const btnCopy = document.getElementById("btn-copy-link");
  if (btnCopy) {
    btnCopy.addEventListener("click", copiarEnlaceActual);
  }

  const btnCopyModal = document.getElementById("btn-copy-modal-link");
  if (btnCopyModal) {
    btnCopyModal.addEventListener("click", copiarEnlaceActual);
  }

  const modalZoomEl = document.getElementById("modalZoomQR");
  if (modalZoomEl) {
    modalZoomEl.addEventListener("shown.bs.modal", () => {
      renderQRCode("qrcode-modal-display", currentJoinUrl, 320);
    });
  }
}

function setupModoView() {
  const urlParams = new URLSearchParams(window.location.search);
  const modoParam = urlParams.get("modo");
  const modoElement = document.getElementById("modo-partida");
  const modoActual = (modoParam || (modoElement ? modoElement.textContent.trim() : "") || "normal").toLowerCase();

  const cardQr = document.getElementById("card-qr-container");
  const cardPlayers = document.getElementById("card-players-container");
  const btnToggle = document.getElementById("btn-toggle-qr");
  const btnToggleText = document.getElementById("btn-toggle-qr-text");

  function setNormalMode() {
    if (cardQr) {
      cardQr.classList.add("d-none");
      cardQr.classList.remove("animate__animated", "animate__fadeIn");
    }
    if (cardPlayers) {
      cardPlayers.className = "col-12 col-md-10 col-lg-8";
    }
    if (btnToggleText) {
      btnToggleText.textContent = "Activar Código QR";
    }
    if (btnToggle) {
      btnToggle.classList.remove("btn-info", "text-dark");
      btnToggle.classList.add("btn-outline-info");
    }
  }

  function setQRMode() {
    if (cardQr) {
      cardQr.classList.remove("d-none");
      cardQr.classList.add("animate__animated", "animate__fadeIn");
    }
    if (cardPlayers) {
      cardPlayers.className = "col-12 col-md-7 col-xl-6";
    }
    if (btnToggleText) {
      btnToggleText.textContent = "Ocultar Código QR";
    }
    if (btnToggle) {
      btnToggle.classList.remove("btn-outline-info");
      btnToggle.classList.add("btn-info", "text-dark");
    }
    initQRCode();
  }

  if (modoActual === "qr") {
    setQRMode();
  } else {
    setNormalMode();
  }

  // Asegurar inicialización de datos QR y listeners en ambos modos
  initQRCode();

  if (btnToggle) {
    btnToggle.addEventListener("click", () => {
      const isHidden = cardQr && cardQr.classList.contains("d-none");
      if (isHidden) {
        setQRMode();
      } else {
        setNormalMode();
      }
    });
  }
}

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
  const badgeJugadores = document.getElementById("badge-n-jugadores");
  if(badgeJugadores){
    badgeJugadores.textContent = usuarios.length;
  }

  // Renderizar la lista detallada de jugadores
  const jugadores_content = document.getElementById("jugadores_content");
  if (!jugadores_content) {
    console.error('No se encontró el contenedor con id "jugadores_content" en el DOM.');
    return;
  }
  jugadores_content.innerHTML = ""; // Limpiar la lista antes de renderizar

  usuarios.forEach((usuario) => {
    const datos_jugador = document.createElement("a");
    const img = document.createElement("img");
    const span = document.createElement("span");

    datos_jugador.classList.add("col-6", "col-sm-4", "col-md-3", "col-lg-2", "btn-custom", "w-100", "perfil");

    if (usuario.img_id) {
      img.src = `/img/Flork/${usuario.img_id}.jpg`;
    } else {
      // Fallback a un avatar con inicial si no hay img_id
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'user-avatar';
      avatarDiv.textContent = usuario.username.charAt(0).toUpperCase();
      datos_jugador.appendChild(avatarDiv);
    }
    
    img.alt = usuario.username;
    span.textContent = usuario.username;

    if (usuario.img_id) {
        datos_jugador.appendChild(img);
    }
    datos_jugador.appendChild(span);
    jugadores_content.appendChild(datos_jugador);
  });
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

  setupModoView()
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
    title: "<strong>¡Bingo!</strong>",
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

inicializar()
