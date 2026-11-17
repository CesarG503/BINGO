let activeGames = []
let userCartones = []
let selectedCartones = []
let currentRoomData = null

const MAX_CARTONES = 4
const MIN_CARTONES = 1

// Declare Swal variable
const Swal = window.Swal

// Elementos DOM
let roomInput
let btnJoinRoom
let roomSpinner
let roomFeedback
let cartonesSection
let layoutBtn
let confirmCartonesBtn
let cancelCartonesBtn
let btnRandomCartones
let btnClearCartones
let btnChangeRoom

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
  if (!container) return

  const existingBtn = document.getElementById("resume-game-btn")
  if (existingBtn) {
    existingBtn.remove()
  }

  if (activeGames.length > 0) {
    const resumeBtn = document.createElement("div")
    resumeBtn.id = "resume-game-btn"
    resumeBtn.className = "col-6 col-sm-4 col-md-3 col-lg-2"
    resumeBtn.innerHTML = `
      <a class="btn-custom w-100 perfil" onclick="showActiveGames()">
        <img src="./img/iniciar.png" alt="Reanudar">
        <span>Reanudar Partida</span>
      </a>
    `
    const tiendaBtn = container.children[1]
    if (tiendaBtn) {
      container.insertBefore(resumeBtn, tiendaBtn.nextSibling)
    } else {
      container.appendChild(resumeBtn)
    }
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
    background: "#1A1A1A",
    color: "#fff",
  })

  if (selectedGame) {
    resumeGame(selectedGame)
  }
}

function resumeGame(gameId) {
  localStorage.removeItem("selectedCartones")
  window.location.href = `/room/user/${gameId}`
}

// Mostrar u ocultar feedback visual bajo el input de sala
function showRoomFeedback(message, type = "error") {
  if (!roomFeedback) return

  roomFeedback.style.display = "block"
  roomFeedback.className = `room-feedback feedback-${type}`

  let icon = "fa-circle-exclamation"
  if (type === "warning") icon = "fa-triangle-exclamation"
  if (type === "success") icon = "fa-circle-check"

  roomFeedback.innerHTML = `<i class="fas ${icon} me-2"></i>${message}`

  if (roomInput) {
    roomInput.classList.remove("is-valid", "is-invalid")
    if (type === "error" || type === "warning") {
      roomInput.classList.add("is-invalid")
    } else if (type === "success") {
      roomInput.classList.add("is-valid")
    }
  }
}

function hideRoomFeedback() {
  if (!roomFeedback) return
  roomFeedback.style.display = "none"
  roomFeedback.innerHTML = ""
  if (roomInput) {
    roomInput.classList.remove("is-valid", "is-invalid")
  }
}

