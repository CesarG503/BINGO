const API_BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://bingo-ivxo.onrender.com"

async function validateToken(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/validate-reset-token/${token}`)
    const data = await response.json()

    if (!data.valid) {
      Swal.fire({
        icon: "error",
        title: "Enlace Inválido",
        text: data.error || "El enlace de cambio de contraseña no es válido o ha expirado",
        confirmButtonText: "Ir al Inicio",
      }).then(() => {
        window.location.href = "/"
      })
      return false
    }

    if (data.username) {
      document.querySelector(".lead").textContent = `Hola ${data.username}, establece tu nueva contraseña`
    }

    return true
  } catch (error) {
    console.error("Error validating token:", error)
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Error al validar el enlace",
      confirmButtonText: "Ir al Inicio",
    }).then(() => {
      window.location.href = "/"
    })
    return false
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const newPasswordInput = document.getElementById("newPassword")
  const confirmPasswordInput = document.getElementById("confirmPassword")
  const submitBtn = document.getElementById("submitBtn")
  const strengthMeter = document.getElementById("strengthMeter")
  const strengthText = document.getElementById("strengthText")
  const matchText = document.getElementById("matchText")
  const form = document.getElementById("passwordChangeForm")

  // Visibilidad de contraseña
  document.getElementById("togglePassword1").addEventListener("click", function () {
    togglePasswordVisibility("newPassword", this)
  })

  document.getElementById("togglePassword2").addEventListener("click", function () {
    togglePasswordVisibility("confirmPassword", this)
  })

  newPasswordInput.addEventListener("input", function () {
    checkPasswordStrength(this.value)
    validateForm()
  })

  confirmPasswordInput.addEventListener("input", () => {
    checkPasswordMatch()
    validateForm()
  })


  form.addEventListener("submit", handlePasswordChange)

  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get("token")

  if (!token) {
    Swal.fire({
      icon: "error",
      title: "Enlace Inválido",
      text: "El enlace de cambio de contraseña no es válido o ha expirado",
      confirmButtonText: "Ir al Inicio",
    }).then(() => {
      window.location.href = "/"
    })
    return
  }
  const isValid = await validateToken(token)
  if (!isValid) {
    return 
  }
})

function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId)
  const icon = button.querySelector("i")

  if (input.type === "password") {
    input.type = "text"
    icon.classList.remove("fa-eye")
    icon.classList.add("fa-eye-slash")
  } else {
    input.type = "password"
    icon.classList.remove("fa-eye-slash")
    icon.classList.add("fa-eye")
  }
}

function checkPasswordStrength(password) {
  const strengthMeter = document.getElementById("strengthMeter")
  const strengthText = document.getElementById("strengthText")

  let strength = 0
  const feedback = []


  if (password.length >= 8) strength += 1
  else feedback.push("al menos 8 caracteres")


  if (/[A-Z]/.test(password)) strength += 1
  else feedback.push("una mayúscula")


  if (/[a-z]/.test(password)) strength += 1
  else feedback.push("una minúscula")

  if (/\d/.test(password)) strength += 1
  else feedback.push("un número")

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1
  else feedback.push("un carácter especial")

  strengthMeter.style.width = (strength / 5) * 100 + "%"

  if (strength <= 2) {
    strengthMeter.className = "strength-meter strength-weak"
    strengthText.textContent = "Contraseña débil. Necesita: " + feedback.join(", ")
    strengthText.className = "text-danger"
  } else if (strength <= 3) {
    strengthMeter.className = "strength-meter strength-medium"
    strengthText.textContent = "Contraseña media. Mejora con: " + feedback.join(", ")
    strengthText.className = "text-warning"
  } else {
    strengthMeter.className = "strength-meter strength-strong"
    strengthText.textContent = "Contraseña fuerte"
    strengthText.className = "text-success"
  }

  return strength >= 3
}

function checkPasswordMatch() {
  const newPassword = document.getElementById("newPassword").value
  const confirmPassword = document.getElementById("confirmPassword").value
  const matchText = document.getElementById("matchText")

  if (confirmPassword === "") {
    matchText.textContent = ""
    return false
  }

  if (newPassword === confirmPassword) {
    matchText.textContent = "✓ Las contraseñas coinciden"
    matchText.className = "text-success"
    return true
  } else {
    matchText.textContent = "✗ Las contraseñas no coinciden"
    matchText.className = "text-danger"
    return false
  }
}

function validateForm() {
  const newPassword = document.getElementById("newPassword").value
  const confirmPassword = document.getElementById("confirmPassword").value
  const submitBtn = document.getElementById("submitBtn")

  const isPasswordStrong = checkPasswordStrength(newPassword)
  const doPasswordsMatch = checkPasswordMatch()

  if (isPasswordStrong && doPasswordsMatch && newPassword !== "" && confirmPassword !== "") {
    submitBtn.disabled = false
    submitBtn.classList.remove("btn-secondary")
    submitBtn.classList.add("btn-success")
  } else {
    submitBtn.disabled = true
    submitBtn.classList.remove("btn-success")
    submitBtn.classList.add("btn-secondary")
  }
}

async function handlePasswordChange(e) {
  e.preventDefault()

  const newPassword = document.getElementById("newPassword").value
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get("token")

  if (!token) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Token de cambio de contraseña no válido",
    })
    return
  }

  try {
    Swal.fire({
      title: "Cambiando contraseña...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
        newPassword: newPassword,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Error al cambiar la contraseña")
    }

    Swal.fire({
      icon: "success",
      title: "¡Contraseña Cambiada!",
      text: "Tu contraseña ha sido actualizada correctamente",
      confirmButtonText: "Iniciar Sesión",
    }).then(() => {
      window.location.href = "/"
    })
  } catch (error) {
    console.error("Error changing password:", error)
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo cambiar la contraseña. Inténtalo de nuevo.",
    })
  }
}
