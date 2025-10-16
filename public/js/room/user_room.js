import getCookieValue from "/js/util/get_cookie.js"
const btnAbandonar = document.getElementById("btn-abandonar-sala")
const espera = document.getElementById("espera")
const tablero = document.getElementById("tablero")
const numerosLlamados = document.getElementById("numeros-llamados")
const numeroActual = document.getElementById("numero-actual")
const idRoom = document.getElementById("idRoom")

const btnBingo = document.getElementById("btnBingo")

btnBingo.addEventListener("click", async () => {
  const tabla = document.querySelector(".swiper-slide-active table");
  if (!tabla) {
    console.warn("No se encontró la tabla activa.");
    return;
  }

  const carton = [];
  const seleccionados = [];

  const filas = tabla.querySelectorAll("tbody tr");

  filas.forEach((tr) => {
    const fila = [];
    const celdas = tr.querySelectorAll("td");

    celdas.forEach((td) => {
      const valor = td.getAttribute("data-number");

      // Guardar el valor en la matriz del cartón
      fila.push(valor === "FREE" ? "FREE" : Number(valor));

      // Si tiene clase seleccionada, lo guardamos
      if (td.classList.contains("bolaSeleccionada") && valor !== "FREE") {
        seleccionados.push(Number(valor));
      }
    });

    carton.push(fila);
  });
  const send_usuario = await getUsuario();

  callBingo(carton, seleccionados, idRoom.textContent, send_usuario);
});


let socket
let ganador = false;
let selectedCartones = []

btnAbandonar.addEventListener("click", () => {
  abandonarSala()
})

document.addEventListener("DOMContentLoaded", async (event) => {
  const sala = await getSala(idRoom.textContent)
  if (!sala) {
    console.error("No se pudo obtener la sala")
    window.location.href = "/"
    return
  }
})

// Agregar esta función después de loadSelectedCartones
async function saveCartonesToPartida(id_room) {
  if (selectedCartones.length === 0) return

  try {
    const response = await fetch(`/api/partidas/${id_room}/usuario/cartones`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_cartones: selectedCartones,
      }),
    })

    if (response.ok) {
      console.log("Cartones guardados en la partida")
    }
  } catch (error) {
    console.error("Error guardando cartones en la partida:", error)
  }
}

// Agregar esta función para cargar cartones desde la partida
async function loadCartonesFromPartida(id_room) {
  try {
    const response = await fetch(`/api/partidas/${id_room}/usuario/cartones`, {
      credentials: "include",
    })

    if (response.ok) {
      const data = await response.json()
      if (data.id_cartones && data.id_cartones.length > 0) {
        selectedCartones = data.id_cartones
        await displaySelectedCartones()
        return true
      }
    }
  } catch (error) {
    console.error("Error cargando cartones de la partida:", error)
  }
  return false
}