// Validación y flujo de entrada a la sala
async function validateAndJoinRoom() {
  if (!roomInput) return
  const id = roomInput.value.trim().toUpperCase()

  hideRoomFeedback()

  if (id === "") {
    showRoomFeedback("Por favor, ingresa el código de la sala.", "warning")
    roomInput.focus()
    return
  }

  // Activar estado de carga en el input y deshabilitar botón
  if (roomSpinner) roomSpinner.style.display = "block"
  if (btnJoinRoom) btnJoinRoom.style.pointerEvents = "none"

  try {
    const response = await fetch(`/api/partidas/${encodeURIComponent(id)}`, {
      credentials: "include",
    })

    if (response.status === 404) {
      showRoomFeedback(`La sala "${id}" no existe. Verifica si el código está bien escrito.`, "error")
      return
    }

    if (!response.ok) {
      showRoomFeedback("Ocurrió un error al verificar la sala. Inténtalo de nuevo.", "error")
      return
    }

    const partida = await response.json()

    // Validar estado de la sala (0 = en espera, 1 = en juego, 2 = finalizada)
    if (partida.estado !== 0) {
      showRoomFeedback(`La sala "${partida.id_partida}" ya comenzó o ha finalizado. No es posible unirse.`, "warning")
      return
    }

    // Verificar si el usuario ya está registrado en la sala
    try {
      const regResponse = await fetch(`/api/partidas/${encodeURIComponent(partida.id_partida)}/registrado`, {
        credentials: "include",
      })
      if (regResponse.ok) {
        const regData = await regResponse.json()
        if (regData.registrado && Array.isArray(regData.id_cartones) && regData.id_cartones.length > 0) {
          // Pre-seleccionar los cartones que ya tenía
          selectedCartones = [...regData.id_cartones]
        }
      }
    } catch (e) {
      console.warn("No se pudo verificar registro previo:", e)
    }

    // Cargar cartones del usuario antes de mostrar la selección
    await loadUserCartones()

    if (userCartones.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin Cartones Disponibles",
        text: "No tienes cartones en tu inventario. Ve a la tienda para conseguir algunos y poder jugar.",
        confirmButtonText: "Ir a la Tienda",
        showCancelButton: true,
        cancelButtonText: "Cerrar",
        background: "#1A1A1A",
        color: "#fff",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/tienda"
        }
      })
      return
    }

    // Todo válido: mostrar feedback positivo y abrir pantalla de selección
    showRoomFeedback(`¡Sala ${partida.id_partida} lista! Configurando tus cartones...`, "success")
    setTimeout(() => {
      showCartonesSelection(partida)
    }, 300)

  } catch (error) {
    console.error("Error al validar la sala:", error)
    showRoomFeedback("Error de conexión al buscar la sala. Revisa tu red.", "error")
  } finally {
    if (roomSpinner) roomSpinner.style.display = "none"
    if (btnJoinRoom) btnJoinRoom.style.pointerEvents = "auto"
  }
}

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
    userCartones = []
    if (window.Swal) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar tus cartones. Inténtalo de nuevo.",
        background: "#1A1A1A",
        color: "#fff",
      })
    }
  }
}

