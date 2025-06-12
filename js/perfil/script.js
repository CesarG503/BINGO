const miniperfil = document.getElementById("imagenPequeña");
const img1 = document.getElementById("mainProfileImg");
const img2 = document.getElementById("mainProfileImg2");


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

function toggleImageDropdown() {
    const dropdown = document.getElementById("imageDropdown");
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
}

function selectPresetImage(img) {
    const src = img.src;
    img1.src = src;
    img2.src = src;
    img2.alt = img.alt;

    document.getElementById("imageDropdown").style.display = "none";
}


function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function hacerEditable(id) {
    const span = document.getElementById(id);
    const currentText = span.textContent;

    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.className = "edit-input";
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