async function unirseSala() {
  const token = getCookieValue("token")
  if (!token) {
    await menssaje("Error", "no posees un usuario valido", "error");
    return
  }
  const usuario = await getUsuario()
  if (!usuario) {
    console.error("No se pudo obtener el usuario actual")
    return
  }

  const sala = await getSala(idRoom.textContent)

  if (!sala) {
    console.error("No se pudo obtener la sala")
    window.location.href = "/"
    return
  }

  if (sala.host == usuario.id_usuario) {
    window.location.href = `/room/host/${sala.id_partida}`
    return
  }

  const registrado = await usuarioRegistrado(sala.id_partida)

  if (sala.estado === 1 && registrado) {
    // Si la partida ya comenzó, cargar cartones desde la BD
    const cartonesLoaded = await loadCartonesFromPartida(sala.id_partida)
    if (!cartonesLoaded) {
      // Si no hay cartones guardados, cargar desde localStorage
      await loadSelectedCartones()
    }
    activarControles(sala.id_partida)
  } else if (sala.estado !== 0) {
    await menssaje("Error", "La sala ya ha comenzado o ya finalizo.", 'error');
    window.location.href = "/"
    return
  } else {
    // Cargar cartones desde localStorage para sala en espera
    await loadSelectedCartones()
    if (localStorage.getItem("penalizacion")) {
      localStorage.removeItem("penalizacion") 
    }
    crearLocalStorage();
  }

  const registro = await registrarseSala(sala.id_partida)

  if (!registro) {
    console.error("Error al registrarse en la sala")
    return
  }

  let timing = localStorage.getItem("penalizacion")
  if(timing){
    penalizacion(timing);
  }

  socket = io({ auth: { token } }) // Usar la variable global
  socket.emit("unirseSala", sala.id_partida)

  if (registro.registrado) {
    socket.emit("nuevoUsuario", {
      id_room: sala.id_partida,
      username: usuario.username,
      img_id: usuario.img_id,
    })
  }

  socket.on("salaEliminada", async (err) => {
    await menssaje("error", "La sala ha sido cerrada por el administrador.", 'error');
    socket.disconnect()
    window.location.href = "/"
  })

  socket.on("nuevoUsuario", (data) => {
    renderUsuariosEnSala(sala.id_partida)
  })

  socket.on("usuarioAbandono", () => {
    renderUsuariosEnSala(sala.id_partida)
  })

  socket.on("inicioSala", async (data) => {
    // Guardar cartones en la BD cuando inicie la partida
    await saveCartonesToPartida(sala.id_partida)
    activarControles(sala.id_partida)
    if (data && data.patron) {
      renderPatronGanador(data.patron)
    }
  })
  socket.on("mostrarPatron", (data) => {
    if (data && data.patron) renderPatronGanador(data.patron)
  });

  socket.on("nuevoNumero", (numero) => {
    renderNuevoNumero(numero)
  });

  socket.on("eresGanador", (data)=>{
    eresGanador(data);
  });

  socket.on("ganador", (data) => {
    if(ganador) return; 
    hayGanador(data);
  });

  socket.on("errorCarton",(data)=>{
    penalizacion(30);
  });

  renderUsuariosEnSala(sala.id_partida)
}

async function loadSelectedCartones() {
  const storedCartones = localStorage.getItem("selectedCartones")
  if (storedCartones) {
    selectedCartones = JSON.parse(storedCartones)
    await displaySelectedCartones()
  }
}

async function displaySelectedCartones() {
  if (selectedCartones.length === 0) return

  try {
    const cartonesData = []
    for (const cartonId of selectedCartones) {
      const response = await fetch(`/api/cartones/${cartonId}`, {
        credentials: "include",
      })
      if (response.ok) {
        const cartonData = await response.json()
        cartonesData.push(cartonData)
      }
    }

    renderSelectedCartones(cartonesData)
    renderGameCartones(cartonesData)
    
  } catch (error) {
    console.error("Error loading selected cartones:", error)
  }
}

