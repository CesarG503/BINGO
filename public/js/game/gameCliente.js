// const wrapper = document.getElementById("wrapper");
let posicion = 0
const cardList = document.getElementById("cardList");

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
    [11, 12, 13, 14, 15],
    [26, 27, 28, 29, 30],
    [41, 42, "FREE", 44, 45],
    [56, 57, 58, 59, 60],
    [71, 72, 73, 74, 75],
  ],
  [
    [11, 12, 13, 14, 15],
    [26, 27, 28, 29, 30],
    [41, 42, "FREE", 44, 45],
    [56, 57, 58, 59, 60],
    [71, 72, 73, 74, 75],
  ],
];

tarjeta.forEach((arreglo) => {
  renderCard(arreglo);
  posicion++;
});

function renderCard(arreglo) {
  const li = document.createElement("li");
  li.className = "card-item swiper-slide";
  li.innerHTML = `
    <div class="tablas-numeros text-center">
      <h2 class="badge">Carton ${posicion + 1}</h2>
      <div class="carton visible g-col-12 g-col-md-6 g-col-xl-4">
        <table class="">
          <thead>
            <tr>
              <th class="bola bola-b">B</th>
              <th class="bola bola-i">I</th>
              <th class="bola bola-n">N</th>
              <th class="bola bola-g">G</th>
              <th class="bola bola-o">O</th>
            </tr>
          </thead>
          <tbody>
            ${arreglo.map(row => `<tr>${row.map(num => `<td>${num}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  cardList.appendChild(li);
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
    790: {
      slidesPerView: 2,
    },
    1000: {
      slidesPerView: 3,
    },
  },
});

