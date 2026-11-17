// js/bingo_validate.js
// Necesitarás obtener la función de la DB.
// Si no quieres inyectar la dependencia de la DB en el validador, 
// puedes pasar el patrón como un argumento adicional a validarCarton. 
// Pero, la forma más limpia aquí es importar la DB:

const { getNumerosLlamados, obtenerPatronGanador } = require('./db/partida'); 


// Tu validación de la lista de números llamados de la partida
async function obtenerNumerosLlamados(idPartida) {
    try {
        const numbers = await getNumerosLlamados(idPartida); 
        return numbers;
    } catch (e) {
        console.error('Error al obtener números llamados de DB:', e);
        return [];
    }
}


async function validarCarton(tablero, seleccionados, idPartida) {
    const n = tablero.length; // 5
    let numerosGanadores = [];
    
    // 1. Obtener la lista de números llamados y el patrón
    const numerosLlamados = await obtenerNumerosLlamados(idPartida);
    const patronGanador = await obtenerPatronGanador(idPartida); // Obtener el patrón de la DB

    if (!patronGanador || !Array.isArray(patronGanador) || patronGanador.length !== n) {
        console.error('No se pudo obtener un patrón ganador válido para la partida.');
        return [];
    }
    
    if (numerosLlamados.length === 0) {
        console.error('No hay números llamados en la partida.');
        return [];
    }
    
    // 2. Comparar el cartón del usuario con el patrón y los números llamados
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const numeroEnCarton = tablero[i][j];
            const debeEstarMarcado = patronGanador[i][j] === "1";
            const usuarioMarco = seleccionados.includes(numeroEnCarton);
            const esFreeSpace = numeroEnCarton === "FREE";

            if (debeEstarMarcado) {
                // A) El patrón requiere que la casilla esté marcada
                if (!usuarioMarco) {
                    console.log(`Falla: La casilla requerida en (${i}, ${j}) no está marcada.`);
                    return []; // No es un cartón ganador
                }
                
                // Si el usuario la marcó, debe ser un número llamado O el FREE space.
                const esNumeroValido = numerosLlamados.includes(numeroEnCarton) || esFreeSpace;
                
                if (!esNumeroValido) {
                    console.error(`Falla: El número ${numeroEnCarton} seleccionado no ha sido llamado.`);
                    return []; // La selección del usuario es inválida
                }

                // Si se cumple la condición, agrégalo a la lista de ganadores
                numerosGanadores.push(numeroEnCarton);

            } else {
                // B) El patrón NO requiere que la casilla esté marcada
                if (usuarioMarco && !esFreeSpace) {
                    // El usuario marcó una casilla que NO debe estar marcada (y no es el FREE space)
                    console.log(`Falla: Casilla ${numeroEnCarton} marcada que no es parte del patrón.`);
                    return []; // No es un cartón ganador
                }
                // Si el patrón NO requiere la casilla, y el usuario la marcó, debe ser el FREE space.
                // Si es el FREE space y el patrón no lo requiere, lo ignoramos a menos que se haya marcado.
            }
        }
    }
    
    // 3. Validar que la lista de seleccionados del usuario no tenga números NO llamados
    // Esta es una validación de trampa: asegura que el usuario no seleccionó números que no han salido.
    for (let num of seleccionados) {
        if (num !== "FREE" && !numerosLlamados.includes(num)) {
            console.error(`Cartón inválido: El número ${num} no ha sido llamado.`);
            return [];
        }
    }


    // Si el bucle termina y todas las validaciones pasaron, es un BINGO
    const numerosGanadoresUnicos = [...new Set(numerosGanadores)];
    console.log('¡BINGO! Patrón coincidente encontrado.');
    
    // Necesitas al menos tantos números marcados como "1" en el patrón (excluyendo el FREE central si no se marca por patrón)
    // Para simplificar, si la validación por matriz pasó, es bingo.
    
    return numerosGanadoresUnicos;
}

// Puedes eliminar validarCartonConReferencia y la lógica antigua de filas/columnas
// en la función validarCarton.

module.exports = {
    validarCarton,
    // validarCartonConReferencia ya no es necesaria y puede ser eliminada
};