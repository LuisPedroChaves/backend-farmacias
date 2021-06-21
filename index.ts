import Server from './classes/serve';
import router from './routes/router';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';

// const server = new Server();
// patrón Singleton
const server = Server.instance;

// BodyParser Configuración
server.app.use(express.urlencoded({extended: true}));
server.app.use(express.json());

// Inicializando Morgan
server.app.use(morgan('tiny'));

// Cors
server.app.use(cors({ origin: true, credentials: true }));

// Mongodb Configuración
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;

mongoose.connection.openUri(
    'mongodb://localhost:27017/farmaciasDB', // Agregar nombre de la DB
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    },
    function (error, res) {
        if (error) throw error;
        console.log('Base de datos: \x1b[32m%s\x1b[0m', 'ONLINE');
    }
);

// const client = mongoose.connection
//     .openUri(process.env.CUSTOMCONNSTR_COSMOS_CONNSTR, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     })
//     .then(() => console.log('Connection to CosmosDB successful'))
//     .catch(err => console.error(err));

// Definición de router principal
server.app.use('/', router);

server.start(() => {
    console.log(`Servidor corriendo en el puerto ${server.port}`);
});
