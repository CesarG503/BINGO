import { emitirNumeroNuevo, btnNuevoNumero } from '/js/room/host_connection.js';

let carrusel = document.getElementById("carrusel");
let canva = document.querySelector(".canva");
let numerosLlamados = new Set(); // Array para almacenar los números llamados

// Se recibe el numero seleccionado por el host
export async function iniciarRuletazo(select, id_room, id_host) {
  // Aseguramos estado inicial limpio del carrusel y overflow
  if (canva) {
    canva.classList.remove("canva-visible-overflow");
    canva.style.overflow = "hidden";
  }
  carrusel.innerHTML = "";
  gsap.set(carrusel, { x: 0 });

  // Agregar conjunto de bolas para la ruleta
  carrusel.append(...createSeleccionado(select));

  const seleccionado = document.getElementById("seleccionado");
  if (!seleccionado) {
    console.error("No se encontró la bola seleccionada");
    btnNuevoNumero.disabled = false;
    return;
  }

  // Calculamos el desplazamiento exacto para centrar #seleccionado en el punto medio del carril
  const canvaCenter = canva.clientWidth / 2;
  const seleccionadoCenter = seleccionado.offsetLeft + (seleccionado.offsetWidth / 2);
  const targetX = Math.round(canvaCenter - seleccionadoCenter);

  // 1. Giro suave de la ruleta: desacelera gradualmente y se detiene EXACTAMENTE en la bola elegida
  await new Promise((resolve) => {
    gsap.to(carrusel, {
      x: targetX,
      duration: 3.2,
      ease: "power3.out", // Desaceleración fluida y natural, sin paradas en seco
      onComplete: resolve,
    });
  });

  // Ocultamos todas las bolas que quedaron fuera de la ventana visible del carril
  // antes de activar overflow: visible, evitando que aparezcan flotando a los lados
  const canvaRect = canva.getBoundingClientRect();
  const bolas = [...carrusel.children];
  bolas.forEach((b) => {
    if (b === seleccionado) return;
    const bRect = b.getBoundingClientRect();
    if (bRect.right < canvaRect.left + 8 || bRect.left > canvaRect.right - 8) {
      b.style.visibility = "hidden";
    }
  });

  // 2. Elección suave y elegante de la bola (sin movimientos bruscos a los lados)
  setCanvaOverflow(true); // Permite que solo la bola elegida crezca sin ser recortada
  emitirNumeroNuevo(select, id_room, id_host);

  await new Promise((resolve) => {
    gsap.timeline({ onComplete: resolve })
      // A) Resalte suave y orgánico de la bola elegida
      .to(seleccionado, {
        scale: 2.15,
        y: 28, // Desciende suavemente al espacio libre sobre el tubo
        boxShadow: "0 0 28px 8px rgba(0, 240, 255, 0.65)",
        duration: 0.75,
        ease: "back.out(1.2)",
      })
      // B) Pausa suave para apreciar claramente el número
      .to(seleccionado, {
        scale: 2.15,
        duration: 0.55,
      })
      // C) Descenso fluido por el tubo hacia el contenedor
      .to(seleccionado, {
        y: "+=160",
        scale: 1.0,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power2.in",
      })
      .call(() => {
        addBallGrid(select);
        setCanvaOverflow(false);
      });
  });

  btnNuevoNumero.disabled = false; // Habilitar el botón de nuevo número
}

// Devuelve una colección de bolas para el giro
function createSeleccionado(numero) {
  const bolasAntes = 60; // Cantidad suficiente para un giro dinámico y fluido
  const bolasDespues = 8; // Mantiene el carril derecho completamente poblado al detenerse
  const totalBolas = bolasAntes + 1 + bolasDespues;
  const wrapper = document.createElement("div");

  for (let i = 0; i < totalBolas; i++) {
    const bola = document.createElement("div");
    bola.classList.add("bola");
    if (i === bolasAntes) {
      bola.innerText = numero;
      bola.style.zIndex = "2";
      bola.setAttribute("id", "seleccionado");
    } else {
      bola.innerText = getRandomInteger(1, 75);
    }
    bola.classList.add(asignarColor(Number(bola.innerText)));
    wrapper.appendChild(bola);
  }

  return wrapper.children;
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
  if (!bolaElement) return;
  const clasesColor = ["bola-b", "bola-i", "bola-n", "bola-g", "bola-o", "bola-espera", "bola-black"];
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

  const letras = ["B", "I", "N", "G", "O"];
  let letra = "B";
  let colorClass = "bola-b";

  if (numeroBola > 0 && numeroBola <= 15) {
    letra = "B";
    colorClass = "bola-b";
    index = 0;
  } else if (numeroBola > 15 && numeroBola <= 30) {
    letra = "I";
    colorClass = "bola-i";
    index = 1;
  } else if (numeroBola > 30 && numeroBola <= 45) {
    letra = "N";
    colorClass = "bola-n";
    index = 2;
  } else if (numeroBola > 45 && numeroBola <= 60) {
    letra = "G";
    colorClass = "bola-g";
    index = 3;
  } else if (numeroBola > 60 && numeroBola <= 75) {
    letra = "O";
    colorClass = "bola-o";
    index = 4;
  }

  ball.classList.add("bola", colorClass);

  if (bolaSelec) {
    limpiarClaseColor(bolaSelec);
    bolaSelec.classList.add("bola-selec", colorClass);

    const hostLetra = document.getElementById("host-bola-letra");
    const hostNumero = document.getElementById("host-bola-numero");
    if (hostLetra && hostNumero) {
      hostLetra.textContent = letra;
      hostNumero.textContent = numeroBola;
    } else {
      bolaSelec.innerHTML = `<span class="bola-letra">${letra}</span><span class="bola-numero">${numeroBola}</span>`;
    }

    // Efecto de pop/rebote al actualizar la bola
    bolaSelec.classList.remove("bola-pop");
    void bolaSelec.offsetWidth;
    bolaSelec.classList.add("bola-pop");
  }


  indexFila = numeroBola - index * 15; // Calculamos el indice en el que tiene que entrar
  const cell = table.children[index]?.children[indexFila];
  if (cell) {
    cell.innerHTML = "";
    cell.appendChild(ball);
  }

  ball.style.scale = 0;
  await new Promise((resolve) => {
    gsap.timeline({ onComplete: resolve })
      .to([ball, bolaSelec], {
        y: -16,
        scale: 1.15,
        duration: 0.25,
        ease: "power2.out",
      })
      .to([ball, bolaSelec], {
        y: 0,
        scale: 0.96,
        duration: 0.2,
        ease: "bounce.out",
      })
      .to([ball, bolaSelec], {
        scale: 1,
        duration: 0.2,
        ease: "elastic.out(1, 0.4)",
      });
  });
  numerosLlamados.add(numeroBola); 
}

function setCanvaOverflow(visible) {
  if (canva) {
    if (visible) {
      canva.classList.add("canva-visible-overflow");
      canva.style.overflow = "visible";
    } else {
      canva.classList.remove("canva-visible-overflow");
      canva.style.overflow = "hidden";
    }
  }
}