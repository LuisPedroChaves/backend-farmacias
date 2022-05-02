import SocketIO, { Socket } from "socket.io";
import { Cellar } from "../classes/cellar";
import { ListCellars } from '../classes/listCellars';

export const connectedCellars = new ListCellars();

export const cellarConnect = (socket: Socket) => {
    const cellar = new Cellar(socket.id);
    connectedCellars.add(cellar);
}

export const desconectar = (socket: SocketIO.Socket) => {
    socket.on('disconnect', () => {
        console.log('Cliente desconectado.');
        connectedCellars.deleteCellar(socket.id);
    });
};

// Configurar sesión de sucursal
export const cellarConfig = (socket: SocketIO.Socket, io: SocketIO.Server) => {
    socket.on('cellarConfig', (payload: any, callback: (response: any) => void) => {
        // console.log('Configurando sucursal...', payload);
        // Creamos sala por medio del ID de la sucursal
        if (payload.sala) {
            socket.join(payload._id);
        }else {
            socket.leave(payload._id);
        }
        connectedCellars.updateName(socket.id, payload.name);

        callback({
            ok: true,
            mensaje: `Sucursal ${payload.name} configurada`
        });
    });
};