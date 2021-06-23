import { Router, Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import Server from '../classes/serve';
import Sale from '../models/sale';
import InternalOrder, { IInternalOrder } from '../models/internalOrder';
import Cellar from '../models/cellar';
import User from '../models/user';

// WebSockets Server
const SERVER = Server.instance;
const uploadRouter = Router();

// default options
uploadRouter.use(fileUpload());

uploadRouter.put('/:type/:id', (req: any, res: Response) => {
    const type = req.params.type;
    const id = req.params.id;

    // Tipos de colecciones
    const validTypes = ['saleBalances', 'internalOrders', 'internalOrdersDispatch'];

    if (validTypes.indexOf(type) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Tipo de colección no válida',
            errors: { message: 'Tipo de colección no válida' }
        });
    }

    // Sino envia ningún archivo
    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No Selecciono nada',
            errors: { message: 'Debe de seleccionar un archivo' }
        });
    }

    // Obtener nombre y la extensión del archivo
    const file = req.files.archivo;
    const nameFile = file.name.split('.');
    const extFile = nameFile[nameFile.length - 1];

    // Extensiones permitidas
    const validExts = ['png', 'jpg', 'gif', 'jpeg', 'pdf', 'zip', 'doc', 'docx', 'xls', 'xlsx', 'rar'];

    if (validExts.indexOf(extFile) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Extensión no válida',
            errors: { message: 'Las extensiones válidas son: ' + validExts.join(', ') }
        });
    }

    // Nombre del archivo personalizado
    const newNameFile = `${id}-${new Date().getMilliseconds()}.${extFile}`;

    // Mover el archivo de la memoria temporal a un path
    const path = `./uploads/${type}/${newNameFile}`;

    file.mv(path, (err: any) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al mover archivo',
                errors: err
            });
        }

        uploadByType(type, id, newNameFile, res);
    });

});

// Funcion que sirve para enlazar nuestros archivos con los registros en la base de datos
const uploadByType = (type: string, id: string, newNameFile: string, res: Response) => {
    const SWITCH_TYPES: any = {
        'saleBalances': () => Sale.find({ "balance._id": id },
            { "balance.$": true }, (err, result) => {

                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al buscar balance',
                        errors: err
                    });
                }

                const idSale = result[0]._id;
                const balance = result[0].balance[0];


                if (!idSale || !balance) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'El pago con el id' + id + ' no existe',
                        errors: {
                            message: 'No existe un pago con ese ID'
                        }
                    });
                }

                // Si existe un archivo almacenado anteriormente
                const oldPath = './uploads/saleBalances/' + balance.file;

                if (fs.existsSync(oldPath)) {
                    // Borramos el archivo antiguo
                    fs.unlink(oldPath, err => {
                        if (err) {
                            return res.status(500).json({
                                ok: false,
                                mensaje: 'Error al eliminar archivo antiguo',
                                errors: err
                            });
                        }
                    });
                }

                Sale.updateOne(
                    {
                        _id: idSale,
                        'balance._id': balance._id,
                    },
                    {
                        'balance.$.file': newNameFile,
                    },
                    (err, balance) => {
                        if (err) {
                            res.status(400).json({
                                ok: false,
                                mensaje: 'Error al guardar archivo',
                                errors: err,
                            });
                        }

                        res.status(200).json({
                            ok: true,
                            newNameFile
                        });
                    }
                );
            }
        ),
        'internalOrders': () => InternalOrder.findById(id, (err, internalOrder) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar pedido o traslado',
                    errors: err
                });
            }

            if (!internalOrder) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El pedido o traslado con el id' + id + ' no existe',
                    errors: {
                        message: 'No existe un pedido o traslado con ese ID'
                    }
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/internalOrders/' + internalOrder.file;

            if (fs.existsSync(oldPath)) {
                // Borramos el archivo antiguo
                fs.unlink(oldPath, err => {
                    if (err) {
                        return res.status(500).json({
                            ok: false,
                            mensaje: 'Error al eliminar archivo antiguo',
                            errors: err
                        });
                    }
                });
            }

            internalOrder.file = newNameFile;

            internalOrder.save((err, internalOrder) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al guardar archivo',
                        errors: err
                    });
                }

                if (internalOrder.state === 'ENVIO') {
                    SERVER.io.in(internalOrder._cellar).emit('newInternalOrder', internalOrder);
                }
                Cellar.populate(internalOrder, { path: '_cellar' }, (err, result: IInternalOrder) => {
                    Cellar.populate(result, { path: '_destination' }, (err, result: IInternalOrder) => {
                        User.populate(result, { path: '_user' }, (err, result: IInternalOrder) => {
                            SERVER.io.in(result._cellar._id).emit('updateIncoming', result);
                            SERVER.io.in(result._destination._id).emit('updateOutgoing', result);
                        });
                    });
                });

                res.status(200).json({
                    ok: true,
                    newNameFile
                });
            });
        }),
        'internalOrdersDispatch': () => InternalOrder.findById(id, (err, internalOrder) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar pedido o traslado',
                    errors: err
                });
            }

            if (!internalOrder) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El pedido o traslado con el id' + id + ' no existe',
                    errors: {
                        message: 'No existe un pedido o traslado con ese ID'
                    }
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/internalOrders/' + internalOrder.file;

            if (fs.existsSync(oldPath)) {
                // Borramos el archivo antiguo
                fs.unlink(oldPath, err => {
                    if (err) {
                        return res.status(500).json({
                            ok: false,
                            mensaje: 'Error al eliminar archivo antiguo',
                            errors: err
                        });
                    }
                });
            }

            internalOrder.dispatchFile = newNameFile;

            internalOrder.save((err, internalOrder) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al guardar archivo',
                        errors: err
                    });
                }

                res.status(200).json({
                    ok: true,
                    newNameFile
                });
            });
        }),
    };
    SWITCH_TYPES[type]();
};

export default uploadRouter;