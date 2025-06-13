
export function crearRoom(socket, data){
    if(!validarRol(socket.user)) return;

    console.log(data.sala);
}

function validarRol(user){
    if(user.rol !== 0){
       return false;
    }
    return true;
}