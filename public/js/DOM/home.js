let activeGames = []

// Función para cargar partidas activas
async function loadActiveGames() {
  try {
    const response = await fetch("/api/partidas/usuario/activas", {
      credentials: "include",
    })

    if (response.ok) {
      activeGames = await response.json()
      renderActiveGamesButton()
    }
  } catch (error) {
    console.error("Error loading active games:", error)
  }
}

function renderActiveGamesButton() {
  const container = document.querySelector(".layout-btn .row")

  const existingBtn = document.getElementById("resume-game-btn")
  if (existingBtn) {
    existingBtn.remove()
  }

  if (activeGames.length > 0) {
    const resumeBtn = document.createElement("div")
    resumeBtn.id = "resume-game-btn"
    resumeBtn.className = "col-6 col-sm-4 col-md-3 col-lg-2"
    resumeBtn.innerHTML = `
            <a class="btn-custom w-100 admin" onclick="showActiveGames()">
                <img src="./img/iniciar.png" alt="Reanudar">
                <span>Reanudar Partida</span>
            </a>
        `
    const tiendaBtn = container.children[1] 
    container.insertBefore(resumeBtn, tiendaBtn.nextSibling)
  }
}

async function showActiveGames() {
  if (activeGames.length === 1) {
    resumeGame(activeGames[0].id_partida)
    return
  }
  const options = activeGames.map((game) => ({
    text: `Partida ${game.id_partida}`,
    value: game.id_partida,
  }))

  const { value: selectedGame } = await Swal.fire({
    title: "Selecciona una partida",
    input: "select",
    inputOptions: options.reduce((obj, option) => {
      obj[option.value] = option.text
      return obj
    }, {}),
    inputPlaceholder: "Selecciona una partida",
    showCancelButton: true,
    confirmButtonText: "Reanudar",
    cancelButtonText: "Cancelar",
  })

  if (selectedGame) {
    resumeGame(selectedGame)
  }
}

function resumeGame(gameId) {
  localStorage.removeItem("selectedCartones")
  window.location.href = `/room/user/${gameId}`
}

const roomId = document.getElementById("room-id")
const btnJoinRoom = document.getElementById("joinRoomBtn") 
const cartonesSection = document.getElementById("cartonesSection")
const layoutBtn = document.querySelector(".layout-btn")

let userCartones = []
let selectedCartones = []
const MAX_CARTONES = 4
const MIN_CARTONES = 1

// Declare Swal variable
const Swal = window.Swal

btnJoinRoom.addEventListener("click", async () => {
  const id = roomId.value.trim()
  if (id === "") {
    Swal.fire({
      icon: "warning",
      title: "ID de Sala Requerido",
      text: "Por favor, ingresa un ID de sala válido.",
    })
    return
  }

  // Cargar cartones del usuario antes de mostrar la selección
  await loadUserCartones()

  if (userCartones.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Sin Cartones",
      text: "No tienes cartones disponibles. Ve a la tienda para comprar algunos.",
      confirmButtonText: "Ir a la Tienda",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "/tienda"
      }
    })
    return
  }

  // Mostrar sección de selección de cartones
  showCartonesSelection(id)
})

async function loadUserCartones() {
  try {
    const userResponse = await fetch(`/api/usuarios/actual`, {
      credentials: "include",
    })

    if (!userResponse.ok) {
      throw new Error("Error al obtener datos del usuario")
    }

    const currentUser = await userResponse.json()

    const response = await fetch(`/api/carton-usuario/usuario/${currentUser.id_usuario}`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Error al cargar cartones del usuario")
    }

    userCartones = await response.json()
  } catch (error) {
    console.error("Error loading user cartones:", error)
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar tus cartones. Inténtalo de nuevo.",
    })
  }
}

