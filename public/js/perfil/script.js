// ===============================
// Referencias a elementos del DOM
// ===============================

const miniperfil = document.getElementById("imagenPequeña")
const img1 = document.getElementById("mainProfileImg")
const img2 = document.getElementById("mainProfileImg2")

// ===============================
// Mostrar/Ocultar panel lateral de perfil
// ===============================
let ocultar = false
function toggleProfilePanel() {
  const panel = document.getElementById("profilePanel")
  const miniperfil = document.getElementById("imagenPequeña")

  panel.classList.toggle("show")

  if (!ocultar) {
    // Al abrir el panel, ocultar la imagen pequeña
    if (miniperfil) {
      miniperfil.style.display = "none"
    }
    ocultar = true
  } else {
    // Al cerrar el panel, mostrar la imagen pequeña
    if (miniperfil) {
      miniperfil.style.display = "block"
    }
    ocultar = false
  }
}

// ===============================
// Mostrar/Ocultar el menú desplegable de imágenes
// ===============================
function toggleImageDropdown() {
  const dropdown = document.getElementById("imageDropdown")

  // Alternar visibilidad
  if (dropdown.style.display === "block") {
    dropdown.style.display = "none"
    document.removeEventListener("click", outsideClickListener)
  } else {
    dropdown.style.display = "block"
    // Agrega el listener para detectar clics fuera
    setTimeout(() => {
      document.addEventListener("click", outsideClickListener)
    }, 0)
  }

  // Función interna para detectar clic fuera
  function outsideClickListener(event) {
    const isClickInside = dropdown.contains(event.target) || event.target.id === "imageDropdownBtn" // si tienes un botón
    if (!isClickInside) {
      dropdown.style.display = "none"
      document.removeEventListener("click", outsideClickListener)
    }
  }
}

// ===============================
// Crea la lista de imágenes (incluye la imagen predeterminada como opción visual)
// ===============================
function crearImagenes() {
  const divImgs = document.getElementById("listImgs")
  divImgs.innerHTML = ""

  // Obtener el username actualizado y correcto
  let username = "U"
  // Si hay un input editable, usar su valor, si no, usar el texto del span
  const usernameInput = document.querySelector("#username[type='text']")
  const usernameElem = document.getElementById("username")
  if (usernameInput && usernameInput.value.trim()) {
    username = usernameInput.value.trim()
  } else if (usernameElem && usernameElem.textContent.trim()) {
    username = usernameElem.textContent.trim()
  }
  if (!username) username = "U"

  // Agregar la imagen predeterminada como opción visual (no como botón)
  const defaultDiv = document.createElement("div")
  defaultDiv.className = "preset-avatar profile-img selectable-avatar"
  defaultDiv.style.cursor = "pointer"
  defaultDiv.title = "Imagen predeterminada"
  defaultDiv.innerHTML = createAvatarElement(username, 60, 1.5)
  // Al hacer click, cambia a la imagen predeterminada
  defaultDiv.onclick = function () {
    setDefaultProfileImage(username)
  }
  divImgs.appendChild(defaultDiv)

  // Agregar las imágenes preestablecidas
  for (let i = 1; i < 12; i++) {
    const img = document.createElement("img")
    img.src = `https://bingo-api.mixg-studio.workers.dev/api/profile/${i}`
    img.alt = i
    img.className = "preset-avatar profile-img"
    img.setAttribute("onclick", "selectPresetImage(this)")
    img.id = "Avatar"
    divImgs.appendChild(img)
  }
}
crearImagenes()

// ===============================
// Seleccionar una imagen preestablecida
// ===============================
function selectPresetImage(img) {
  const imgUser = document.getElementById("imgUse")
  const miniperfil = document.getElementById("imagenPequeña")
  const src = img.src
  const alt = img.alt

  // Actualizar imagen principal en el panel
  if (imgUser) {
    imgUser.innerHTML = `
            <img src="${src}"
                 alt="${alt}"
                 class="rounded-circle profile-img"
                 width="200"
                 height="200"
                 id="mainProfileImg2"
                 style="object-fit:cover;"
            >
        `
  }

  // Actualizar imagen pequeña flotante
  if (miniperfil) {
    miniperfil.innerHTML = `
            <img src="${src}" 
                 alt="${alt}" 
                 class="rounded-circle" 
                 width="60" 
                 height="60"
                 style="object-fit:cover;">
        `
  }

  // Cerrar el dropdown
  const dropdown = document.getElementById("imageDropdown")
  if (dropdown) {
    dropdown.style.display = "none"
  }
}

