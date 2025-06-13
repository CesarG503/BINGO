let carrusel = document.getElementById("carrusel");
const repeticiones = 5;
const x = 2; //Duración de animaciones

// Iniciar ruletazo con el boton
document.getElementById("newNumber").addEventListener("click", (e) => {
  e.preventDefault();
  iniciarRuletazo();
});

iniciarRuletazo();

async function iniciarRuletazo() {
  // limpiamos el carrusel para no tener bugs
  carrusel.innerHTML = null;

  // Creamos las bolas aleatorias
  for (let i = 0; i < repeticiones * 9; i++) {
    const bola = document.createElement("div");
    bola.classList.add("bola");

    bola.innerText = getRandomInteger(1, 75);
    bola.classList.add(asignarColor(bola.innerText));
    carrusel.appendChild(bola);
  }

  // Agregar conjunto final con el número seleccionado en el centro
  carrusel.append(...createSeleccionado(13));

  // Creamos una nueva promesa para poder eliminar los numeros generados
  await new Promise((resolve) => {
    gsap
      .timeline({ onComplete: resolve })
      .to(carrusel, {
        x: "-=3150",
        duration: x,
        ease: "power4.out",
      })
      .to("#seleccionado", {
        boxShadow: "0 0 25px 10px #fff",
        scale: 2.5,
        y: 20,
        duration: x,
        ease: "elastic.out",
      })
      .to("#seleccionado", {
        scale: 1.2,
        y: 400,
        autoAlpha: 0,
        duration: 3.5,
        ease: "power1.in",
      })
      .to(carrusel, {
        x: "-=630",
        duration: 5,
        delay: 2,
        ease: "power4.out",
      });
  });
  eliminarNumber();
  // Reseteamos
  console.log("hola");
  await new Promise((resolve) => {
    gsap.timeline({ onComplete: resolve }).to(carrusel, {
      x: "0",
      duration: 0,
    });
  });
}

// Devuelve una colección con 18 bolas,
function createSeleccionado(numero) {
  //se le pasa el numero que retorne la API
  const wrapper = document.createElement("div");
  for (let i = 0; i < 18; i++) {
    const bola = document.createElement("div");
    bola.classList.add("bola");
    bola.innerText = i === 4 ? numero : getRandomInteger(1, 75);
    bola.classList.add(asignarColor(bola.innerText));
    if (i === 4) bola.setAttribute("id", "seleccionado");
    wrapper.appendChild(bola);
  }
  console.log(wrapper.children);

  return wrapper.children;
}

// Eliminar numeros generados aleatoriamente y resete
function eliminarNumber() {
  const carrusel = document.getElementById("carrusel");
  const hijos = [...carrusel.children];
  console.log(hijos.length);

  for (let i = 0; i < hijos.length - 9; i++) {
    carrusel.removeChild(hijos[i]);
  }
}

// Funciones auxiliares
function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function asignarColor(numeroBola) {
  if (numeroBola > 0 && numeroBola <= 15) {
    return "bg-primary-neon";
  } else if (numeroBola > 15 && numeroBola <= 30) {
    return "bg-info-neon";
  } else if (numeroBola > 30 && numeroBola <= 45) {
    return "bg-success-neon";
  } else if (numeroBola > 45 && numeroBola <= 60) {
    return "bg-danger-neon";
  } else if (numeroBola > 60 && numeroBola <= 75) {
    return "bg-warning-neon";
  }
}