function showCartonesSelection(roomId) {
  layoutBtn.style.display = "none"
  cartonesSection.style.display = "block"

  renderUserCartones()

  // Event listeners para los botones
  document.getElementById("confirmCartonesBtn").addEventListener("click", () => {
    if (selectedCartones.length >= MIN_CARTONES && selectedCartones.length <= MAX_CARTONES) {
      // Guardar cartones seleccionados en localStorage para usarlos en la sala
      localStorage.setItem("selectedCartones", JSON.stringify(selectedCartones))
      window.location.href = `/room/user/${roomId}`
    }
  })

  document.getElementById("cancelCartonesBtn").addEventListener("click", () => {
    hideCartonesSelection()
  })
}

function hideCartonesSelection() {
  layoutBtn.style.display = "grid"
  cartonesSection.style.display = "none"
  selectedCartones = []
  updateSelectedCount()
}

function renderUserCartones() {
  const container = document.getElementById("userCartonesContainer")

  if (userCartones.length === 0) {
    container.innerHTML = `
            <div class="col-12 text-center py-4">
                <i class="fas fa-shopping-bag fa-3x text-info mb-3"></i>
                <p class="text-white">No tienes cartones disponibles</p>
                <p class="text-white-50">¡Ve a la tienda para comprar algunos!</p>
            </div>
        `
    return
  }

  container.innerHTML = userCartones
    .map((cartonData, index) => {
      let carton
      if (Array.isArray(cartonData.carton)) {
        carton = cartonData.carton
      } else if (typeof cartonData.carton === "string") {
        try {
          carton = JSON.parse(cartonData.carton)
        } catch (e) {
          console.error("Error parsing carton JSON:", e, cartonData.carton)
          carton = []
        }
      } else {
        carton = []
      }

      return `
                <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                    <div class="carton-card selectable-carton" data-carton-id="${cartonData.id_carton}" onclick="toggleCartonSelection(${cartonData.id_carton})">
                        <div class="carton-header">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h6 class="text-white mb-0">Cartón #${index + 1}</h6>
                                <div class="selection-indicator" id="indicator-${cartonData.id_carton}">
                                    <i class="fas fa-check"></i>
                                </div>
                            </div>
                        </div>
                        
                        <table class="bingo-table">
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
                                                    <td class="bingo-cell">${cell === null ? "FREE" : cell}</td>
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
                        
                        <div class="text-center mt-2">
                            <small class="text-muted">ID: ${cartonData.id_carton}</small>
                        </div>
                    </div>
                </div>
            `
    })
    .join("")
}

function toggleCartonSelection(cartonId) {
  const index = selectedCartones.indexOf(cartonId)
  const cartonElement = document.querySelector(`[data-carton-id="${cartonId}"]`)
  const indicator = document.getElementById(`indicator-${cartonId}`)

  if (index > -1) {
    // Deseleccionar
    selectedCartones.splice(index, 1)
    cartonElement.classList.remove("selected")
    indicator.style.display = "none"
  } else {
    // Seleccionar
    if (selectedCartones.length >= MAX_CARTONES) {
      Swal.fire({
        icon: "warning",
        title: "Límite Alcanzado",
        text: `Solo puedes seleccionar máximo ${MAX_CARTONES} cartones.`,
        timer: 2000,
        showConfirmButton: false,
      })
      return
    }

    selectedCartones.push(cartonId)
    cartonElement.classList.add("selected")
    indicator.style.display = "flex"
  }

  updateSelectedCount()
}

function updateSelectedCount() {
  const countElement = document.getElementById("selectedCount")
  const confirmBtn = document.getElementById("confirmCartonesBtn")

  countElement.textContent = `${selectedCartones.length} cartones seleccionados`

  if (selectedCartones.length >= MIN_CARTONES && selectedCartones.length <= MAX_CARTONES) {
    confirmBtn.disabled = false
    confirmBtn.classList.remove("btn-secondary")
    confirmBtn.classList.add("btn-success")
    countElement.className = "badge bg-success fs-6"
  } else {
    confirmBtn.disabled = true
    confirmBtn.classList.remove("btn-success")
    confirmBtn.classList.add("btn-secondary")
    countElement.className = "badge bg-warning fs-6"
  }
}

// Cargar partidas activas cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  loadActiveGames()
})

// Hacer las funciones globales
window.toggleCartonSelection = toggleCartonSelection
window.showActiveGames = showActiveGames
window.resumeGame = resumeGame