import { slide } from "./slide.js";
// const wrapper = document.getElementById("wrapper");
let posicion = 0;
const cardList = document.getElementById("cardList"); //bolas seleccionadas por el usuario
const fondo = [
  "bg-primary",
  "bg-success",
  "bg-info",
  "bg-warning",
  "bg-danger",
];

let bolasSeleccionadas = [3, 17, 48,32, 64, 70, 75, 1, 15, 29, 45, 60, 66, 72, 74];

let diccionarioCartones = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
};

let tarjeta = [
  [
    [1, 16, 31, 46, 61],
    [2, 17, 32, 47, 62],
    [3, 18, "FREE", 48, 63],
    [4, 19, 34, 49, 64],
    [5, 20, 35, 50, 65],
  ],
  [
    [6, 21, 36, 51, 66],
    [7, 22, 37, 52, 67],
    [8, 23, "FREE", 53, 68],
    [9, 24, 39, 54, 69],
    [10, 25, 40, 55, 70],
  ],
  [
    [11, 26, 41, 56, 71],
    [12, 27, 42, 57, 72],
    [13, 28, "FREE", 58, 73],
    [14, 29, 44, 59, 74],
    [15, 30, 45, 60, 75],
  ],
  [
    [1, 16, 31, 46, 61],
    [2, 17, 32, 47, 62],
    [3, 18, "FREE", 48, 63],
    [4, 19, 34, 49, 64],
    [5, 20, 35, 50, 65],
  ],
];

for (let i = 0; i < tarjeta.length; i++) {
  renderCard(tarjeta[i]);
  posicion++;
}

function renderCard(arreglo) {
  const li = document.createElement("li");
  li.className = "card-item swiper-slide";

  // contenedor general
  const container = document.createElement("div");
  container.className = "tablas-numeros text-center";
  container.id = "carton-" + (posicion + 1);

  // título
  const h2 = document.createElement("h2");
  h2.className = "badge my-3";
  h2.textContent = "Carton #" + (posicion + 1);
  container.appendChild(h2);

  // cartón visual
  const carton = document.createElement("div");
  carton.className = "carton visible g-col-12 g-col-md-6 g-col-xl-4";

  // tabla
  const table = document.createElement("table");
  table.className = "tabla-numeros";

  // THEAD
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");

  const letras = ["b", "i", "n", "g", "o"];

  for (let i = 0; i < letras.length; i++) {
    const th = document.createElement("th");
    th.className = fondo[i];
    const div = document.createElement("div");
    div.className = "bola bola-" + letras[i];

    div.textContent = letras[i].toUpperCase();
    th.appendChild(div);
    trHead.appendChild(th);
  }

  thead.appendChild(trHead);
  table.appendChild(thead);

  // TBODY
  const tbody = document.createElement("tbody");

  for (let i = 0; i < arreglo.length; i++) {
    const tr = document.createElement("tr");
    for (let j = 0; j < arreglo[i].length; j++) {
      const td = document.createElement("td");
      td.textContent = arreglo[i][j];
      td.className = "seleccionable";
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  carton.appendChild(table);
  container.appendChild(carton);
  li.appendChild(container);
  cardList.appendChild(li);
}

// Aun no se como guardar las que ya fueron seleccionadas
document.getElementById("cardList").addEventListener("click", (e) => {
  const target = e.target;
  console.log(target);

  if(!e.target.classList.contains("seleccionable"))return;
  target.classList.toggle("bolaSeleccionada");
  

  // if (bolasSeleccionadas.includes(parseInt(target.innerText))) {
  //   console.log("Se puede seleccionar la bola");
  //   target.classList.add(fondo[asignarColor(parseInt(target.innerText))]);
  // } else {
  //   console.log("Bola no seleccionable");
  // }
});

function asignarColor(numeroBola) {
  if (numeroBola > 0 && numeroBola <= 15) {
    return 0;
  } else if (numeroBola > 15 && numeroBola <= 30) {
    return 1;
  } else if (numeroBola > 30 && numeroBola <= 45) {
    return 2;
  } else if (numeroBola > 45 && numeroBola <= 60) {
    return 3;
  } else if (numeroBola > 60 && numeroBola <= 75) {
    return 4;
  }
}