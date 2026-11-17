async function getNext(numeros){
    let numerosObtenidos = new Set(numeros);
    let nextNumber;
    if (numerosObtenidos.size >= 75) {
        // Ya se han obtenido todos los números posibles
        return [Array.from(numerosObtenidos), null];
    }
    if(numerosObtenidos.size === 75){
        return [Array.from(numerosObtenidos), null];
    }
    do {
        nextNumber = getRandomInt(1, 76);
    } while (numerosObtenidos.has(nextNumber));
    numerosObtenidos.add(nextNumber);
    return [Array.from(numerosObtenidos), nextNumber];
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //El maximo es exclusivo y el minimo es inclusivo
}

function generateUniqueId(length = 5) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

module.exports = {getNext,generateUniqueId};