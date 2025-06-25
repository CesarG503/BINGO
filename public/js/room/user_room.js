import getCookieValue from "/js/util/get_cookie.js"


const btnAbandonar = document.getElementById("btn-abandonar-sala")
const espera = document.getElementById("espera")
const tablero = document.getElementById("tablero")
const numerosLlamados = document.getElementById("numeros-llamados")
const numeroActual = document.getElementById("numero-actual")
const idRoom = document.getElementById("idRoom")

let socket
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

async function unirseSala() {
  const token = getCookieValue("token")
  if (!token) {
    alert("Error inesperado, no posees un usuario valido.")
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
    activarControles(sala.id_partida)
  } else if (sala.estado !== 0) {
    alert("La sala ya ha comenzado o ya finalizo.")
    window.location.href = "/"
    return
  }

  const registro = await registrarseSala(sala.id_partida)

  if (!registro) {
    console.error("Error al registrarse en la sala")
    return
  }

  socket = io({ auth: { token } }) 
  socket.emit("unirseSala", sala.id_partida)

  if (registro.registrado) {
    socket.emit("nuevoUsuario", {
      id_room: sala.id_partida,
      username: usuario.username,
      img_id: usuario.img_id,
    })
  }

  socket.on("salaEliminada", (err) => {
    alert("La sala ha sido cerrada por el administrador.")
    socket.disconnect()
    window.location.href = "/"
  })

  socket.on("nuevoUsuario", (data) => {
    renderUsuariosEnSala(sala.id_partida)
  })

  socket.on("usuarioAbandono", () => {
    renderUsuariosEnSala(sala.id_partida)
  })

  socket.on("inicioSala", () => {
    activarControles(sala.id_partida)
  })

  socket.on("nuevoNumero", (numero) => {
    renderNuevoNumero(numero)
  })

  await loadSelectedCartones()
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
                <div class="col-lg-6 col-md-12 mb-4">
                    <div class="carton-preview">
                        <div class="text-center mb-3">
                            <h5 class="text-white mb-1">Cartón #${index + 1}</h5>
                            <small class="text-muted">ID: ${cartonData.id_carton}</small>
                        </div>
                        
                        <table class="bingo-table w-100">
                            <thead>
                                <tr>
                                    <th class="bingo-cell bingo-header">B</th>
                                    <th class="bingo-cell bingo-header">I</th>
                                    <th class="bingo-cell bingo-header">N</th>
                                    <th class="bingo-cell bingo-header">G</th>
                                    <th class="bingo-cell bingo-header">O</th>
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
                                                    <td class="bingo-cell selectable-cell" data-number="${cell}">${cell === null ? "FREE" : cell}</td>
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
                </div>
            `
    })
    .join("")
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


  const jugadores = document.getElementById("jugadores")
  const jugadores_content = document.getElementById("jugadores_content");
  jugadores_content.innerHTML = "" // Limpiar la lista antes de renderizar

  const clasesHover = ["home", "perfil", "tienda", "creditos", "admin", "logout", "cerrar"];

  usuarios.forEach((usuario) => {

    const cuadro_jugador = document.createElement("div");
    const datos_jugador = document.createElement("a");
    const img = document.createElement("img");
    const span = document.createElement("span");

    const claseAleatoria = clasesHover[Math.floor(Math.random() * clasesHover.length)];

    cuadro_jugador.classList.add("col-6", "col-sm-4", "col-md-3", "col-lg-2");
    datos_jugador.classList.add("btn-custom", "w-100", "home", claseAleatoria);
    

    img.src=`https://bingo-api.mixg-studio.workers.dev/api/profile/${usuario.img_id}`
    span.textContent = usuario.username;

    datos_jugador.appendChild(img);
    datos_jugador.appendChild(span);
    cuadro_jugador.appendChild(datos_jugador);
    jugadores_content.appendChild(cuadro_jugador);
  })
}

async function renderNumerosLlamados(id_room) {
  const response = await fetch(`https://bingo-api.mixg-studio.workers.dev/api/partida/${id_room}`)
  if (!response.ok) {
    console.error("Error al obtener los números llamados")
    return
  }
  const data = await response.json()
  numerosLlamados.innerHTML = "" // Limpiar la lista antes de renderizar
  data.partida.numbers.forEach((numero) => {
    const p = document.createElement("span")
    p.textContent = numero + " "
    numerosLlamados.appendChild(p)
  })
}

async function renderNuevoNumero(numero) {
  numeroActual.textContent = numero


  const span = document.createElement("span")
  span.className = "called-number"
  span.textContent = numero
  numerosLlamados.appendChild(span)
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
    alert("Has abandonado la sala.")
    window.location.href = "/index" 
  } else {
    console.error("No se pudo abandonar la sala")
  }
}

async function activarControles(id_partida) {
  espera.setAttribute("hidden", "")
  tablero.removeAttribute("hidden")
  renderNumerosLlamados(id_partida)
}

unirseSala()