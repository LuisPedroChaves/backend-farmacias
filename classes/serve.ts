import express from 'express';
import { SERVER_PORT } from '../global/environment';
import socketIO from "socket.io"
import http from 'http';
import * as socket from '../sockets/socket';
const scheduledFunctions = require('../scheduledJobs/globalStatistics');

export default class Server {

    // patrón Singleton
    private static _instance: Server;

    public app: express.Application;
    public port: number;

    // socket.io
    private httpServer: http.Server;
    public io: socketIO.Server;

    private constructor() {
        this.app = express();
        this.port = SERVER_PORT;

        // socket.io
        this.httpServer = new http.Server(this.app);
        this.io = socketIO(this.httpServer);

        this.listenSockets();
    scheduledFunctions.initScheduledJobs();
    }

    // patrón Singleton
    public static get instance() {
        return this._instance || ( this._instance = new this() );
    }

    // socket.io
    private listenSockets() {
        // console.log('Escuchando conexiones - sockets');
        this.io.on('connection', cliente  => {
            // console.log('Cliente conectado: ' + cliente.id);

            socket.cellarConnect(cliente);
            socket.cellarConfig(cliente, this.io);
            // socket.internalOrder(cliente, this.io);
            socket.desconectar(cliente);
        });
    }

    start(callback: () => void) {
        this.httpServer.listen(this.port, callback);
    }
}