// ===============================
// Crear avatar predeterminado (reutilizable)
// ===============================
function createAvatarElement(username, size = 60, fontSize = 1.5) {
  return `
    <div class="user-avatar" style="width:${size}px;height:${size}px; font-size: ${fontSize}rem">
      ${username.charAt(0).toUpperCase()}
    </div>
  `
}

// ===============================
// Opción para volver a la imagen predeterminada
// ===============================
function setDefaultProfileImage(username) {
  const imgUser = document.getElementById("imgUse")
  const miniperfil = document.getElementById("imagenPequeña")
  // Renderiza el avatar con la función reutilizable
  if (imgUser) {
    imgUser.innerHTML = createAvatarElement(username, 150, 4)
  }
  if (miniperfil) {
    miniperfil.innerHTML = createAvatarElement(username, 60, 1.5)
  }
  const img2 = document.getElementById("mainProfileImg2")
  if (img2) {
    img2.alt = ""
  }
  const dropdown = document.getElementById("imageDropdown")
  if (dropdown) {
    dropdown.style.display = "none"
  }
}

// ===============================
// Validar formato de correo electrónico
// ===============================
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// ===============================
// Hacer editable un campo de texto (conversión span -> input)
// ===============================
function hacerEditable(id) {
  const span = document.getElementById(id)
  const currentText = span.textContent

  const input = document.createElement("input")
  input.type = "text"
  input.value = currentText
  input.className = "editable-text text-dark me-2"
  input.id = id

  // Prevenir duplicados
  let error = document.getElementById(`${id}-error`)
  if (!error) {
    error = document.createElement("div")
    error.id = `${id}-error`
    error.className = "text-danger mt-1"
    error.style.fontSize = "0.9rem"
    span.parentNode.appendChild(error)
  } else {
    error.textContent = ""
  }

  span.replaceWith(input)
  input.focus()

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      guardarTexto(input)
    }
  })

  input.addEventListener("blur", () => {
    guardarTexto(input)
  })
}

// ===============================
// Guardar el texto editado (conversión input -> span)
// ===============================

function guardarTexto(input) {
  if (input.dataset.saved === "true") return
  input.dataset.saved = "true"

  const value = input.value.trim()
  const id = input.id
  const errorElem = document.getElementById(`${id}-error`)

  if (value === "") {
    errorElem.textContent = "Este campo no puede estar vacío."
    input.focus()
    input.dataset.saved = "false" // permitir reintento
    return
  }

  if (id === "email" && !validarEmail(value)) {
    errorElem.textContent = "El email no es válido."
    input.focus()
    input.dataset.saved = "false"
    return
  }

  errorElem.remove()

  const span = document.createElement("span")
  span.id = id
  span.className = "editable-text me-2"
  span.textContent = value
  input.replaceWith(span)
  
  if (id === "username") {
    crearImagenes()
  }
}

// Actualizar la función guardarPerfil para obtener el img_id correctamente
async function guardarPerfil() {
  const usernameElem = document.getElementById("username")
  const emailElem = document.getElementById("email")

  // Buscar la imagen tanto en img como en div avatar
  let img_id = ""
  const imgElement = document.querySelector("#imgUse img")
  const avatarElement = document.querySelector("#imgUse .user-avatar")

  if (imgElement && imgElement.alt && imgElement.alt.trim() !== "") {
    img_id = imgElement.alt.trim()
  } else if (avatarElement && avatarElement.getAttribute("data-alt")) {
    img_id = avatarElement.getAttribute("data-alt")
  }

  // Limpiar y preparar los valores a enviar
  const username = usernameElem.textContent.replace(/^@/, "").trim()
  const email = emailElem.textContent.trim()

  // Validaciones básicas antes de enviar
  if (username === "" || email === "") {
    alert("Por favor completa todos los campos.")
    return
  }

  if (!validarEmail(email)) {
    alert("El email no tiene un formato válido.")
    return
  }

  try {
    const response = await fetch(`/api/usuarios/actual/perfil`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, img_id: img_id || null }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Error al actualizar perfil")
    }

    alert("¡Perfil actualizado correctamente!")

    // Recargar el perfil para mostrar los cambios
    if (typeof cargarPerfil === "function") {
      await cargarPerfil()
    } else {
      console.warn("cargarPerfil is not a function")
    }
  } catch (error) {
    console.error("Error al actualizar el perfil:", error.message, error.stack)
    alert("Error al actualizar el perfil: " + error.message)
  }
}
