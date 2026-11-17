const BINGO_API_URL = "https://bingo-api.mixg-studio.workers.dev/api/tablero"

let currentUser = null
let userCartones = []

const offers = [
  {
    id: 1,
    name: "Cartón Individual",
    description: "Perfecto para empezar",
    quantity: 1,
    originalPrice: 100,
    currentPrice: 100,
    discount: 0,
    type: "basic",
    icon: "fas fa-ticket-alt",
    popular: false,
  },
  {
    id: 2,
    name: "Pack Básico",
    description: "3 cartones",
    quantity: 3,
    originalPrice: 300,
    currentPrice: 300,
    discount: 0,
    type: "popular",
    icon: "fas fa-layer-group",
    popular: true,
  },
  {
    id: 3,
    name: "Pack Premium",
    description: "5 cartones con buen descuento",
    quantity: 5,
    originalPrice: 500,
    currentPrice: 400,
    discount: 20,
    type: "premium",
    icon: "fas fa-star",
    popular: false,
  },
  {
    id: 4,
    name: "Mega Pack",
    description: "10 cartones - ¡La mejor oferta!",
    quantity: 10,
    originalPrice: 1000,
    currentPrice: 700,
    discount: 30,
    type: "mega",
    icon: "fas fa-crown",
    popular: false,
  },
]

document.addEventListener("DOMContentLoaded", async () => {
  await loadUserData()
  renderOffers()
  await loadUserCartones()
})

async function loadUserData() {
  try {
    const response = await fetch(`/api/usuarios/actual`, {
      credentials: "include",
    })

    if (!response.ok) {
      console.error("Error fetching user data:", response.statusText);
      window.location.href = "/"; // Redirigir a login si no se puede obtener el usuario
    }

    currentUser = await response.json()
    document.getElementById("userCredits").textContent = currentUser.creditos.toLocaleString()
    renderOffers()
    // Cargar cartones del usuario después de obtener currentUser
    await loadUserCartones()
  } catch (error) {
    console.error("Error loading user data:", error)
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los datos del usuario",
    })
  }
}

function renderOffers() {
  const container = document.getElementById("offersContainer")

  container.innerHTML = offers
    .map(
      (offer) => `
    <div class="col-xl-3 col-lg-4 col-md-6 mb-4">
      <div class="offer-card border-alert border-neon-complete offer-${offer.type} h-100">
        ${offer.discount > 0 ? `<div class="discount-badge">-${offer.discount}%</div>` : ""}
        
        <div class="text-center mb-4 mt-4">
          <i class="${offer.icon} fa-3x mb-3" style="color: var(--neon-${getColorByType(offer.type)});"></i>
          <h4 class="text-white fw-bold">${offer.name}</h4>
          <p class="text-white-neon   pt-2">${offer.description}</p>
        </div>

        <div class="price-display">
          ${offer.discount > 0 ? `<div class="price-original">${offer.originalPrice} créditos</div>` : ""}
          <div class="price-current">${offer.currentPrice}</div>
          <small class="text-white-neon">créditos</small>
        </div>

        <div class="text-center mb-4">
          <div class="badge bg-info fs-6 mb-2">
            ${offer.quantity} Cartón${offer.quantity > 1 ? "es" : ""}
          </div>
          ${
            offer.discount > 0
              ? `
            <div class="text-success small">
              <i class="fas fa-piggy-bank me-1"></i>
              Ahorras ${offer.originalPrice - offer.currentPrice} créditos
            </div>
          `
              : ""
          }
        </div>

        <div class="d-grid">
          <button class="btn btn-buy" onclick="buyOffer(${offer.id})" 
                  ${!currentUser || currentUser.creditos < offer.currentPrice ? "disabled" : ""}>
            <i class="fas fa-shopping-cart me-2"></i>
            ${!currentUser || currentUser.creditos < offer.currentPrice ? "Créditos Insuficientes" : "Comprar Ahora"}
          </button>
        </div>
      </div>
    </div>
  `,
    )
    .join("")
}

