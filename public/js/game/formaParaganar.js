const celdas = document.querySelectorAll(".tabla-bingo-patron td");

celdas.forEach(celda => {
    celda.addEventListener("click", () => {
        celda.classList.toggle("seleccionadotd");
    });
});