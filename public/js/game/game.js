import { emitirNumeroNuevo, btnNuevoNumero } from '/js/room/host_connection.js';

let carrusel = document.getElementById("carrusel");
let canva = document.querySelector(".canva");
const repeticiones = 9;
const x = 3; //Duración de animaciones
const desplazamientoX = ((-630 * repeticiones) + 630)  + 'px' //Para calcular el desplazamiento
let numerosLlamados = new Set(); // Array para almacenar los números llamados

//Se recibe el numero seleccionado por el host
export async function iniciarRuletazo(select, id_room, id_host) {
  // limpiamos el carrusel para no tener bugs
  carrusel.innerHTML = null;

  // Agregar conjunto final con el número seleccionado en el centro
  carrusel.append(...createSeleccionado(select));

  // Creamos una nueva promesa para poder eliminar los numeros generados
  await new Promise((resolve) => {
    gsap
      .timeline({ onComplete: resolve })
      .to(carrusel, {
        x: desplazamientoX,
        duration: x,
        ease: "power4.out",
      })
    });
    eliminarNumber();
    
    // Para que la pelota salga de su lugar
    await new Promise((resolve) => {
      gsap.timeline({ onComplete: resolve })
      .to(carrusel, {
        x: "0",
        duration: 0,
      })
      .call(() => {
        visibleCanva()
      });
    });

      emitirNumeroNuevo(select, id_room, id_host);

      await new Promise((resolve) => {
      gsap
      .timeline({ onComplete: resolve })
      .to("#seleccionado", {
        //boxShadow: "0 0 25px 10px #fff",
        scale: 2.5,
        y: 20,
        duration: x,
        ease: "elastic.out",
      })
      .to("#seleccionado", {
        y: "+=150",
        scale: 1.2,
        autoAlpha: 0,
        duration: 1,
        ease: "bounce.out",
      })
      .call(() => {
        addBallGrid(select);
        visibleCanva();
        carrusel.append(...crearBolasExtras());
      })
      .to(carrusel, {
        x: "-=630",
        duration: x,
        delay: 2,
        ease: "power4.out",
      });
  });
  btnNuevoNumero.disabled = false; // Habilitar el botón de nuevo número
}

// Devuelve una colección de bolas,
function createSeleccionado(numero) {
  //se le pasa el numero que retorne la API
  let bolasTotal = repeticiones * 9
  const wrapper = document.createElement("div");
  for (let i = 0; i < bolasTotal; i++) {
    const bola = document.createElement("div");
    bola.classList.add("bola");
    if (i === bolasTotal-5) {
      bola.innerText = numero;
      bola.style.zIndex = "2";
      bola.setAttribute("id", "seleccionado");
    } else {
      bola.innerText = getRandomInteger(1, 75);
    }
    bola.classList.add(asignarColor(bola.innerText));
    wrapper.appendChild(bola);
  }

  return wrapper.children;
}

// Devuelve una colección de bolas,
function crearBolasExtras() {

  const wrapper = document.createElement("div");
  for (let i = 0; i < 9; i++) {
    const bola = document.createElement("div");
    bola.classList.add("bola");
    bola.innerText = getRandomInteger(1, 75);
    bola.classList.add(asignarColor(bola.innerText));
    wrapper.appendChild(bola);
  }

  return wrapper.children;
}


// Eliminar numeros generados aleatoriamente y resete
function eliminarNumber() {
  const carrusel = document.getElementById("carrusel");
  const hijos = [...carrusel.children];

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
    return "bola-b";
  } else if (numeroBola > 15 && numeroBola <= 30) {
    return "bola-i";
  } else if (numeroBola > 30 && numeroBola <= 45) {
    return "bola-n";
  } else if (numeroBola > 45 && numeroBola <= 60) {
    return "bola-g";
  } else if (numeroBola > 60 && numeroBola <= 75) {
    return "bola-o";
  }
}

function limpiarClaseColor(bolaElement) {
  const clasesColor = ["bola-b", "bola-i", "bola-n", "bola-g", "bola-o"];
  bolaElement.classList.remove(...clasesColor);
}


export async function addBallGrid(numeroBola) {
  // El navegador me agregar tbody asi que F
  let index;
  let indexFila;
  const table = document.getElementById("tableBall");
  const ball = document.createElement("div");
  const bolaSelec = document.getElementById("bola-selec");
  ball.innerText = numeroBola;
  bolaSelec.textContent = numeroBola;

  if (numeroBola > 0 && numeroBola <= 15) {
    ball.classList.add("bola", "bola-b");
    limpiarClaseColor(bolaSelec);
    bolaSelec.classList.add("bola-selec", "bola-b");
    index = 0;
  } else if (numeroBola > 15 && numeroBola <= 30) {
    ball.classList.add("bola", "bola-i");
    limpiarClaseColor(bolaSelec);
    bolaSelec.classList.add("bola-selec", "bola-i");
    index = 1;
  } else if (numeroBola > 30 && numeroBola <= 45) {
    ball.classList.add("bola", "bola-n");
    limpiarClaseColor(bolaSelec);
    bolaSelec.classList.add("bola-selec", "bola-n");
    index = 2;
  } else if (numeroBola > 45 && numeroBola <= 60) {
    ball.classList.add("bola", "bola-g");
    limpiarClaseColor(bolaSelec);
    bolaSelec.classList.add("bola-selec", "bola-g");
    index = 3;
  } else if (numeroBola > 60 && numeroBola <= 75) {
    ball.classList.add("bola", "bola-o");
    limpiarClaseColor(bolaSelec);
    bolaSelec.classList.add("bola-selec", "bola-o");
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
  await new Promise((resolve) => {
    gsap
      .timeline({ onComplete: resolve })
      .to(bolaSelec, {
        y: -20, // Se eleva un poco
        scale: 1.2, // Se estira un poco
        duration: 0.3, // Corto para sensación rápida
        ease: "power2.out",
      })
      .to(bolaSelec, {
        y: 0,
        scale: 0.95, // Rebote pequeño al tocar el suelo
        duration: 0.2,
        ease: "bounce.out",
      })
      .to(bolaSelec, {
        scale: 1,
        duration: 0.2,
        ease: "elastic.out(1, 0.3)",
      });
  });
  numerosLlamados.add(numeroBola); 
}

function visibleCanva(){
  const current = canva.style.overflow;
  canva.style.overflow = current === "visible" ? "hidden" : "visible";
}