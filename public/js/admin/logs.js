// Get token from cookies
function getToken() {
  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=")
    if (name === "token") {
      return value
    }
  }
  return null
}

// Format date to readable string
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Format number with thousands separator
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Load admin stats and transactions
async function loadLogs() {
  const token = getToken()
  if (!token) {
    window.location.href = "/"
    return
  }

  const loadingContainer = document.getElementById("loadingContainer")
  const contentContainer = document.getElementById("contentContainer")
  const emptyState = document.getElementById("emptyState")

  loadingContainer.style.display = "flex"
  contentContainer.style.display = "none"
  emptyState.style.display = "none"

  try {
    const response = await fetch("/api/log-transacciones/stats/by-admin", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Error al cargar los logs")
    }

    const data = await response.json()

    loadingContainer.style.display = "none"

    if (data.admins.length === 0) {
      emptyState.style.display = "block"
      return
    }

    // Update total credits
    document.getElementById("totalCredits").textContent = formatNumber(data.total_creditos)

    // Generate admin cards
    const adminsContainer = document.getElementById("adminsContainer")
    adminsContainer.innerHTML = ""

    data.admins.forEach((admin) => {
      const adminCard = createAdminCard(admin)
      adminsContainer.appendChild(adminCard)
    })

    contentContainer.style.display = "block"
  } catch (error) {
    console.error("Error loading logs:", error)
    loadingContainer.style.display = "none"

    window.alert("No se pudieron cargar los logs de transacciones")
  }
}

// Create admin card element
function createAdminCard(admin) {
  const card = document.createElement("div")
  card.className = "admin-card"
  card.innerHTML = `
    <div class="admin-header">
      <div class="admin-info">
        <h3>${admin.username}</h3>
        <div class="admin-email">${admin.email}</div>
        <div class="transactions-count">
          <i class="fas fa-exchange-alt me-1"></i>
          ${admin.num_transacciones} transacción${admin.num_transacciones !== 1 ? "es" : ""}
        </div>
      </div>
      <div class="admin-stats">
        <div class="stat-value">${formatNumber(admin.total_vendido)}</div>
        <div class="stat-label">Créditos Vendidos</div>
        ${
          admin.num_transacciones > 0
            ? `
          <button class="btn-view-details mt-2" onclick="toggleTransactions(${admin.id_usuario})">
            <i class="fas fa-eye me-1"></i>Ver Detalles
          </button>
        `
            : ""
        }
      </div>
    </div>
    ${
      admin.num_transacciones > 0
        ? `
      <div id="transactions-${admin.id_usuario}" class="transactions-table">
        <div class="text-center py-3">
          <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    `
        : ""
    }
  `
  return card
}

// Toggle transaction details for an admin
async function toggleTransactions(adminId) {
  const transactionsDiv = document.getElementById(`transactions-${adminId}`)

  if (transactionsDiv.classList.contains("show")) {
    transactionsDiv.classList.remove("show")
    return
  }

  // If not loaded yet, fetch the transactions
  if (transactionsDiv.innerHTML.includes("spinner-border")) {
    const token = getToken()

    try {
      const response = await fetch(`/api/log-transacciones/by-admin/${adminId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar las transacciones")
      }

      const transactions = await response.json()

      if (transactions.length === 0) {
        transactionsDiv.innerHTML = '<p class="text-center text-muted py-3">No hay transacciones</p>'
      } else {
        transactionsDiv.innerHTML = createTransactionsTable(transactions)
      }
    } catch (error) {
      console.error("Error loading transactions:", error)
      transactionsDiv.innerHTML = '<p class="text-center text-danger py-3">Error al cargar las transacciones</p>'
    }
  }

  transactionsDiv.classList.add("show")
}

// Create transactions table HTML
function createTransactionsTable(transactions) {
  return `
    <table class="table table-hover">
      <thead>
        <tr>
          <th>Receptor</th>
          <th>Email</th>
          <th>Cantidad</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        ${transactions
          .map(
            (t) => `
          <tr>
            <td><strong>${t.receptor_username}</strong></td>
            <td>${t.receptor_email}</td>
            <td><span class="badge-credit">+${formatNumber(t.cantidad)}</span></td>
            <td>${formatDate(t.fecha)}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

// Refresh button handler
document.getElementById("refreshBtn").addEventListener("click", () => {
  loadLogs()
})

// Load logs on page load
document.addEventListener("DOMContentLoaded", () => {
  loadLogs()
})
