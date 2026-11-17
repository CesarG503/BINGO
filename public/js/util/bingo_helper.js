/**
 * Utilidades para el manejo de bolas y columnas de Bingo 75
 * Columnas:
 *  - B: 1  a 15  (Color: #DCC9A9 - Crema / Arena)
 *  - I: 16 a 30  (Color: #4E6851 - Verde Oliva)
 *  - N: 31 a 45  (Color: #4B848A - Azul Petróleo / Teal)
 *  - G: 46 a 60  (Color: #FBC359 - Amarillo Oro)
 *  - O: 61 a 75  (Color: #E70103 - Rojo Intenso)
 */

export const BINGO_COLUMNAS = [
  { letra: "B", min: 1,  max: 15, colorClass: "bola-b", headerClass: "bingo-header-b", hexColor: "#DCC9A9", nombre: "Columna B" },
  { letra: "I", min: 16, max: 30, colorClass: "bola-i", headerClass: "bingo-header-i", hexColor: "#4E6851", nombre: "Columna I" },
  { letra: "N", min: 31, max: 45, colorClass: "bola-n", headerClass: "bingo-header-n", hexColor: "#4B848A", nombre: "Columna N" },
  { letra: "G", min: 46, max: 60, colorClass: "bola-g", headerClass: "bingo-header-g", hexColor: "#FBC359", nombre: "Columna G" },
  { letra: "O", min: 61, max: 75, colorClass: "bola-o", headerClass: "bingo-header-o", hexColor: "#E70103", nombre: "Columna O" },
];

/**
 * Obtiene la información completa de columna, letra y color de una bola de bingo.
 * @param {number|string} numero - El número extraído (1 - 75)
 * @returns {object} { numero, letra, colorClass, headerClass, hexColor, nombre, rango, columnaIndex }
 */
export function obtenerInfoBola(numero) {
  const num = parseInt(numero, 10);
  if (isNaN(num) || num < 1 || num > 75) {
    return {
      numero: numero || "--",
      letra: "--",
      colorClass: "bola-espera",
      headerClass: "",
      hexColor: "#777777",
      nombre: "Sin Columna",
      rango: "",
      columnaIndex: -1
    };
  }

  for (let i = 0; i < BINGO_COLUMNAS.length; i++) {
    const col = BINGO_COLUMNAS[i];
    if (num >= col.min && num <= col.max) {
      return {
        numero: num,
        letra: col.letra,
        colorClass: col.colorClass,
        headerClass: col.headerClass,
        hexColor: col.hexColor,
        nombre: col.nombre,
        rango: `${col.min} - ${col.max}`,
        columnaIndex: i
      };
    }
  }

  return {
    numero: num,
    letra: "--",
    colorClass: "bola-espera",
    headerClass: "",
    hexColor: "#777777",
    nombre: "Sin Columna",
    rango: "",
    columnaIndex: -1
  };
}

/**
 * Obtiene la letra de la columna de un número (B, I, N, G, O)
 * @param {number|string} numero
 * @returns {string}
 */
export function obtenerLetraColumna(numero) {
  return obtenerInfoBola(numero).letra;
}

/**
 * Obtiene la clase CSS de color para la bola ('bola-b', 'bola-i', etc.)
 * @param {number|string} numero
 * @returns {string}
 */
export function obtenerColorBola(numero) {
  return obtenerInfoBola(numero).colorClass;
}

/**
 * Formatea una bola para mostrar su columna y número (ej. "B-7", "N-38")
 * @param {number|string} numero
 * @returns {string}
 */
export function formatearBola(numero) {
  const info = obtenerInfoBola(numero);
  if (info.letra === "--") return String(numero);
  return `${info.letra}-${info.numero}`;
}

/**
 * Limpia todas las clases de color de bola en un elemento DOM
 * @param {HTMLElement} elemento
 */
export function limpiarClasesColorBola(elemento) {
  if (!elemento) return;
  const clases = ["bola-b", "bola-i", "bola-n", "bola-g", "bola-o", "bola-espera", "bola-black"];
  elemento.classList.remove(...clases);
}

/**
 * Crea un elemento DOM de bola de bingo (con el diseño auténtico del anfitrión)
 * @param {number|string} numero - Número de la bola
 * @param {object} options - Opciones adicionales ({ isLatest: boolean, size: string, onClick: function })
 * @returns {HTMLElement}
 */
