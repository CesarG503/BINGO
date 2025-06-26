// ===============================
// Función para cargar datos del perfil desde la API
// ===============================
async function cargarPerfil() {
  try {
    const res = await fetch(`/api/usuarios/actual`)
    const data = await res.json()

    document.getElementById("username").textContent = data.username 
    document.getElementById("email").textContent = data.email
    document.getElementById("creditos").textContent = data.creditos

    const createAvatarElement = (username, size = 60, fontSize = 1.5) => {
      return `
        <div class="user-avatar" style="width:${size}px;height:${size}px; font-size: ${fontSize}rem">
          ${username.charAt(0).toUpperCase()}
        </div>
      `
    }

    // Función para crear elemento de imagen
    const createImageElement = (img_id, username, size = 200) => {
      return `
        <img src="https://bingo-api.mixg-studio.workers.dev/api/profile/${img_id}"
             alt="${img_id}"
             class="rounded-circle profile-img"
             width="${size}"
             height="${size}"
             id="mainProfileImg2"
             style="object-fit:cover;">
      `
    }

    // Renderizar imagen principal en el panel
    const imgUser = document.getElementById("imgUse")
    if (imgUser) {
      if (data.img_id && data.img_id.trim() !== "") {
        imgUser.innerHTML = createImageElement(data.img_id, data.username, 200)
      } else {
        imgUser.innerHTML = createAvatarElement(data.username, 150, 4)
      }
    }

    const iconDiv = document.getElementById("imagenPequeña")
    if (iconDiv) {
      if (data.img_id && data.img_id.trim() !== "") {
        iconDiv.innerHTML = `<img src="https://bingo-api.mixg-studio.workers.dev/api/profile/${data.img_id}" 
                                           alt="${data.username}" 
                                           class="rounded-circle" 
                                           width="60" 
                                           height="60"
                                           style="object-fit:cover;">`
      } else {
        iconDiv.innerHTML = createAvatarElement(data.username, 60)
      }
    }

    // Aplicar clase "a" condicionalmente si img_id es '11'
    const botonCerrar = document.getElementById("botonCerrar")
    if (botonCerrar) {
      if (data.img_id === "11") {
        botonCerrar.classList.add("a")
      } else {
        botonCerrar.classList.remove("a")
      }
    }
  } catch (error) {
    console.error("Error al cargar el perfil:", error)
  }
}

// ===============================
// Función para validar el formato del email
// ===============================
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// ===============================
// Función para guardar los cambios del perfil
// ===============================
async function guardarPerfil() {
  // Obtener elementos del DOM
  const usernameElem = document.getElementById("username")
  const emailElem = document.getElementById("email")
  const img = document.getElementById("mainProfileImg2")

  // Limpiar y preparar los valores a enviar
  const username = usernameElem.textContent.replace(/^@/, "").trim() // Elimina el '@'
  const email = emailElem.textContent.trim()
  const img_id = img?.alt?.trim() || ""

  // Validaciones básicas antes de enviar
  if (username === "" || email === "") {
    const mensaje = "Por favor completa todos los campos.";
    menssaje('', mensaje, 'warning')
    return
  }

  if (!validarEmail(email)) {
    const mensaje = "El email no tiene un formato válido.";
    menssaje('', mensaje, 'warning')
    return
  }

  try {
    // Enviar una petición PUT para actualizar el perfil
    const response = await fetch(`/api/usuarios/actual/perfil`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, img_id }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Error al actualizar perfil")
    }

    const mensaje = "¡Perfil actualizado correctamente!";
    menssaje('', mensaje, 'success')
  } catch (error) {
    console.error("Error al actualizar el perfil:", error.message, error.stack)
  }
}

// Ejecutar al cargar la página SOLO cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  cargarPerfil()
})
function menssaje(titulo, texto, icono = null) {
  Swal.fire({
    title: titulo,
    text: texto,
    icon: icono,
  });
}