function showCartonesSelection(roomOrPartida) {
  if (typeof roomOrPartida === "string") {
    currentRoomData = { id_partida: roomOrPartida }
  } else {
    currentRoomData = roomOrPartida
  }

  // Ocultar botón de logout y perfil mientras se eligen cartones
  const logoutBtn = document.getElementById("logoutBtn") || document.querySelector(".btn-custom.logout")
  const miniperfil = document.getElementById("imagenPequeña")
  const profilePanel = document.getElementById("profilePanel")

  if (logoutBtn) logoutBtn.style.display = "none"
  if (miniperfil) miniperfil.style.display = "none"
  if (profilePanel && profilePanel.classList.contains("show")) {
    profilePanel.classList.remove("show")
  }

  // Actualizar ID de la sala en la barra superior
  const contextRoomId = document.getElementById("contextRoomId")
  if (contextRoomId && currentRoomData) {
    contextRoomId.textContent = currentRoomData.id_partida
  }

  // Si no había selección previa o no es válida, seleccionar los primeros (hasta 4) por defecto
  if (selectedCartones.length === 0 && userCartones.length > 0) {
    const autoPickCount = Math.min(userCartones.length, MAX_CARTONES)
    selectedCartones = userCartones.slice(0, autoPickCount).map((c) => c.id_carton)
  }

  if (layoutBtn) layoutBtn.style.display = "none"
  if (cartonesSection) {
    cartonesSection.style.display = "block"
    cartonesSection.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  renderUserCartones()
  updateSelectedCount()
}

function hideCartonesSelection() {
  if (layoutBtn) layoutBtn.style.display = "block"
  if (cartonesSection) cartonesSection.style.display = "none"

  // Restaurar visibilidad del botón de logout y perfil
  const logoutBtn = document.getElementById("logoutBtn") || document.querySelector(".btn-custom.logout")
  const miniperfil = document.getElementById("imagenPequeña")

  if (logoutBtn) logoutBtn.style.display = ""
  if (miniperfil) miniperfil.style.display = "block"

  selectedCartones = []
  currentRoomData = null
  updateSelectedCount()
  hideRoomFeedback()
  if (roomInput) {
    roomInput.focus()
  }
}

function renderUserCartones() {
  const container = document.getElementById("userCartonesContainer")
  if (!container) return

  if (userCartones.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <i class="fas fa-ticket-alt fa-2x text-warning mb-2"></i>
        <h5 class="text-white">Sin cartones disponibles</h5>
        <p class="text-white-50 small">Consigue cartones en la tienda para poder jugar.</p>
        <a href="/tienda" class="btn btn-outline-warning btn-sm mt-1">
          <i class="fas fa-shopping-cart me-1"></i>Ir a la Tienda
        </a>
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

      const isSelected = selectedCartones.includes(cartonData.id_carton)
      const selectionIndex = selectedCartones.indexOf(cartonData.id_carton)
      const orderLabel = selectionIndex > -1 ? `#${selectionIndex + 1}` : ""

      return `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-2 mb-md-3">
          <div class="selectable-carton ${isSelected ? "selected" : ""}" data-carton-id="${cartonData.id_carton}" onclick="toggleCartonSelection(${cartonData.id_carton})">
            
            <div class="carton-selection-order" id="order-${cartonData.id_carton}">
              ${orderLabel}
            </div>

            <div class="carton-header mb-1 d-flex justify-content-between align-items-center">
              <span class="text-white small fw-bold">Cartón #${index + 1}</span>
              <span class="badge bg-dark text-white-50 border border-secondary" style="font-size: 0.7rem;">ID: ${cartonData.id_carton}</span>
            </div>
            
            <table class="bingo-table">
              <thead>
                <tr>
                  <th class="bingo-cell bingo-header-b">B</th>
                  <th class="bingo-cell bingo-header-i">I</th>
                  <th class="bingo-cell bingo-header-n">N</th>
                  <th class="bingo-cell bingo-header-g">G</th>
                  <th class="bingo-cell bingo-header-o">O</th>
                </tr>
              </thead>
              <tbody>
                ${
                  Array.isArray(carton)
                    ? carton
                        .map(
                          (row, rowIndex) => `
                          <tr>
                            ${
                              Array.isArray(row)
                                ? row
                                    .map((cell, colIndex) => {
                                      const isCenter = rowIndex === 2 && colIndex === 2
                                      if (cell === null || cell === "FREE" || isCenter) {
                                        return `<td class="bingo-cell free-cell">FREE</td>`
                                      }
                                      return `<td class="bingo-cell">${cell}</td>`
                                    })
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
        </div>
      `
    })
    .join("")
}

function toggleCartonSelection(cartonId) {
  const index = selectedCartones.indexOf(cartonId)

  if (index > -1) {
    // Deseleccionar
    selectedCartones.splice(index, 1)
  } else {
    // Seleccionar
    if (selectedCartones.length >= MAX_CARTONES) {
      Swal.fire({
        icon: "warning",
        title: "Límite Alcanzado",
        text: `Máximo ${MAX_CARTONES} cartones por partida.`,
        timer: 1800,
        showConfirmButton: false,
        background: "#1A1A1A",
        color: "#fff",
      })
      return
    }
    selectedCartones.push(cartonId)
  }

  // Actualizar clases de tarjetas y órdenes
  userCartones.forEach((cartonData) => {
    const card = document.querySelector(`[data-carton-id="${cartonData.id_carton}"]`)
    const orderBadge = document.getElementById(`order-${cartonData.id_carton}`)
    if (!card) return

    const pos = selectedCartones.indexOf(cartonData.id_carton)
    if (pos > -1) {
      card.classList.add("selected")
      if (orderBadge) {
        orderBadge.textContent = `#${pos + 1}`
      }
    } else {
      card.classList.remove("selected")
      if (orderBadge) {
        orderBadge.textContent = ""
      }
    }
  })

  updateSelectedCount()
}

