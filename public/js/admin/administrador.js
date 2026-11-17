let allUsers = []
let filteredUsers = []

function setupEventListeners() {
  document.getElementById("searchInput").addEventListener("input", filterUsers)
  document.getElementById("filterField").addEventListener("change", filterUsers)
  document.getElementById("sortBy").addEventListener("change", sortUsers)
}

const urlUsuario = `/api/usuarios`

function loadUsers() {
  showLoading(true)
  fetch(urlUsuario, {
    method: "GET",
    credentials: "include",
  })
    .then((response) => {
      if (response.status === 401 || response.status === 403) {
        window.location.href = "/"
        return
      }
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      return response.json()
    })
    .then((data) => {
      if (!data) return
      allUsers = data
      filteredUsers = [...allUsers]
      renderUsers()
      updateStatistics()
      showLoading(false)
    })
    .catch((error) => {
      console.error("Error loading users:", error)
      showError("Error al cargar los usuarios")
      showLoading(false)
    })
}

document.addEventListener("DOMContentLoaded", () => {
  loadUsers()
  setupEventListeners()
})

function renderUsers() {
  const tbody = document.getElementById("usuarioTableBody")
  const noResults = document.getElementById("noResults")

  if (filteredUsers.length === 0) {
    tbody.innerHTML = ""
    noResults.classList.remove("d-none")
    return
  }

  noResults.classList.add("d-none")

  tbody.innerHTML = filteredUsers
    .map(
      (user) => `
        <tr>
            <td>
                ${
                  user.img_id
                    ? `<img src="/img/Flork/${user.img_id}.jpg"
                            alt="${user.username}" class="rounded-circle" width="40" height="40">`
                    : `<div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                            style="width: 40px; height: 40px; font-weight: bold;">
                            ${user.username.charAt(0).toUpperCase()}
                       </div>`
                }
            </td>
            <td><span class="">${user.id_usuario}</span></td>
            <td><strong>${user.username}</strong></td>
            <td>${user.email}</td>
            <td>
                <span class="badge ${user.rol === 0 ? "bg-warning text-dark" : "bg-info"}">
                    ${user.rol === 0 ? "Admin" : "Usuario"}
                </span>
            </td>
            <td class="text-center"><span class="badge bg-success">${user.creditos.toLocaleString()}</span></td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editUser(${user.id_usuario})" 
                            title="Editar Usuario">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="sendPasswordReset('${user.email}')" 
                            title="Cambiar Contraseña">
                        <i class="fas fa-key"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id_usuario})" 
                            title="Eliminar Usuario">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
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
        return user.rol.toString().includes(searchTerm) || roleText.includes(searchTerm)
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
      return bValue - aValue
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

async function editUser(userId) {
  const user = allUsers.find((u) => u.id_usuario === userId)
  if (!user) return

  const { value: formValues } = await Swal.fire({
    title: "Editar Usuario",
    html: `
            <div class="row g-3">
                <div class="col-12">
                    <label class="form-label">Username</label>
                    <input id="swal-username" class="form-control" value="${user.username}">
                </div>
                <div class="col-12">
                    <label class="form-label">Rol</label>
                    <select id="swal-rol" class="form-select">
                        <option value="0" ${user.rol === 0 ? "selected" : ""}>Administrador</option>
                        <option value="1" ${user.rol === 1 ? "selected" : ""}>Usuario</option>
                    </select>
                </div>
                <div class="col-12">
                    <label class="form-label">Créditos</label>
                    <input id="swal-creditos" type="number" class="form-control" value="${user.creditos}">
                </div>
                <div class="col-12">
                    <label class="form-label">Imagen ID</label>
                    <input id="swal-img-id" class="form-control" value="${user.img_id || ""}" 
                           placeholder="ID de imagen (1-11)">
                </div>
            </div>
        `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Guardar Cambios",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const username = document.getElementById("swal-username").value
      const rol = Number.parseInt(document.getElementById("swal-rol").value)
      const creditos = Number.parseInt(document.getElementById("swal-creditos").value)
      const img_id = document.getElementById("swal-img-id").value

      if (!username.trim()) {
        Swal.showValidationMessage("El username es requerido")
        return false
      }

      if (creditos < 0) {
        Swal.showValidationMessage("Los créditos no pueden ser negativos")
        return false
      }

      return {
        username: username.trim(),
        rol,
        creditos,
        img_id: img_id.trim() || null,
        email: user.email, 
        password: user.password, 
      }
    },
  })

  if (formValues) {
    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar usuario")
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

      renderUsers()
      updateStatistics()

      Swal.fire({
        icon: "success",
        title: "¡Usuario Actualizado!",
        text: "Los datos del usuario se han actualizado correctamente",
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (error) {
      console.error("Error updating user:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el usuario",
      })
    }
  }
}

async function sendPasswordReset(email) {
  const result = await Swal.fire({
    title: "¿Enviar cambio de contraseña?",
    text: `Se enviará un enlace de cambio de contraseña a: ${email}`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, Enviar",
    cancelButtonText: "Cancelar",
  })

  if (result.isConfirmed) {
    try {
      // Lógica real para enviar el email de cambio de contraseña
      const response = await fetch(`/send-password-reset`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "No se pudo enviar el enlace de cambio de contraseña");
      }

      Swal.fire({
        icon: "success",
        title: "¡Enlace Enviado!",
        html: `
          <p>Se ha enviado un enlace de cambio de contraseña a:</p>
          <strong>${email}</strong>
          <br><br>
          <small class="text-muted">El enlace expirará en 24 horas</small>
        `,
        confirmButtonText: "Entendido",
      })
    } catch (error) {
      console.error("Error sending password reset:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo enviar el enlace de cambio de contraseña",
      })
    }
  }
}

async function deleteUser(userId) {
  const user = allUsers.find((u) => u.id_usuario === userId)
  if (!user) return

  const result = await Swal.fire({
    title: "¿Estás seguro?",
    html: `
            <p>¿Deseas eliminar al usuario <strong>${user.username}</strong>?</p>
            <p class="text-danger"><small>Esta acción no se puede deshacer</small></p>
        `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, Eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc3545",
  })

  if (result.isConfirmed) {
    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar usuario")
      }

      allUsers = allUsers.filter((u) => u.id_usuario !== userId)
      filteredUsers = filteredUsers.filter((u) => u.id_usuario !== userId)

      renderUsers()
      updateStatistics()

      Swal.fire({
        icon: "success",
        title: "¡Usuario Eliminado!",
        text: "El usuario ha sido eliminado correctamente",
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el usuario",
      })
    }
  }
}

function showLoading(show) {
  const spinner = document.getElementById("loadingSpinner")
  const table = document.querySelector(".table-responsive")

  if (show) {
    spinner.classList.remove("d-none")
    if (table) table.style.display = "none"
  } else {
    spinner.classList.add("d-none")
    if (table) table.style.display = "block"
  }
}

function showError(message) {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
  })
}
