import { Router, Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import Sale from '../models/sale';


const uploadRouter = Router();

// default options
uploadRouter.use(fileUpload());

uploadRouter.put('/:type/:id', (req: any, res: Response) => {
    const type = req.params.type;
    const id = req.params.id;

    // Tipos de colecciones
    const validTypes = ['saleBalances'];

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
    const validExts = ['png', 'jpg', 'gif', 'jpeg', 'pdf'];

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
    switch (type) {
        case 'saleBalances':

            Sale.find({ "balance._id": id },
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
            );
            break;

        default:
            break;
    }
};

export default uploadRouter;
