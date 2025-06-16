const {API_BASE_URL} = require("../constans");

async function crearRoom(socket, data){
}

function validarRol(user){
    if(user.rol !== 0){
       return false;
    }
    return true;
}

module.exports = {
    crearRoom
};