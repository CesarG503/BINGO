const API_BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://bingo-ivxo.onrender.com"

let allUsers = []
let filteredUsers = []
let currentUser = null

function setupEventListeners() {
  
  document.getElementById("searchInput").addEventListener("input", filterUsers)

  
  document.getElementById("filterField").addEventListener("change", filterUsers)

  
  document.getElementById("sortBy").addEventListener("change", sortUsers)

  
  document.getElementById("creditAmount").addEventListener("input", function () {
    const value = Number.parseInt(this.value)
    if (value < 0) this.value = 0
    if (value > 10000) this.value = 10000
  })
}

async function loadUsers() {
  try {
    showLoading(true)
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_BASE_URL}/api/usuarios`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Error al cargar usuarios")
    }

    allUsers = await response.json()
    filteredUsers = [...allUsers]

    renderUsers()
    updateStatistics()
    showLoading(false)
  } catch (error) {
    console.error("Error loading users:", error)
    showError("Error al cargar los usuarios")
    showLoading(false)
  }
}

function renderUsers() {
  const container = document.getElementById("usersContainer")
  const noResults = document.getElementById("noResults")

  if (filteredUsers.length === 0) {
    container.innerHTML = ""
    noResults.classList.remove("d-none")
    return
  }

  noResults.classList.add("d-none")

  container.innerHTML = filteredUsers
    .map(
      (user) => `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="user-card fade-in">
                <div class="d-flex align-items-center mb-3">

                        ${user.img_id
                          ? `<img src="https://bingo-api.mixg-studio.workers.dev/api/profile/${user.img_id}" alt="${user.username}" class="avatar-img me-3">`
                          : `<div class="user-avatar me-3">${user.username.charAt(0).toUpperCase()}</div>`  
                          }
                          
                    <div class="flex-grow-1">
                        <h6 class="mb-1 fw-bold">${user.username}</h6>
                        <small class="text-muted">ID: ${user.id_usuario}</small>
                    </div>
                    <span class="badge role-badge ${user.rol === 0 ? "role-admin" : "role-user"}">
                        ${user.rol === 0 ? "Admin" : "Usuario"}
                    </span>
                </div>
                
                <div class="mb-3">
                    <small class="text-muted d-block">Email</small>
                    <span class="fw-medium">${user.email}</span>
                </div>
                
                <div class="credit-display">
                    <div class="d-flex justify-content-between align-items-center">
                        <span>Créditos</span>
                        <span class="fs-4 fw-bold">${user.creditos.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="d-grid gap-2">
                    <button class="btn btn-assign-credits" onclick="openCreditModal(${user.id_usuario})">
                        <i class="fas fa-coins me-2"></i>Asignar Créditos
                    </button>
                    <div class="row g-2">
                        <div class="col-6">
                            <button class="btn btn-info shadow-none btn-efect btn-sm w-100" onclick="quickAssign(${user.id_usuario}, 100)">
                                +100
                            </button>
                        </div>
                        <div class="col-6">
                            <button class="btn btn-success shadow-none btn-efect btn-sm w-100" onclick="quickAssign(${user.id_usuario}, 500)">
                                +500
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function filterUsers() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase()
  const filterField = document.getElementById("filterField").value

  if (!searchTerm) {
    filteredUsers = [...allUsers]
  } else {
    filteredUsers = allUsers.filter((user) => {
      if (filterField === "all") {
        return Object.values(user).some((value) => value && value.toString().toLowerCase().includes(searchTerm))
      } else if (filterField === "rol") {

        const roleText = user.rol === 0 ? "admin" : "usuario"
        return (
          user.rol.toString().includes(searchTerm) ||
          roleText.includes(searchTerm)
        )
      } else {
        const fieldValue = user[filterField]
        return fieldValue && fieldValue.toString().toLowerCase().includes(searchTerm)
      }
    })
  }

  sortUsers()
}

function sortUsers() {
  const sortBy = document.getElementById("sortBy").value

  filteredUsers.sort((a, b) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]

    if (typeof aValue === "number" && typeof bValue === "number") {
      return bValue - aValue // Descending for numbers
    }

    return aValue.toString().localeCompare(bValue.toString())
  })

  renderUsers()
}

function clearFilters() {
  document.getElementById("searchInput").value = ""
  document.getElementById("filterField").value = "all"
  document.getElementById("sortBy").value = "id_usuario"

  filteredUsers = [...allUsers]
  sortUsers()
}