function updateSelectedCount() {
  const countElement = document.getElementById("selectedCount")
  const confirmBtn = document.getElementById("confirmCartonesBtn")

  if (countElement) {
    countElement.textContent = `${selectedCartones.length}/${MAX_CARTONES}`
    if (selectedCartones.length >= MIN_CARTONES && selectedCartones.length <= MAX_CARTONES) {
      countElement.className = "badge bg-success fs-6 px-3 py-1"
    } else {
      countElement.className = "badge bg-secondary fs-6 px-3 py-1"
    }
  }

  if (confirmBtn) {
    if (selectedCartones.length >= MIN_CARTONES && selectedCartones.length <= MAX_CARTONES) {
      confirmBtn.disabled = false
      confirmBtn.classList.remove("btn-secondary")
      confirmBtn.classList.add("btn-success")
      confirmBtn.innerHTML = `Entrar a la Sala (${selectedCartones.length})`
    } else {
      confirmBtn.disabled = true
      confirmBtn.classList.remove("btn-success")
      confirmBtn.classList.add("btn-secondary")
      confirmBtn.innerHTML = `Entrar a la Sala`
    }
  }
}

// Acción de selección aleatoria (elige hasta 4 cartones al azar)
function selectRandomCartones() {
  if (userCartones.length === 0) return

  const shuffled = [...userCartones].sort(() => 0.5 - Math.random())
  const pickCount = Math.min(shuffled.length, MAX_CARTONES)
  selectedCartones = shuffled.slice(0, pickCount).map((c) => c.id_carton)

  renderUserCartones()
  updateSelectedCount()
}

// Limpiar selección
function clearCartonesSelection() {
  selectedCartones = []
  renderUserCartones()
  updateSelectedCount()
}

// Confirmar e ingresar a la partida
async function confirmAndEnterRoom() {
  if (!currentRoomData || !currentRoomData.id_partida) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se identificó la sala actual.",
      background: "#1A1A1A",
      color: "#fff",
    })
    return
  }

  const roomId = currentRoomData.id_partida

  if (selectedCartones.length < MIN_CARTONES || selectedCartones.length > MAX_CARTONES) {
    Swal.fire({
      icon: "warning",
      title: "Selección Requerida",
      text: `Debes seleccionar entre ${MIN_CARTONES} y ${MAX_CARTONES} cartones para jugar.`,
      background: "#1A1A1A",
      color: "#fff",
    })
    return
  }

  const confirmBtn = document.getElementById("confirmCartonesBtn")
  if (confirmBtn) {
    confirmBtn.disabled = true
    confirmBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Entrando...`
  }

  try {
    const response = await fetch(`/api/partidas/${encodeURIComponent(roomId)}/registrarse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ cartones: selectedCartones }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      console.error("Error registrando cartones:", errData)
      Swal.fire({
        icon: "error",
        title: "No se pudo ingresar",
        text: errData.error || "Hubo un problema al registrar tus cartones en la sala.",
        background: "#1A1A1A",
        color: "#fff",
      })
      if (confirmBtn) {
        confirmBtn.disabled = false
        confirmBtn.innerHTML = `Entrar a la Sala`
      }
      return
    }

    const result = await response.json()
    const targetRoomId = result.id_partida || roomId
    window.location.href = `/room/user/${targetRoomId}`
  } catch (error) {
    console.error("Error de red al registrarse:", error)
    Swal.fire({
      icon: "error",
      title: "Error de Conexión",
      text: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
      background: "#1A1A1A",
      color: "#fff",
    })
    if (confirmBtn) {
      confirmBtn.disabled = false
      confirmBtn.innerHTML = `Entrar a la Sala`
    }
  }
}