export function crearElementoBola(numero, options = {}) {
  const info = obtenerInfoBola(numero);
  const div = document.createElement("div");
  div.className = `bola ${info.colorClass} bola-llamada ${options.isLatest ? "is-latest" : ""}`;
  div.setAttribute("data-number", info.numero);
  div.setAttribute("data-col", info.letra.toLowerCase());
  div.setAttribute("title", `${info.nombre} - Número ${info.numero}`);

  const spanLetra = document.createElement("span");
  spanLetra.className = "bola-letra-mini";
  spanLetra.textContent = info.letra;

  const spanNumero = document.createElement("span");
  spanNumero.className = "bola-numero-mini";
  spanNumero.textContent = info.numero;

  div.appendChild(spanLetra);
  div.appendChild(spanNumero);

  if (typeof options.onClick === "function") {
    div.addEventListener("click", () => options.onClick(info));
  }

  return div;
}

/**
 * Genera el elemento DOM del cartón del ganador con las casillas ganadoras y seleccionadas claramente resaltadas.
 * @param {Array<Array<number|string>>} cartonData - Matriz 5x5 del cartón
 * @param {Array<number>} numerosSeleccionados - Números marcados por el usuario
 * @param {Array<number>} numerosGanadores - Números que forman el patrón ganador
 * @returns {HTMLElement}
 */
