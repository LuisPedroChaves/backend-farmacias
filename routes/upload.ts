import { Router, Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import fs from 'fs';

import Server from '../classes/serve';
import Sale from '../models/sale';
import InternalOrder, { IInternalOrder } from '../models/internalOrder';
import Cellar from '../models/cellar';
import User from '../models/user';
import Product from '../models/product';
import Purchase from '../models/purchase';
import AccountsPayable from '../models/accountsPayable';
import Check from '../models/check';
import Bank from '../models/bank';
import Employee from '../models/employee';
import Vacation from '../models/vacation';

// WebSockets Server
const SERVER = Server.instance;
const uploadRouter = Router();

// default options
uploadRouter.use(fileUpload());

uploadRouter.put('/:type/:id', (req: any, res: Response) => {
    const type = req.params.type;
    const id = req.params.id;

    // Tipos de colecciones
    const VALID_TYPES = [
        'saleBalances',
        'internalOrders',
        'internalOrdersDispatch',
        'products',
        'purchases',
        'accountsPayable',
        'checkReceipts',
        'banks',
        'employees',
        'vacation',
        'contractLaw',
        'internalContract',
        'confidentialityContract',
        'newContract',
        'cv'
    ];

    if (VALID_TYPES.indexOf(type) < 0) {
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
            const oldPath = './uploads/internalOrders/' + internalOrder.dispatchFile;

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
        'products': () => Product.findById(id, (err, product) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar producto',
                    errors: err
                });
            }

            if (!product) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El producto con el id' + id + ' no existe',
                    errors: {
                        message: 'No existe un producto con ese ID'
                    }
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/products/' + product.picture;

            if (fs.existsSync(oldPath)) {
                // Borramos el archivo antiguo
                fs.unlink(oldPath, err => {
                    if (err) {
                        return res.status(500).json({
                            ok: false,
                            mensaje: 'Error al eliminar imagen antigua',
                            errors: err
                        });
                    }
                });
            }

            product.picture = newNameFile;

            product.save((err, product) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al guardar imagen',
                        errors: err
                    });
                }

                res.status(200).json({
                    ok: true,
                    product
                });
            });
        }),
        'purchases': () => Purchase.findById(id, (err, purchase) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar compra',
                    errors: err
                });
            }

            if (!purchase) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'La compra con el id' + id + ' no existe',
                    errors: {
                        message: 'No existe una compra con ese ID'
                    }
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/purchases/' + purchase.file;

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

            purchase.file = newNameFile;

            purchase.save((err, purchase) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al guardar archivo',
                        errors: err
                    });
                }

                res.status(200).json({
                    ok: true,
                    purchase
                });
            });
        }),
        'accountsPayable': () => AccountsPayable.findById(id, (err, accountsPayable) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar cuenta por pagar',
                    errors: err
                });
            }

            if (!accountsPayable) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'La cuenta por pagar con el id' + id + ' no existe',
                    errors: {
                        message: 'No existe una cuenta por pagar con ese ID'
                    }
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/accountsPayable/' + accountsPayable.file;

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

            accountsPayable.file = newNameFile;

            accountsPayable.save((err, accountsPayable) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al guardar archivo',
                        errors: err
                    });
                }

                res.status(200).json({
                    ok: true,
                    accountsPayable
                });
            });
        }),
        'checkReceipts': () => Check.findById(id, (err, check) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar cheque',
                    errors: err
                });
            }

            if (!check) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El cheque con el id' + id + ' no existe',
                    errors: {
                        message: 'No existe un cheque con ese ID'
                    }
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/checkReceipts/' + check.receipt.file;

            if (fs.existsSync(oldPath) && check.receipt.file.length > 0) {
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

            check.receipt.file = newNameFile;

            check.save((err, check) => {
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
        'banks': () => Bank.findById(id, (err, bank) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar banco',
                    errors: err
                });
            }

            if (!bank) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El banco con el id' + id + ' no existe',
                    errors: {
                        message: 'No existe un banco con ese ID'
                    }
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/banks/' + bank.image;

            if (fs.existsSync(oldPath) && bank.image.length > 0) {
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

            bank.image = newNameFile;

            bank.save((err, bank) => {
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
        'employees': () => Employee.findById(id, (err, employee) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar empleado',
                    errors: err
                });
            }

            if (!employee) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El empleado con el id' + id + ' no existe',
                    errors: {
                        message: 'No existe un empleado con ese ID'
                    }
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/employees/' + employee.photo;

            if (fs.existsSync(oldPath) && employee.photo.length > 0) {
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

            employee.photo = newNameFile;

            employee.save((err, employee) => {
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
        'vacation': () => Vacation.findById(id, (err, vacation) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar vacaciones',
                    errors: err
                });
            }

            if (!vacation) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Las vacaciones con el id' + id + ' no existe',
                    errors: {
                        message: 'No existe unas vacaciones con ese ID'
                    }
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/vacation/' + vacation.constancy;

            if (fs.existsSync(oldPath) && vacation.constancy.length > 0) {
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

            vacation.constancy = newNameFile;

            vacation.save((err, vacation) => {
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
        'contractLaw': () => Employee.findById(id, (err, employee) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar empleado',
                    errors: err
                });
            }

            if (!employee) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El empleado con el id' + id + ' no existe',
                    errors: {
                        message: 'No existe un empleado con ese ID'
                    }
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/contractLaw/' + employee.contractLaw;

            if (fs.existsSync(oldPath) && employee.contractLaw.length > 0) {
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

            employee.contractLaw = newNameFile;

            employee.save((err, employee) => {
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
        'internalContract': () => Employee.findById(id, (err, employee) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar empleado',
                    errors: err
                });
            }

            if (!employee) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El empleado con el id' + id + ' no existe',
                    errors: {
                        message: 'No existe un empleado con ese ID'
                    }
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/internalContract/' + employee.internalContract;

            if (fs.existsSync(oldPath) && employee.internalContract.length > 0) {
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

            employee.internalContract = newNameFile;

            employee.save((err, employee) => {
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
        'confidentialityContract': () => Employee.findById(id, (err, employee) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar empleado',
                    errors: err
                });
            }

            if (!employee) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El empleado con el id' + id + ' no existe',
                    errors: {
                        message: 'No existe un empleado con ese ID'
                    }
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/confidentialityContract/' + employee.confidentialityContract;

            if (fs.existsSync(oldPath) && employee.confidentialityContract.length > 0) {
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

            employee.confidentialityContract = newNameFile;

            employee.save((err, employee) => {
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
        'newContract': () => Employee.findById(id, (err, employee) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar empleado',
                    errors: err
                });
            }

            if (!employee) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El empleado con el id' + id + ' no existe',
                    errors: {
                        message: 'No existe un empleado con ese ID'
                    }
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/newContract/' + employee.newContract;

            if (fs.existsSync(oldPath) && employee.newContract.length > 0) {
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

            employee.newContract = newNameFile;

            employee.save((err, employee) => {
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
        'cv': () => Employee.findById(id, (err, employee) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar empleado',
                    errors: err
                });
            }

            if (!employee) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El empleado con el id' + id + ' no existe',
                    errors: {
                        message: 'No existe un empleado con ese ID'
                    }
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/cv/' + employee.cv;

            if (fs.existsSync(oldPath) && employee.cv.length > 0) {
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

            employee.cv = newNameFile;

            employee.save((err, employee) => {
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
