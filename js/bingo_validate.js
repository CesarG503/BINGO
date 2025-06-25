function validarCarton(numerosCarton, numerosSeleccionados, idPartida) {
    const respose = fetch(`https://bingo-api.mixg-studio.workers.devapi/partida/${idPartida}`);
    if (!respose.ok) {
        console.error('Error al obtener los datos de la partida');
        return false;
    }
    const data = respose.json();


    // Verificar si hay al menos un número seleccionado
    if (numerosSeleccionados.length === 0) {
        return false;
    }

  

    //Verificar si los numeros seleccionados son los de la base de datos
    for (let fila = 0; fila < numerosSeleccionados.length; fila++) {
        for (let col = 0; col < numerosSeleccionados[fila].length; col++) {
            if (numerosSeleccionados[fila][col] !== -1 && !data.numbers.includes(numerosSeleccionados[fila][col])) {
                console.error(`Número seleccionado ${numerosSeleccionados[fila][col]} no está en la base de datos`);
                return false;
            }
        }
    }

    // Validar filas
    for (let fila = 0; fila < numerosCarton.length; fila++) {
        let bingoFila = true;
        for (let col = 0; col < numerosCarton[fila].length; col++) {
            if (numerosSeleccionados[fila][col] !== -1) {
                bingoFila = false;
                break;
            }
        }
        if (bingoFila) return true;
    }

    // Validar columnas
    for (let col = 0; col < numerosCarton[0].length; col++) {
        let bingoCol = true;
        for (let fila = 0; fila < numerosCarton.length; fila++) {
            if (numerosSeleccionados[fila][col] !== -1) {
                bingoCol = false;
                break;
            }
        }
        if (bingoCol) return true;
    }

    // Validar diagonal principal
    let bingoDiag1 = true;
    for (let i = 0; i < numerosCarton.length; i++) {
        if (numerosSeleccionados[i][i] !== -1) {
            bingoDiag1 = false;
            break;
        }
    }
    if (bingoDiag1) return true;

    // Validar diagonal secundaria
    let bingoDiag2 = true;
    for (let i = 0; i < numerosCarton.length; i++) {
        if (numerosSeleccionados[i][numerosCarton.length - 1 - i] !== -1) {
            bingoDiag2 = false;
            break;
        }
    }
    if (bingoDiag2) return true;

    // Si no hay bingo
    console.log('No hay bingo en el carton');
    return false;
}

module.exports = {
    validarCarton
};