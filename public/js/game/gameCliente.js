// const wrapper = document.getElementById("wrapper");
let posicion = 0
const cardList = document.getElementById("cardList");
const bolasSeleccionadas = []; //bolas seleccionadas por el usuario

let tarjeta = [
  [
    [1, 2, 3, 4, 5],
    [17, 16, 18, 19, 20],
    [31, 32, "FREE", 34, 35],
    [46, 47, 48, 49, 50],
    [61, 62, 63, 64, 65],
  ],
  [
    [1, 2, 3, 4, 5],
    [17, 16, 18, 19, 20],
    [31, 32, "FREE", 34, 35],
    [46, 47, 48, 49, 50],
    [61, 62, 63, 64, 65],
  ],
  [
    [6, 7, 8, 9, 10],
    [21, 22, 23, 24, 25],
    [36, 37, "FREE", 39, 40],
    [51, 52, 53, 54, 55],
    [66, 67, 68, 69, 70],
  ],
  [
    [6, 7, 8, 9, 10],
    [21, 22, 23, 24, 25],
    [36, 37, "FREE", 39, 40],
    [51, 52, 53, 54, 55],
    [66, 67, 68, 69, 70],
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
  const fondo = ['bg-primary-subtle', 'bg-success-subtle', 'bg-info-subtle', 'bg-warning-subtle', 'bg-danger-subtle'];
  for (let i = 0; i < letras.length; i++) {
    const th = document.createElement("th");
    th.className =  fondo[i];
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
      const div = document.createElement("div");
      div.className = "bola bola-g"; // puedes personalizar según columna
      div.textContent = arreglo[i][j];
      td.appendChild(div);
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

function colorBolita(numero){
  

}



new Swiper(".card-wrapper", {
  loop: false,
  // centeredSlides: true, Pinche linea pedorra que me hizo ver todo el css como mil veces

  // If we need pagination
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
    dynamicBullets: true,
  },

  // Navigation arrows
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  // Reponsive
  breakpoints: {
    0: {
      slidesPerView: 1,
    },
    700: {
      slidesPerView: 2,
    },
    1000: {
      slidesPerView: 3,
    },
  },
});

