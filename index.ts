import Server from './classes/serve';
import router from './routes/router';
import bodyParser from 'body-parser';
import cors from 'cors';

const server = new Server();

// Configuración BodyParser
server.app.use(bodyParser.urlencoded({ extended: true }));
server.app.use(bodyParser.json());

// Cors
server.app.use( cors({origin: true, credentials: true}) );

// Definición de router principal
server.app.use('/', router);

server.start(() => {
    console.log(`Servidor corriendo en el puerto ${server.port}`);
});