function renderSelectedCartones(cartonesData) {
  const container = document.getElementById("selectedCartonesDisplay")

  if (cartonesData.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                <p class="text-white">No hay cartones seleccionados</p>
            </div>
        `
    return
  }

  container.innerHTML = cartonesData
    .map((cartonData, index) => {
      let carton
      if (Array.isArray(cartonData.carton)) {
        carton = cartonData.carton
      } else if (typeof cartonData.carton === "string") {
        try {
          carton = JSON.parse(cartonData.carton)
        } catch (e) {
          console.error("Error parsing carton JSON:", e)
          carton = []
        }
      } else {
        carton = []
      }

      return `
                <div class="carton-preview fade-in">
                    <div class="text-center mb-2">
                        <h6 class="text-white mb-1">Cartón #${index + 1}</h6>
                        <small class="text-muted">ID: ${cartonData.id_carton}</small>
                    </div>
                    
                    <table class="bingo-table-preview">
                        <thead>
                            <tr>
                                <th class="bingo-cell-preview bingo-header-preview">B</th>
                                <th class="bingo-cell-preview bingo-header-preview">I</th>
                                <th class="bingo-cell-preview bingo-header-preview">N</th>
                                <th class="bingo-cell-preview bingo-header-preview">G</th>
                                <th class="bingo-cell-preview bingo-header-preview">O</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                              Array.isArray(carton)
                                ? carton
                                    .map(
                                      (row) => `
                                    <tr>
                                        ${
                                          Array.isArray(row)
                                            ? row
                                                .map(
                                                  (cell) => `
                                                <td class="bingo-cell-preview">${cell === null ? "FREE" : cell}</td>
                                            `,
                                                )
                                                .join("")
                                            : ""
                                        }
                                    </tr>
                                `,
                                    )
                                    .join("")
                                : ""
                            }
                        </tbody>
                    </table>
                </div>
            `
    })
    .join("")
}

function renderGameCartones(cartonesData) {
  const container = document.getElementById("gameCartonesDisplay")

  // Generar <li> para Swiper
  container.innerHTML = cartonesData
    .map((cartonData, index) => {
      let carton
      if (Array.isArray(cartonData.carton)) {
        carton = cartonData.carton
      } else if (typeof cartonData.carton === "string") {
        try {
          carton = JSON.parse(cartonData.carton)
        } catch (e) {
          console.error("Error parsing carton JSON:", e)
          carton = []
        }
      } else {
        carton = []
      }
      // Usar el id real del cartón para el id y data-id-carton de la tabla
      return `
        <li class="card-item swiper-slide">
          <div class="carton-preview">
            <div class="text-center mb-3">
              <h5 class="text-white mb-1">Cartón #${index + 1}</h5>
              <small class="text-muted">ID: ${cartonData.id_carton}</small>
            </div>
            <table id="carton-${cartonData.id_carton}" data-id-carton="${cartonData.id_carton}" class="tabla-numeros">
              <thead>
                <tr>
                  <th class="bg-primary"><div class="bola bola-b">B</div></th>
                  <th class="bg-success"><div class="bola bola-i">I</div></th>
                  <th class="bg-info"><div class="bola bola-n">N</div></th>
                  <th class="bg-warning"><div class="bola bola-g">G</div></th>
                  <th class="bg-danger"><div class="bola bola-o">O</div></th>
                </tr>
              </thead>
              <tbody>
                ${
                  Array.isArray(carton)
                    ? carton
                        .map(
                          (row) => `
                        <tr>
                            ${
                              Array.isArray(row)
                                ? row
                                    .map(
                                      (cell) => `
                                    <td class="seleccionable" data-number="${cell}">${cell === null ? "FREE" : cell}</td>
                                `
                                    )
                                    .join("")
                                : ""
                            }
                        </tr>
                    `
                        )
                        .join("")
                    : ""
                }
              </tbody>
            </table>
          </div>
        </li>
      `;
    })
    .join("")

  // Inicializar Swiper después de renderizar
  if (window.Swiper) {
    if (window.gameCartonesSwiper) {
      window.gameCartonesSwiper.destroy(true, true)
    }
    let slidesToShow = 1;
    const totalCartones = cartonesData.length;
    if (totalCartones >= 3) {
      slidesToShow = 3;
    } else if (totalCartones === 2) {
      slidesToShow = 2;
    }
    window.gameCartonesSwiper = new Swiper(".card-wrapper", {
      slidesPerView: slidesToShow,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
        dynamicBullets: true,
      },
      loop: false,
      observer: true,
      centeredSlides: true,
      spaceBetween: 60,
      observeParents: true,
      breakpoints: {
        0: {
          slidesPerView: 1,
        },
        950: {
          slidesPerView: 2,
        },
        1250: {
          slidesPerView: slidesToShow,
        },
      },
    });
  }

  // Pintar las celdas seleccionadas según localStorage
  pintarCartones();
}

async function getUsuario() {
  const response = await fetch(`/api/usuarios/actual`)

  if (!response.ok) {
    console.log("Error al obtener el usuario actual")
    return
  }

  return await response.json()
}

async function getSala(id_room) {
  const response = await fetch(`/api/partidas/${id_room}`)

  if (!response.ok) {
    console.error("Error al obtener la sala")
    return
  }

  return await response.json()
}

async function usuarioRegistrado(id_room) {
  const response = await fetch(`/api/partidas/${id_room}/registrado`)

  if (!response.ok) {
    console.error("Error al verificar si el usuario es miembro de la sala")
    return false
  }

  const data = await response.json()
  return data.registrado
}

async function registrarseSala(id_room) {
  const response = await fetch(`/api/partidas/${id_room}/registrarse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    console.error("Error al registrarse en la sala")
    return
  }

  return await response.json()
}