// Inicialización de Eventos del DOM
document.addEventListener("DOMContentLoaded", async () => {
  // Referencias a elementos
  roomInput = document.getElementById("room-id")
  btnJoinRoom = document.getElementById("joinRoomBtn")
  roomSpinner = document.getElementById("roomInputSpinner")
  roomFeedback = document.getElementById("roomFeedback")
  cartonesSection = document.getElementById("cartonesSection")
  layoutBtn = document.querySelector(".layout-btn")
  confirmCartonesBtn = document.getElementById("confirmCartonesBtn")
  cancelCartonesBtn = document.getElementById("cancelCartonesBtn")
  btnRandomCartones = document.getElementById("btnRandomCartones")
  btnClearCartones = document.getElementById("btnClearCartones")
  btnChangeRoom = document.getElementById("btnChangeRoom")

  // Eventos de entrada a sala
  if (btnJoinRoom) {
    btnJoinRoom.addEventListener("click", (e) => {
      e.preventDefault()
      validateAndJoinRoom()
    })
  }

  if (roomInput) {
    // Al escribir, limpiar advertencias y auto-convertir a mayúsculas
    roomInput.addEventListener("input", () => {
      roomInput.value = roomInput.value.toUpperCase()
      hideRoomFeedback()
    })

    // Soporte para tecla Enter
    roomInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        validateAndJoinRoom()
      }
    })
  }

  // Eventos de la sección de cartones
  if (confirmCartonesBtn) {
    confirmCartonesBtn.addEventListener("click", confirmAndEnterRoom)
  }

  if (cancelCartonesBtn) {
    cancelCartonesBtn.addEventListener("click", hideCartonesSelection)
  }

  if (btnChangeRoom) {
    btnChangeRoom.addEventListener("click", hideCartonesSelection)
  }

  if (btnRandomCartones) {
    btnRandomCartones.addEventListener("click", selectRandomCartones)
  }

  if (btnClearCartones) {
    btnClearCartones.addEventListener("click", clearCartonesSelection)
  }

  // Cargar partidas activas
  loadActiveGames()

  // Manejo de parámetros URL (integración con escaneo QR)
  const urlParams = new URLSearchParams(window.location.search)
  const errorParam = urlParams.get("error")
  const joinParam = urlParams.get("join")

  if (errorParam) {
    let title = "Atención"
    let text = "Ocurrió un problema al procesar la sala."

    switch (errorParam) {
      case "room_not_found":
        title = "Sala no encontrada"
        text = "La sala solicitada no existe o fue cerrada."
        break
      case "room_started":
        title = "Partida en curso"
        text = "La partida ya ha iniciado y no permite nuevos participantes."
        break
      case "invalid_room":
        title = "Código inválido"
        text = "El formato o identificador de sala no es válido."
        break
      case "room_finished":
        title = "Partida finalizada"
        text = "Esta partida de bingo ya ha concluido."
        break
      case "room_full":
        title = "Sala llena"
        text = "La sala ha alcanzado la capacidad máxima de jugadores."
        break
      case "server_error":
        title = "Error del servidor"
        text = "No se pudo conectar con el servidor para verificar la sala."
        break
      default:
        text = `Código de error: ${errorParam}`
        break
    }

    if (window.Swal) {
      window.Swal.fire({
        icon: "error",
        title: title,
        text: text,
        background: "#1A1A1A",
        color: "#fff",
        confirmButtonColor: "#0dcaf0",
      })
    } else {
      alert(`${title}: ${text}`)
    }

    window.history.replaceState({}, document.title, window.location.pathname)
  } else if (joinParam) {
    const cleanJoinId = joinParam.trim()
    if (cleanJoinId) {
      if (roomInput) {
        roomInput.value = cleanJoinId.toUpperCase()
      }
      await validateAndJoinRoom()
    }
  }
})

// Hacer las funciones necesarias accesibles globalmente
window.toggleCartonSelection = toggleCartonSelection
window.showActiveGames = showActiveGames
window.resumeGame = resumeGame
window.showCartonesSelection = showCartonesSelection
