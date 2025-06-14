let carrusel = document.getElementById("carrusel");
const repeticiones = 5;
const x = 6; //Duración de animaciones


export async function iniciarRuletazo() {
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
  const select = getRandomInteger(1, 75);
  // Agregar conjunto final con el número seleccionado en el centro
  carrusel.append(...createSeleccionado(select));

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
        //cae pelota
        scale: 1.2,
        y: 400,
        autoAlpha: 0,
        duration: x, //cambiar a 3.5
        ease: "power1.in",
      })
      .call(() => {
        addBallGrid(select);
      })
      .to(carrusel, {
        x: "-=630",
        duration: x,
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
    if (i === 4) {
      bola.innerText = numero;
      // bola.classList.add('posotion-relative')
    } else {
      bola.innerText = getRandomInteger(1, 75);
    }
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

async function addBallGrid(numeroBola) {
  // El navegador me agregar tbody asi que F
  let index;
  let indexFila;
  const table = document.getElementById("tableBall");
  const ball = document.createElement("div");
  ball.innerText = numeroBola;

  console.log(table.children[2].children);

  if (numeroBola > 0 && numeroBola <= 15) {
    ball.classList.add("bola", "bg-primary-neon");
    index = 0;
  } else if (numeroBola > 15 && numeroBola <= 30) {
    ball.classList.add("bola", "bg-info-neon");
    index = 1;
  } else if (numeroBola > 30 && numeroBola <= 45) {
    ball.classList.add("bola", "bg-success-neon");
    index = 2;
  } else if (numeroBola > 45 && numeroBola <= 60) {
    ball.classList.add("bola", "bg-danger-neon");
    index = 3;
  } else if (numeroBola > 60 && numeroBola <= 75) {
    ball.classList.add("bola", "bg-warning-neon");
    index = 4;
  }

  indexFila = numeroBola - index * 15; //Calculamos el indice en el que tiene que entrar
  console.log(indexFila);
  table.children[index].children[indexFila].appendChild(ball);
  ball.style.scale = 0;
  await new Promise((resolve) => {
    gsap
      .timeline({ onComplete: resolve })
      .to(ball, {
        y: -20, // Se eleva un poco
        scale: 1.2, // Se estira un poco
        duration: 0.3, // Corto para sensación rápida
        ease: "power2.out",
      })
      .to(ball, {
        y: 0,
        scale: 0.95, // Rebote pequeño al tocar el suelo
        duration: 0.2,
        ease: "bounce.out",
      })
      .to(ball, {
        scale: 1,
        duration: 0.2,
        ease: "elastic.out(1, 0.3)",
      });
  });
}
