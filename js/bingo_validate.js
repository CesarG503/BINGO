async function validarCarton(tablero, seleccionados, idPartida) {
    let numerosGanadores = []
     const respose = await fetch(`/api/juego/estado/${idPartida}`);
    if (!respose.ok) {
        console.error('Error al obtener los datos de la partida');
        return [];
    }
    const data = await respose.json();
    if (!data || !data.numbers) {
        console.error('Datos de la partida no válidos');
        return [];
    }
    if(data.numbers.length === 0) {
        console.error('No hay números en la base de datos');
        return [];
    }

    for (let num of seleccionados) {
        if (num !== "FREE" && !data.numbers.includes(num)) {
            console.error(`Carton invalido`);
            return [];
        }
    }

    const n = tablero.length;

    function esLineaGanadora(linea) {
        linea.forEach(num => {
            if (seleccionados.includes(num)) {
                numerosGanadores.push(num);
            }
        });
        return linea.every(num => num === "FREE" || seleccionados.includes(num));
    }

    // Verificar filas
    for (let fila of tablero) {
        if (esLineaGanadora(fila)) {
            console.log(`Bingo en la fila ${tablero.indexOf(fila)}`);
            return numerosGanadores;
        }
        numerosGanadores.length = 0;
    }

    // Verificar columnas
    for (let col = 0; col < n; col++) {
        const columna = tablero.map(fila => fila[col]);
        if (esLineaGanadora(columna)) {
            console.log(`Bingo en la columna ${col}`);
            return numerosGanadores;
        }
        numerosGanadores.length = 0;
    }

    // Verificar diagonal principal
    const diagonalPrincipal = tablero.map((fila, i) => fila[i]);
    if (esLineaGanadora(diagonalPrincipal)) {
        console.log('Bingo en la diagonal principal');
        return numerosGanadores;
    }
    numerosGanadores.length = 0;

    // Verificar diagonal secundaria
    const diagonalSecundaria = tablero.map((fila, i) => fila[n - 1 - i]);
    if (esLineaGanadora(diagonalSecundaria)) {
        console.log('Bingo en la diagonal secundaria');
        return numerosGanadores;
    }
    numerosGanadores.length = 0;

    return numerosGanadores;
}

function validarCartonConReferencia(tablero, tableroReferencia, seleccionados) {
    const n = tablero.length;
    // Validar que las casillas seleccionadas correspondan a 1 en el tableroReferencia
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const valor = tablero[i][j];
            const referencia = tableroReferencia[i][j];
            if (seleccionados.includes(valor)) {
                if (referencia !== "1" && valor !== "FREE") {
                    return false;
                }
            } else {
                if (referencia === "1" && valor !== "FREE") {
                    return false;
                }
            }
        }
    }
    return true;
}

module.exports = {
    validarCarton,
    validarCartonConReferencia
};