export function generarCartonGanadorDOM(cartonData, numerosSeleccionados = [], numerosGanadores = []) {
  const container = document.createElement("div");
  container.className = "tablas-numeros text-center my-2 w-100";
  container.style.maxWidth = "330px";
  container.style.margin = "0 auto";
  container.style.overflow = "hidden";

  const table = document.createElement("table");
  table.className = "tabla-numeros tabla-ganador shadow-lg mx-auto";
  table.style.width = "100%";
  table.style.maxWidth = "320px";

  const letras = ["b", "i", "n", "g", "o"];

  // THEAD
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");

  for (let i = 0; i < letras.length; i++) {
    const th = document.createElement("th");
    th.className = `bg-${["primary","success","info","warning","danger"][i]}-subtle th-col-${letras[i]}`;
    const div = document.createElement("div");
    div.className = `bola bola-${letras[i]}`;
    div.textContent = letras[i].toUpperCase();
    th.appendChild(div);
    trHead.appendChild(th);
  }
  thead.appendChild(trHead);
  table.appendChild(thead);

  // Normalizar listas a números
  const selNums = (numerosSeleccionados || []).map(n => Number(n)).filter(n => !isNaN(n));
  const winNums = (numerosGanadores || []).map(n => Number(n)).filter(n => !isNaN(n));

  // TBODY
  const tbody = document.createElement("tbody");
  for (let i = 0; i < cartonData.length; i++) {
    const tr = document.createElement("tr");
    for (let j = 0; j < cartonData[i].length; j++) {
      const td = document.createElement("td");
      const valor = cartonData[i][j];
      const colLetra = letras[j];
      td.textContent = valor;
      td.setAttribute("data-valor", valor);

      const numVal = Number(valor);
      const esFree = (valor === "FREE" || (i === 2 && j === 2));
      const esGanador = (!esFree && winNums.includes(numVal)) || (esFree && winNums.length === 4);
      const esSeleccionado = (!esFree && selNums.includes(numVal)) || esFree;

      td.className = `col-bingo-${colLetra}`;

      if (esGanador) {
        td.classList.add("celda-ganadora", "bolaSeleccionada", "selected");
        td.setAttribute("title", `¡Número Ganador! ${valor}`);
      } else if (esSeleccionado) {
        td.classList.add("bolaSeleccionada", "selected");
        td.setAttribute("title", `Marcado: ${valor}`);
      }

      if (esFree) {
        td.classList.add("free-space");
      }

      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  container.appendChild(table);

  return container;
}

/**
 * Muestra un modal interactivo con todas las bolas extraídas hasta el momento,
 * organizadas por columnas B-I-N-G-O y en orden cronológico.
 * @param {Array<number>} numeros - Lista de números extraídos
 * @param {string} titulo - Título opcional
 */
export function mostrarModalBolasExtraidas(numeros = [], titulo = "Historial de Bolas Extraídas") {
  if (typeof Swal === "undefined") {
    console.error("SweetAlert2 no está disponible");
    return;
  }

  const nums = (numeros || []).map(n => Number(n)).filter(n => !isNaN(n) && n >= 1 && n <= 75);
  
  // Agrupar por columnas
  const grupos = { B: [], I: [], N: [], G: [], O: [] };
  nums.forEach((n) => {
    const col = obtenerLetraColumna(n);
    if (grupos[col]) grupos[col].push(n);
  });

  const renderBolasHtml = (listaBolas) => {
    if (!listaBolas || listaBolas.length === 0) {
      return '<span class="text-white-50 small fst-italic">Ninguna</span>';
    }
    return listaBolas
      .map(n => {
        const info = obtenerInfoBola(n);
        return `<div class="bola ${info.colorClass}" style="width: 38px; height: 38px; font-size: 0.85rem; display: inline-flex; margin: 3px; cursor: default;" title="${info.nombre} - ${n}">${n}</div>`;
      })
      .join("");
  };

  const html = `
    <div class="text-start" style="color: #fff; font-family: system-ui, sans-serif;">
      <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
        <span class="text-white-50 fs-6">Total extraídas: <strong class="text-warning">${nums.length}</strong> de 75</span>
        <span class="badge bg-primary-neon px-3 py-1">${Math.round((nums.length / 75) * 100)}% del juego</span>
      </div>

      <!-- Grupos por Columna B-I-N-G-O -->
      <div class="mb-4">
        <h6 class="text-white fw-bold mb-2"><i class="fas fa-th me-2 text-info"></i>Bolas por Columna:</h6>
        
        <div class="d-flex flex-column gap-2">
          <!-- B -->
          <div class="p-2 rounded-3" style="background: rgba(88, 80, 68, 0.25); border-left: 4px solid #DCC9A9;">
            <div class="d-flex align-items-center gap-2 mb-1">
              <strong style="color: #DCC9A9;">B (1-15):</strong>
              <small class="text-white-50">(${grupos.B.length} bolas)</small>
            </div>
            <div class="d-flex flex-wrap align-items-center">${renderBolasHtml(grupos.B.sort((a,b)=>a-b))}</div>
          </div>

          <!-- I -->
          <div class="p-2 rounded-3" style="background: rgba(31, 42, 32, 0.25); border-left: 4px solid #4E6851;">
            <div class="d-flex align-items-center gap-2 mb-1">
              <strong style="color: #7cb884;">I (16-30):</strong>
              <small class="text-white-50">(${grupos.I.length} bolas)</small>
            </div>
            <div class="d-flex flex-wrap align-items-center">${renderBolasHtml(grupos.I.sort((a,b)=>a-b))}</div>
          </div>

          <!-- N -->
          <div class="p-2 rounded-3" style="background: rgba(30, 53, 55, 0.25); border-left: 4px solid #4B848A;">
            <div class="d-flex align-items-center gap-2 mb-1">
              <strong style="color: #5ecad4;">N (31-45):</strong>
              <small class="text-white-50">(${grupos.N.length} bolas)</small>
            </div>
            <div class="d-flex flex-wrap align-items-center">${renderBolasHtml(grupos.N.sort((a,b)=>a-b))}</div>
          </div>

          <!-- G -->
          <div class="p-2 rounded-3" style="background: rgba(100, 78, 36, 0.25); border-left: 4px solid #FBC359;">
            <div class="d-flex align-items-center gap-2 mb-1">
              <strong style="color: #FBC359;">G (46-60):</strong>
              <small class="text-white-50">(${grupos.G.length} bolas)</small>
            </div>
            <div class="d-flex flex-wrap align-items-center">${renderBolasHtml(grupos.G.sort((a,b)=>a-b))}</div>
          </div>

          <!-- O -->
          <div class="p-2 rounded-3" style="background: rgba(92, 0, 1, 0.25); border-left: 4px solid #E70103;">
            <div class="d-flex align-items-center gap-2 mb-1">
              <strong style="color: #ff6e6e;">O (61-75):</strong>
              <small class="text-white-50">(${grupos.O.length} bolas)</small>
            </div>
            <div class="d-flex flex-wrap align-items-center">${renderBolasHtml(grupos.O.sort((a,b)=>a-b))}</div>
          </div>
        </div>
      </div>

      <!-- Orden de Salida -->
      <div>
        <h6 class="text-white fw-bold mb-2"><i class="fas fa-history me-2 text-warning"></i>Orden de Extracción (más reciente primero):</h6>
        <div class="d-flex flex-wrap align-items-center p-2 rounded-3" style="background: rgba(0,0,0,0.3); max-height: 160px; overflow-y: auto;">
          ${renderBolasHtml([...nums].reverse())}
        </div>
      </div>
    </div>
  `;

  Swal.fire({
    title: `<i class="fas fa-bullhorn text-warning me-2"></i>${titulo}`,
    html: html,
    width: "min(95vw, 720px)",
    padding: "1.25em 0.8em",
    background: "#1c1f2e",
    color: "#fff",
    showCloseButton: true,
    showConfirmButton: true,
    confirmButtonText: "Cerrar",
    confirmButtonColor: "#059669",
    customClass: {
      popup: "swal-carton-ganador-popup"
    }
  });
}