async function getUsuariosEnSala(id_room) {
  const response = await fetch(`/api/partidas/${id_room}/usuarios`)
  if (!response.ok) {
    console.error("Error al obtener los usuarios en la sala")
    return null
  }
  return await response.json()
}

async function renderUsuariosEnSala(id_room) {
  const usuarios = await getUsuariosEnSala(id_room)
  if (!usuarios) {
    console.error("No se pudieron obtener los usuarios en la sala")
    return
  }

  // Usar el contenedor correcto para los jugadores
  const jugadores_content = document.getElementById("jugadores_content")
  if (!jugadores_content) {
    console.error('No se encontró el contenedor con id "jugadores_content" en el DOM.')
    return
  }
  jugadores_content.innerHTML = "" // Limpiar la lista antes de renderizar

  usuarios.forEach((usuario) => {
    const cuadro_jugador = document.createElement("div")
    const datos_jugador = document.createElement("a")
    const img = document.createElement("img")
    const span = document.createElement("span")

    cuadro_jugador.classList.add("col-6", "col-sm-4", "col-md-3", "col-lg-2")
    datos_jugador.classList.add("btn-custom", "w-100", "perfil")

    img.src = `/img/Flork/${usuario.img_id}.jpg`
    img.alt = usuario.username
    span.textContent = usuario.username

    datos_jugador.appendChild(img)
    datos_jugador.appendChild(span)
    cuadro_jugador.appendChild(datos_jugador)
    jugadores_content.appendChild(cuadro_jugador)
  })
}

async function renderNumerosLlamados(id_room) {
  const response = await fetch(`/api/juego/estado/${id_room}`)
  if (!response.ok) {
    console.error("Error al obtener los números llamados")
    return
  }
  const data = await response.json()
  numerosLlamados.innerHTML = "" // Limpiar la lista antes de renderizar
  data.numbers.forEach((numero) => {
    const span = document.createElement("span")
    span.textContent = numero
    span.className = "called-number"
    numerosLlamados.insertBefore(span, numerosLlamados.firstChild);
  })

  if (data.numbers.length > 0 && numeroActual.textContent === "--") {
    numeroActual.textContent = data.numbers[data.numbers.length - 1]
  }
}

async function renderNuevoNumero(numero) {
  numeroActual.textContent = numero
  const span = document.createElement("span")
  span.className = "called-number"
  span.textContent = numero
  numerosLlamados.insertBefore(span, numerosLlamados.firstChild);
}

async function abandonarSala() {
  const response = await fetch(`/api/partidas/${idRoom.textContent}/abandonar`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    console.error("Error al abandonar la sala")
    return
  }

  const result = await response.json()
  if (result.success) {
    socket.emit("abandonarSala", idRoom.textContent)
    socket.disconnect()
    await menssaje("Upps", 'Has abandonado la sala', 'error')
    window.location.href = "/index"
  } else {
    console.error("No se pudo abandonar la sala")
  }
}
// Activar controles
async function activarControles(id_partida) {
  espera.setAttribute("hidden", "")
  tablero.removeAttribute("hidden")
  crearLocalStorage();
  renderNumerosLlamados(id_partida)
  pintarCartones()
}

document.getElementById("cardList").addEventListener("click", (e) => {
  const target = e.target;
  console.log(target);
  if (!target.classList.contains("seleccionable")) return;
  if (target.textContent === "FREE") return;

  const tabla = target.closest("table");
  if (!tabla) return;
  let idCarton = tabla.getAttribute("data-id-carton");
  if (!idCarton && tabla.id && tabla.id.startsWith("carton-")) {
    idCarton = tabla.id.replace("carton-", "");
  }
  if (!idCarton) return;

  const numero = Number(target.getAttribute("data-number"));
  if (isNaN(numero)) return;
  //console.log(target);

  target.classList.toggle("bolaSeleccionada");

  if (target.classList.contains("bolaSeleccionada")) {
    guardarNumero(idCarton, numero);
  } else {
    eliminarNumero(idCarton, numero);
  }
});

// ###############################
// ###############################
// Funciones para colorear bolas y guardar números en arreglos
// ###############################
// ###############################


function crearLocalStorage() {
  if (!localStorage.getItem("misArreglos")) {
    localStorage.setItem("misArreglos", JSON.stringify({}));
  }
}