function getColorByType(type) {
  const colors = {
    basic: "blue",
    popular: "green",
    premium: "purple",
    mega: "orange",
  }
  return colors[type] || "blue"
}

async function buyOffer(offerId) {
  const offer = offers.find((o) => o.id === offerId)
  if (!offer) return

  // Verificar créditos
  if (currentUser.creditos < offer.currentPrice) {
    Swal.fire({
      icon: "warning",
      title: "Créditos Insuficientes",
      text: `Necesitas ${offer.currentPrice} créditos para esta compra. Tienes ${currentUser.creditos} créditos.`,
      confirmButtonText: "Entendido",
    })
    return
  }

  // Confirmación de compra
  const result = await Swal.fire({
    title: "¿Confirmar Compra?",
    html: `
      <div class="text-center">
        <i class="${offer.icon} fa-3x mb-3 text-primary"></i>
        <h5>${offer.name}</h5>
        <p class="text-muted">${offer.description}</p>
        <div class="bg-light p-3 rounded mb-3">
          <strong>Cantidad:</strong> ${offer.quantity} cartón${offer.quantity > 1 ? "es" : ""}<br>
          <strong>Precio:</strong> ${offer.currentPrice} créditos<br>
          <strong>Créditos restantes:</strong> ${currentUser.creditos - offer.currentPrice}
        </div>
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, Comprar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#198754",
  })

  if (!result.isConfirmed) return

  try {
    showLoading(true)

    // Obtener cartones de la API bingo
    const cartonesResponse = await fetch(`${BINGO_API_URL}?count=${offer.quantity}`)
    if (!cartonesResponse.ok) {
      throw new Error("Error al obtener cartones")
    }

    let cartonesData = await cartonesResponse.json()

    // Normalizar cartonesData [[],[],...]
    if (offer.quantity === 1 ) {
      cartonesData = [cartonesData.tableros];
    } else if (cartonesData && typeof cartonesData === "object" && !Array.isArray(cartonesData)) {
      const arr = Object.values(cartonesData).find(v => Array.isArray(v) && Array.isArray(v[0]));
      if (arr) cartonesData = arr;
    }

    if (!Array.isArray(cartonesData)) {
      throw new Error("La respuesta de cartones no es un array");
    }

    
    const cartonesDbResponse = await fetch(`/api/cartones/bulk`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cartones: cartonesData.map((carton) => carton), // Enviar cada tablero como está
      }),
    })

    if (!cartonesDbResponse.ok) {
      throw new Error("Error al guardar cartones en la base de datos")
    }

    const savedCartones = await cartonesDbResponse.json()

    // Asignar cartones al usuario
    const cartonUsuarioResponse = await fetch(`/api/carton-usuario/bulk`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_usuario: currentUser.id_usuario,
        cartones_ids: savedCartones.map((carton) => carton.id_carton),
      }),
    })

    if (!cartonUsuarioResponse.ok) {
      throw new Error("Error al asignar cartones al usuario")
    }

      // Actualizar créditos del usuario usando el nuevo endpoint específico
    const newCredits = currentUser.creditos - offer.currentPrice
    const updateResponse = await fetch(`/api/usuarios/actual/creditos`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creditos: newCredits,
      }),
    })

    if (!updateResponse.ok) {
      // Si falla la actualización de créditos, revertir toda la operación
      try {
        // Eliminar cada cartón (esto automáticamente elimina las relaciones carton_usuario)
        const deletePromises = savedCartones.map((carton) =>
          fetch(`/api/cartones/${carton.id_carton}`, {
            method: "DELETE",
            credentials: "include",
          }),
        )

        await Promise.all(deletePromises)

        Swal.fire({
          icon: "warning",
          title: "Compra Revertida",
          text: "Error al actualizar créditos. La compra ha sido revertida completamente y no se realizaron cargos.",
          confirmButtonText: "Entendido",
        })
      } catch (revertError) {
        console.error("Error al revertir la compra:", revertError)
        Swal.fire({
          icon: "error",
          title: "Error Crítico",
          text: "Error al actualizar créditos y al revertir la compra. Por favor contacta al soporte.",
          confirmButtonText: "Entendido",
        })
      }
      throw new Error("Error al actualizar créditos. La compra ha sido revertida.")
    }

    // Refrescar datos del usuario y UI
    await loadUserData()

    showLoading(false)
    renderOffers()
    loadUserCartones()

    await Swal.fire({
      icon: "success",
      title: "¡Compra Exitosa!",
      html: `
        <div class="text-center">
          <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
          <h5>¡Felicidades!</h5>
          <p>Has comprado <strong>${offer.quantity} cartón${offer.quantity > 1 ? "es" : ""}</strong> exitosamente.</p>
          <div class="bg-light p-3 rounded">
            <strong>Créditos restantes:</strong> ${currentUser.creditos.toLocaleString()}
          </div>
        </div>
      `,
      confirmButtonText: "Genial",
      timer: 3000,
    })
  } catch (error) {
    showLoading(false)
    console.error("Error en la compra:", error)
    Swal.fire({
      icon: "error",
      title: "Error en la Compra",
      text: error.message || "No se pudo completar la compra. Inténtalo de nuevo.",
      confirmButtonText: "Entendido",
    })
  }
}

async function loadUserCartones() {
  if (!currentUser) return

  try {
    const response = await fetch(`/api/carton-usuario/usuario/${currentUser.id_usuario}`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Error al cargar cartones del usuario")
    }

    userCartones = await response.json()
    
    renderUserCartones()
  } catch (error) {
    console.error("Error loading user cartones:", error)
  }
}

function renderUserCartones() {
  const container = document.getElementById("userCartonesContainer")

  if(userCartones.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <i class="fas fa-shopping-bag fa-3x text-info-neon mb-3"></i>
        <p class="text-white-neon">No tienes cartones comprados aún</p>
        <p class="text-white-neon">¡Compra algunos cartones arriba para empezar a jugar!</p>
      </div>
    `
    return
  }

  container.innerHTML = userCartones
    .map((cartonData, index) => {
      let carton;
      if (Array.isArray(cartonData.carton)) {
        carton = cartonData.carton;
      } else if (typeof cartonData.carton === "string") {
        try {
          carton = JSON.parse(cartonData.carton);
        } catch (e) {
          console.error("Error parsing carton JSON:", e, cartonData.carton);
          carton = [];
        }
      } else {
        carton = [];
      }
      return `
    <div class="col-lg-4 col-md-6 mb-4 pt-4">
      <div class="carton-card">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="text-white mb-0">Cartón #${index + 1}</h6>
          <small class="text-muted">ID: ${cartonData.id_carton}</small>
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
            ${Array.isArray(carton) ? carton
              .map(
                (row) => `
              <tr>
                ${Array.isArray(row) ? row
                  .map(
                    (cell) => `
                  <td class="bingo-cell">${cell === null ? "FREE" : cell}</td>
                `
                  ).join("") : ""}
              </tr>
            `
              ).join("") : ""}
          </tbody>
        </table>
        
        <div class="text-center mt-3">
          <small class="text-muted">
            <i class="fas fa-user me-1"></i>
            Propietario: ${cartonData.username}
          </small>
        </div>
      </div>
    </div>
  `
    })
    .join("")
}

function showLoading(show) {
  const spinner = document.getElementById("loadingSpinner")
  if (show) {
    spinner.classList.remove("d-none")
    document.body.style.overflow = "hidden"
  } else {
    spinner.classList.add("d-none")
    document.body.style.overflow = "auto"
  }
}

async function clearCartones() {
  if (!currentUser) return

  try {
    const response = await fetch(`/api/carton-usuario/usuario/${currentUser.id_usuario}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (response.ok) {
      userCartones = []
      renderUserCartones()
      Swal.fire({
        icon: "success",
        title: "Cartones eliminados",
        text: "Todos tus cartones han sido eliminados",
        timer: 2000,
      })
    }
  } catch (error) {
    console.error("Error clearing cartones:", error)
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron eliminar los cartones",
    })
  }
}
window.clearCartones = clearCartones