function updateStatistics() {
  const totalUsers = allUsers.length
  const totalCredits = allUsers.reduce((sum, user) => sum + user.creditos, 0)
  const adminUsers = allUsers.filter((user) => user.rol === 0).length
  const regularUsers = allUsers.filter((user) => user.rol === 1).length

  document.getElementById("totalUsers").textContent = totalUsers.toLocaleString()
  document.getElementById("totalCredits").textContent = totalCredits.toLocaleString()
  document.getElementById("adminUsers").textContent = adminUsers.toLocaleString()
  document.getElementById("regularUsers").textContent = regularUsers.toLocaleString()
}

function openCreditModal(userId) {
  const user = allUsers.find((u) => u.id_usuario === userId)
  if (!user) return

  currentUser = user

  const userAvatarDiv = document.querySelector('#avatarContainer');
  userAvatarDiv.innerHTML = user.img_id
  ? `<img src="https://bingo-api.mixg-studio.workers.dev/api/profile/${user.img_id}" alt="${user.username}" class="avatar-img me-3">`
  : `<div class="user-avatar me-3">${user.username.charAt(0).toUpperCase()}</div>`;

  document.getElementById("modalUsername").textContent = user.username
  document.getElementById("modalEmail").textContent = user.email
  document.getElementById("modalCurrentCredits").textContent = user.creditos.toLocaleString()
  document.getElementById("creditAmount").value = ""

  const modal = new bootstrap.Modal(document.getElementById("creditModal"))
  modal.show()
}

function setCreditAmount(amount, isReset = false) {
  const input = document.getElementById("creditAmount")

  if (isReset) {
    input.value = currentUser.creditos * -1 
  } else {
    input.value = amount
  }
}

async function assignCredits() {
  const creditAmount = Number.parseInt(document.getElementById("creditAmount").value)

  if (!creditAmount || creditAmount === 0) {
    Swal.fire({
      icon: "warning",
      title: "Cantidad inválida",
      text: "Por favor ingresa una cantidad válida de créditos",
    })
    return
  }

  if (!currentUser) return

  try {
    const token = localStorage.getItem("token")
    const newCredits = Math.max(0, currentUser.creditos + creditAmount)

    const response = await fetch(`${API_BASE_URL}/api/usuarios/${currentUser.id_usuario}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...currentUser,
        creditos: newCredits,
      }),
    })

    if (!response.ok) {
      throw new Error("Error al actualizar créditos")
    }

    const updatedUser = await response.json()

    
    const userIndex = allUsers.findIndex((u) => u.id_usuario === currentUser.id_usuario)
    if (userIndex !== -1) {
      allUsers[userIndex] = updatedUser
    }

    const filteredIndex = filteredUsers.findIndex((u) => u.id_usuario === currentUser.id_usuario)
    if (filteredIndex !== -1) {
      filteredUsers[filteredIndex] = updatedUser
    }

   
    const modal = bootstrap.Modal.getInstance(document.getElementById("creditModal"))
    modal.hide()

    
    Swal.fire({
      icon: "success",
      title: "¡Créditos asignados!",
      text: `Se ${creditAmount > 0 ? "agregaron" : "restaron"} ${Math.abs(creditAmount)} créditos a ${currentUser.username}`,
      timer: 2000,
      showConfirmButton: false,
    })

    
    renderUsers()
    updateStatistics()
  } catch (error) {
    console.error("Error assigning credits:", error)
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron asignar los créditos",
    })
  }
}

async function quickAssign(userId, amount) {
  const user = allUsers.find((u) => u.id_usuario === userId)
  if (!user) return

  try {
    const token = localStorage.getItem("token")
    const newCredits = user.creditos + amount

    const response = await fetch(`${API_BASE_URL}/api/usuarios/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...user,
        creditos: newCredits,
      }),
    })

    if (!response.ok) {
      throw new Error("Error al actualizar créditos")
    }

    const updatedUser = await response.json()

    const userIndex = allUsers.findIndex((u) => u.id_usuario === userId)
    if (userIndex !== -1) {
      allUsers[userIndex] = updatedUser
    }

    const filteredIndex = filteredUsers.findIndex((u) => u.id_usuario === userId)
    if (filteredIndex !== -1) {
      filteredUsers[filteredIndex] = updatedUser
    }

   
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
    })

    Toast.fire({
      icon: "success",
      title: `+${amount} créditos agregados`,
    })

    
    renderUsers()
    updateStatistics()
  } catch (error) {
    console.error("Error in quick assign:", error)
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron asignar los créditos",
    })
  }
}

function showLoading(show) {
  const spinner = document.getElementById("loadingSpinner")
  const container = document.getElementById("usersContainer")

  if (show) {
    spinner.classList.remove("d-none")
    container.innerHTML = ""
  } else {
    spinner.classList.add("d-none")
  }
}

function showError(message) {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
  })
}


function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("userId")
  window.location.href = "login.html"
}