function guardarNumero(indice, numeroBola) {
  let misArreglos = JSON.parse(localStorage.getItem("misArreglos")) || {};

  if (!misArreglos[indice]) {
    misArreglos[indice] = [];
  }

  if (!misArreglos[indice].includes(numeroBola)) {
    misArreglos[indice].push(numeroBola);
  }

  localStorage.setItem("misArreglos", JSON.stringify(misArreglos));
}


function pintarCartones() {
  const misArreglos = JSON.parse(localStorage.getItem("misArreglos"));

  if (!misArreglos || typeof misArreglos !== 'object') return;

  document.querySelectorAll("table[data-id-carton]").forEach((tabla) => {
    const id = tabla.getAttribute("data-id-carton");
    const numeros = misArreglos[id];
    if (!Array.isArray(numeros)) return;

    tabla.querySelectorAll("td.seleccionable").forEach((td) => {
      const num = parseInt(td.getAttribute("data-number"));
      if (numeros.includes(num)) {
        td.classList.add("selected", "bolaSeleccionada");
      } else {
        td.classList.remove("selected", "bolaSeleccionada");
      }
    });
  });
}

function eliminarDB() {
  localStorage.removeItem("misArreglos");
  console.log("Base de datos eliminada.");

}

function eliminarNumero(indice, numero) {
  let misArreglos = JSON.parse(localStorage.getItem("misArreglos")) || {};
  if (!Array.isArray(misArreglos[indice])) return;

  misArreglos[indice] = misArreglos[indice].filter(n => n !== numero);
  localStorage.setItem("misArreglos", JSON.stringify(misArreglos));
}

async function eresGanador(data){
  ganador = true;
  const usuario = data.ganador;

  await messageGanador(data, usuario, true);
}

async function hayGanador(data){
  const usuario = data.ganador
  await messageGanador(data, usuario)
}

function callBingo(carton, seleccionados, id_room, usuario) {
  socket.emit("callBingo", {
    id_room: id_room,
    numerosSeleccionados: seleccionados,
    carton: carton,
    ganador: usuario
  })
}

async function messageGanador(data, usuario, you = false) {
  const mensaje = you ? "<strong>🎉 ¡Bingo! 🎉</strong>" : `<strong>${usuario.username}, ha ganado el juego.</strong>`;
  Swal.fire({
    title: mensaje,
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
  });
}

function renderPatronGanador(patron) {
  const tabla = document.getElementById('tabla-bingo-patron');
  if (!tabla) return;

  const celdas = tabla.querySelectorAll('tbody td');

  // Limpiar el patrón anterior
  celdas.forEach(celda => {
    if (!celda.classList.contains('free-space')) {
        celda.classList.remove('seleccionadotd');
    }
  });

  const filas = tabla.querySelectorAll('tbody tr');

  for (let i = 0; i < patron.length; i++) {
    const celdasFila = filas[i].querySelectorAll('td');
    for (let j = 0; j < patron[i].length; j++) {
      if (patron[i][j] === '1') {
        if (i === 2 && j === 2) continue;
        celdasFila[j].classList.add('seleccionadotd');
      }
    }
  }
}

async function menssaje(titulo, texto, icono = null) {
  await Swal.fire({
    title: titulo,
    text: texto,
    icon: icono,
  });
}

function penalizacion(tiempo){
  mensajeTiempo("error", "Penalizacion", "Has sido penalizado por llamar Bingo sin tenerlo completo o correcto.");
  let tiempoRestante = tiempo;

const intervalo = setInterval(function() {
  if (tiempoRestante <= 0) {
    clearInterval(intervalo);
    btnBingo.disabled = false; 
    btnBingo.textContent = "Bingo";
    localStorage.removeItem("penalizacion");
  } else {
    localStorage.setItem("penalizacion", tiempoRestante);
    btnBingo.disabled = true; 
    btnBingo.textContent = tiempoRestante + " segundos restantes";
    tiempoRestante--;
  }
}, 1000);
}

async function mensajeTiempo(icon, titulo, texto) {
  await Swal.fire({
  icon: icon,
  title: titulo,
  text: texto,
  showConfirmButton: false,
  timer: 1500
});
}

unirseSala()
