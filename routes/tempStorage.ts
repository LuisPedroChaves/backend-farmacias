import { Router, Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import xlsx from 'node-xlsx';
import bluebird from 'bluebird';
import mongoose from 'mongoose';

import { mdAuth } from '../middleware/auth';
import Product from '../models/product';
import TempStorage from '../models/tempStorage';
import { ITempStorage } from '../models/tempStorage';

const OBJECT_ID = mongoose.Types.ObjectId;
const TEMP_STORAGE_ROUTER = Router();
TEMP_STORAGE_ROUTER.use(fileUpload());

/* #region  GET'S */
TEMP_STORAGE_ROUTER.get('/:cellar', mdAuth, (req: Request, res: Response) => {
    const _cellar: string = req.params.cellar;
    // Paginación
    let page = req.query.page || 0;
    let size = req.query.size || 10;
    let search = req.query.search || '';
    let brand = req.query.brand || '';

    page = Number(page);
    size = Number(size);
    search = String(search);
    brand = String(brand);

    const REGEX = new RegExp(search, 'i');

    if (brand) {

        TempStorage.aggregate(
            [
                {
                    $match: {
                        _cellar: OBJECT_ID(_cellar),
                    },
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_product',
                        foreignField: '_id',
                        as: '_product',
                    },
                },
                {
                    $unwind: '$_product',
                },
                {
                    $match: {
                        '_product._brand': OBJECT_ID(brand),
                        $or: [
                            {
                                '_product.barcode': REGEX,
                            },
                            {
                                '_product.description': REGEX,
                            }
                        ]
                    },
                },
                {
                    $lookup: {
                        from: 'brands',
                        localField: '_product._brand',
                        foreignField: '_id',
                        as: '_product._brand',
                    },
                },
                {
                    $unwind: '$_product._brand',
                },
                {
                    $sort: { stock: -1 },
                }
            ],
            function (err: any, tempStorages: ITempStorage[]) {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error listando inventario',
                        errors: err,
                    });
                }

                res.status(200).json({
                    ok: true,
                    tempStorages,
                    TOTAL: 0
                });
            }
        );

    } else if (search) {

        TempStorage.aggregate(
            [
                {
                    $match: {
                        _cellar: OBJECT_ID(_cellar),
                    },
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_product',
                        foreignField: '_id',
                        as: '_product',
                    },
                },
                {
                    $unwind: '$_product',
                },
                {
                    $match: {
                        $or: [
                            {
                                '_product.barcode': REGEX,
                            },
                            {
                                '_product.description': REGEX,
                            }
                        ]
                    },
                },
                {
                    $lookup: {
                        from: 'brands',
                        localField: '_product._brand',
                        foreignField: '_id',
                        as: '_product._brand',
                    },
                },
                {
                    $unwind: '$_product._brand',
                },
                { $skip: page * size },
                { $limit: size },
                {
                    $sort: { '_product.barcode': 1 },
                }
            ],
            function (err: any, tempStorages: ITempStorage[]) {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error listando inventario',
                        errors: err,
                    });
                }

                res.status(200).json({
                    ok: true,
                    tempStorages,
                    TOTAL: tempStorages.length
                });
            }
        );
    } else {

        let query = {
            _cellar,
        };
        TempStorage.find(
            query
        )
            .populate('_product')
            .populate({
                path: '_product',
                populate: {
                    path: '_brand',
                },
            })
            .skip(page * size)
            .limit(size)
            .sort({
                stock: -1
            })
            .exec(async (err, tempStorages) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error listando inventario temporal',
                        errors: err
                    });
                }

                const TOTAL: number = await TempStorage.find(query)
                    .countDocuments()
                    .exec();

                res.status(200).json({
                    ok: true,
                    tempStorages,
                    TOTAL
                });
            });
    }
});
/* #endregion */

/* #region  POST */
TEMP_STORAGE_ROUTER.post('/xlsx/:cellar', (req: Request, res: Response) => {
    const _cellar: string = req.params.cellar;

    // Sino envia ningún archivo
    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No Selecciono nada',
            errors: { message: 'Debe de seleccionar un archivo' }
        });
    }

    // Obtener nombre y la extensión del archivo
    const FILE: any = req.files.archivo;
    const NAME_FILE = FILE.name.split('.');
    const EXT_FILE = NAME_FILE[NAME_FILE.length - 1];

    // Extensiones permitidas
    const VALID_EXTS = ['xlsx'];

    if (VALID_EXTS.indexOf(EXT_FILE) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Extensión no válida',
            errors: { message: 'Las extensiones válidas son: ' + VALID_EXTS.join(', ') }
        });
    }

    // Nombre del archivo personalizado
    const NEW_NAME_FILE = `${new Date().getMilliseconds()}.${EXT_FILE}`;

    // Mover el archivo de la memoria temporal a un path
    const PATH = `./uploads/temp/${NEW_NAME_FILE}`;

    FILE.mv(PATH, async (err: any) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al mover archivo',
                errors: err
            });
        }

        const DOC = xlsx.parse(PATH);

        let code = 1;
        let errors: any[] = [];
        await bluebird.mapSeries(DOC[0].data, async (doc: any, index) => {
            try {
                const BARCODE: string = doc[0];
                const STOCK: number = doc[1];

                let _product = await Product.findOne({
                    barcode: BARCODE,
                    deleted: false,
                }).exec();

                if (!_product) {
                    errors.push({
                        barcode: BARCODE,
                        error: 'No se encontró un producto con este código'
                    })
                } else {
                    let tempStorage = await TempStorage.findOne({
                        _product,
                        _cellar
                    }).exec();

                    if (!tempStorage) {
                        const NEW_TEMP_STORAGE = new TempStorage({
                            _cellar,
                            _product: _product._id,
                            stock: STOCK
                        });

                        await NEW_TEMP_STORAGE.save().then();
                    } else {
                        await TempStorage.updateOne(
                            {
                                _id: tempStorage._id,
                            },
                            {
                                stock: STOCK,
                            },
                        ).exec();
                    }
                }

                code++;
                console.log("🚀 ~ file: product.ts ~ line 372 ~ awaitbluebird.mapSeries ~ code", code)
            } catch (e: any) {
                throw new Error(e.message);
            }
        });

        return res.status(200).json({
            ok: true,
            errors
        });
    });
});
/* #endregion */

export default TEMP_STORAGE_ROUTER;