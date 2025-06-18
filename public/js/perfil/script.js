// ===============================
// Referencias a elementos del DOM
// ===============================

const miniperfil = document.getElementById("imagenPequeña");
const img1 = document.getElementById("mainProfileImg");
const img2 = document.getElementById("mainProfileImg2");

// ===============================
// Mostrar/Ocultar panel lateral de perfil
// ===============================
let ocultar = false;
function toggleProfilePanel() {
    const panel = document.getElementById("profilePanel");
    panel.classList.toggle("show");

    if (ocultar === false) {
        img2.src = img1.src;
        miniperfil.classList.add("d-none")
        ocultar = true;
    } else {
        img2.src = '';
        miniperfil.classList.remove("d-none");
        ocultar = false;
    }
}

// ===============================
// Mostrar/Ocultar el menú desplegable de imágenes
// ===============================
function toggleImageDropdown() {
    const dropdown = document.getElementById("imageDropdown");

    // Alternar visibilidad
    if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
        document.removeEventListener("click", outsideClickListener);
    } else {
        dropdown.style.display = "block";
        // Agrega el listener para detectar clics fuera
        setTimeout(() => {
            document.addEventListener("click", outsideClickListener);
        }, 0);
    }

    // Función interna para detectar clic fuera
    function outsideClickListener(event) {
        const isClickInside = dropdown.contains(event.target) || event.target.id === "imageDropdownBtn"; // si tienes un botón
        if (!isClickInside) {
            dropdown.style.display = "none";
            document.removeEventListener("click", outsideClickListener);
        }
    }
}


// ===============================
// Crea la lista de imágenes
// ===============================
function crearImagenes(){
    const divImgs = document.getElementById("listImgs");

    for (let i = 1; i < 12; i++) {
        let img = document.createElement("img");
        img.src = `https://bingo-api.mixg-studio.workers.dev/api/profile/${i}`;
        img.alt = i;
        img.className = "preset-avatar profile-img";
        img.setAttribute("onclick", "selectPresetImage(this)");
        img.id="Avatar"
        
        divImgs.appendChild(img);
    }
}
crearImagenes()

// ===============================
// Seleccionar una imagen preestablecida
// ===============================
function selectPresetImage(img) {
    const src = img.src;
    img1.src = src;
    img2.src = src;
    img2.alt = img.alt;

    document.getElementById("imageDropdown").style.display = "none";
}

// ===============================
// Validar formato de correo electrónico
// ===============================
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// ===============================
// Hacer editable un campo de texto (conversión span -> input)
// ===============================
function hacerEditable(id) {
    const span = document.getElementById(id);
    const currentText = span.textContent;

    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.className = "editable-text me-2";
    input.id = id;

    // Prevenir duplicados
    let error = document.getElementById(`${id}-error`);
    if (!error) {
        error = document.createElement("div");
        error.id = `${id}-error`;
        error.className = "text-danger mt-1";
        error.style.fontSize = "0.9rem";
        span.parentNode.appendChild(error);
    } else {
        error.textContent = "";
    }

    span.replaceWith(input);
    input.focus();

    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            guardarTexto(input);
        }
    });

    input.addEventListener("blur", function () {
        guardarTexto(input);
    });
}

// ===============================
// Guardar el texto editado (conversión input -> span)
// ===============================

function guardarTexto(input) {
    if (input.dataset.saved === "true") return;
    input.dataset.saved = "true";

    const value = input.value.trim();
    const id = input.id;
    const errorElem = document.getElementById(`${id}-error`);

    if (value === "") {
        errorElem.textContent = "Este campo no puede estar vacío.";
        input.focus();
        input.dataset.saved = "false"; // permitir reintento
        return;
    }

    if (id === "email" && !validarEmail(value)) {
        errorElem.textContent = "El email no es válido.";
        input.focus();
        input.dataset.saved = "false";
        return;
    }

    errorElem.remove();

    const span = document.createElement("span");
    span.id = id;
    span.className = "editable-text me-2";
    span.textContent = value;
    input.replaceWith(span);
}


