import { Router, Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import xlsx from 'node-xlsx';
import bluebird from 'bluebird';
import mongoose from 'mongoose';
import moment from 'moment-timezone';

import { mdAuth } from '../middleware/auth';
import Product from '../models/product';
import TempStorage, { ITempStorage } from '../models/tempStorage';
import TempSale, { ITempSale } from '../models/tempSale';
import { IProduct } from '../models/product';

const TEMP_STORAGE_ROUTER = Router();
TEMP_STORAGE_ROUTER.use(fileUpload());

const OBJECT_ID = mongoose.Types.ObjectId;

/* #region  GET'S */
TEMP_STORAGE_ROUTER.get('/stockConsolidated', mdAuth, (req: Request, res: Response) => {
    const _brand: any = req.query._brand;
    const withStock = req.query.withStock;

    let query: any[] = [];
    // Filtro para laboratorio seleccionado
    if (_brand !== 'null') {
        query = [
            {
                $lookup: {
                    from: 'cellars',
                    localField: '_cellar',
                    foreignField: '_id',
                    as: '_cellar',
                },
            },
            {
                $unwind: '$_cellar',
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
                    '_product._brand': OBJECT_ID(_brand),
                },
            },
            {
                $sort: {
                    '_product.barcode': 1
                }
            },
            {
                $group: {
                    _id: '$_product',
                    cellars: {
                        $push: {
                            _cellar: "$_cellar",
                            stock: "$stock",
                            supply: "$supply",
                            minStock: "$minStock",
                            maxStock: "$maxStock",
                        },
                    },
                }
            },
        ]
    } else {
        query = [
            {
                $lookup: {
                    from: 'cellars',
                    localField: '_cellar',
                    foreignField: '_id',
                    as: '_cellar',
                },
            },
            {
                $unwind: '$_cellar',
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
                $sort: {
                    '_product.barcode': 1
                }
            },
            {
                $group: {
                    _id: '$_product',
                    cellars: {
                        $push: {
                            _cellar: "$_cellar",
                            stock: "$stock",
                            supply: "$supply",
                            minStock: "$minStock",
                            maxStock: "$maxStock",
                        },
                    },
                }
            },
        ]
    }

    // Filtro para productos con existencia mayor a cero
    if (withStock === 'true') {
        query.splice(0, 0, {
            $match: {
                stock: { $gt: 0 }
            },
        });
    }

    TempStorage.aggregate(
        query,
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
            });
        }
    );
});

TEMP_STORAGE_ROUTER.get('/checkStock', mdAuth, (req: Request, res: Response) => {
    const _product = req.query._product;

    TempStorage.find({
        _product: _product,
        stock: {
            $gt: 0
        }
    })
        .populate('_cellar')
        .sort({
            stock: -1
        })
        .exec((err, storages) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando inventarios',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                storages,
            });
        });
});

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

TEMP_STORAGE_ROUTER.get('/search/:cellar', mdAuth, (req: Request, res: Response) => {
    const _cellar: string = req.params.cellar;

    let search = req.query.search || '';
    search = String(search);
    const REGEX = new RegExp(search, 'i');

    TempStorage.aggregate([
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
                '_product.description': REGEX,
                '_product.discontinued': false,
                '_product.deleted': false
            },
        },
        {
            $unwind: '$_product.presentations'
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
            $limit: 10
        },
    ]).then((products) => {
        res.status(200).json({
            ok: true,
            products
        });
    })
        .catch((err) => {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error listando productos',
                errors: err
            });
        });
});
/* #endregion */

/* #region  PUT */
TEMP_STORAGE_ROUTER.put('/', mdAuth, async (req: Request, res: Response) => {
    const BODY = req.body;

    let errors: any[] = [];
    await bluebird.mapSeries(BODY, async (element: any, index) => {
        try {

            let tempStorage = await TempStorage.findOne({
                _product: element._id._id,
                _cellar: element._cellar
            }).exec();

            if (!tempStorage) {
                const NEW_TEMP_STORAGE = new TempStorage({
                    _cellar: element._cellar,
                    _product: element._id._id,
                    stock: 0,
                    minStock: element.minStock,
                    maxStock: element.maxStock,
                    supply: element.request,
                    lastUpdateStatics: moment().tz("America/Guatemala").format()
                });

                await NEW_TEMP_STORAGE.save().then();
            } else {
                await TempStorage.updateOne(
                    {
                        _id: tempStorage._id,
                    },
                    {
                        minStock: element.minStock,
                        maxStock: element.maxStock,
                        supply: element.request,
                        lastUpdateStatics: moment().tz("America/Guatemala").format()
                    },
                ).exec();
            }
        } catch (e: any) {
            throw new Error(e.message);
        }
    });

    return res.status(200).json({
        ok: true,
        errors
    });
});

TEMP_STORAGE_ROUTER.put('/global', mdAuth, async (req: Request, res: Response) => {
    const BODY: any = req.body;

    const _cellar: any = BODY._cellar;
    const _brand: any = BODY._brand;
    const MIN_X = BODY.daysRequest || 0;
    const MAX_X = BODY.supplyDays || 0;

    // Rango de fechas para historial de ventas
    let startDate = new Date(String(BODY.startDate));
    let endDate = new Date(String(BODY.endDate));
    endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    // Rango de fechas para consultar las ventas del último mes
    let startDate2 = new Date(String(BODY.startDate2));
    let endDate2 = new Date(String(BODY.endDate2));
    endDate2.setDate(endDate2.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    // Calculamos los dias y los meses en un rango de fechas
    const START = moment(startDate);
    const END = moment(endDate);
    // Condicionamos la veriable MONTHS para que no sea igual a cero
    // Porque en las operaciones no se pueden dividir entre cero
    // Sí la diferencia queda en cero entonces la igualamos a 1
    const MONTHS = (END.diff(START, 'months') === 0) ? 1 : END.diff(START, 'months');

    let query: any[] = [
        {
            $match: {
                _cellar: OBJECT_ID(_cellar),
                date: {
                    $gte: new Date(startDate.toDateString()),
                    $lt: new Date(endDate.toDateString()),
                },
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
                '_product._brand': OBJECT_ID(_brand),
            },
        },
        {
            $sort: { _product: 1 },
        },
        {
            $group: {
                _id: '$_product',
                suma: { $sum: "$quantity" },
                _cellar: { $first: "$_cellar" }
            }
        },
        {
            "$project": {
                _id: 1,
                suma: 1,
                _cellar: 1,
                promMonth: { $divide: ["$suma", MONTHS] },
            }
        },
    ];

    const TEMP_SALES: ITempSale[] = await TempSale.aggregate(
        query
    ).allowDiskUse(true);

    console.log(TEMP_SALES.length);

    //Sumamos un mes para calcular ventas al ultimo mes
    await SEARCH_STOCK_SALES(TEMP_SALES, startDate2, endDate2, MIN_X, MAX_X);

    res.status(200).json({
        ok: true,
    });

});

TEMP_STORAGE_ROUTER.put('/stockReset/:cellar', mdAuth, async (req: Request, res: Response) => {
    const _cellar: string = req.params.cellar;

    // RESETEAR INVENTARIO
    await TempStorage.updateMany(
        {
            _cellar
        },
        {
            stock: 0
        }
    );

    return res.status(200).json({
        ok: true,
        data: 'Inventario restablecido correctamente'
    });
});
/* #endregion */

/* #region  POST */
TEMP_STORAGE_ROUTER.post('/xlsx/:cellar', (req: Request, res: Response, next: any) => {
    // req.setTimeout((7 * 60 * 1000) + 1);
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

        res.status(200).json({
            ok: true,
            errors
        });
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
                            stock: STOCK,
                            lastUpdateStock: moment().tz("America/Guatemala").format()
                        });

                        await NEW_TEMP_STORAGE.save().then();
                    } else {
                        await TempStorage.updateOne(
                            {
                                _id: tempStorage._id,
                            },
                            {
                                stock: STOCK,
                                lastUpdateStock: moment().tz("America/Guatemala").format()
                            },
                        ).exec();
                    }
                }

                code++;
                console.log(code);
                next()
            } catch (e: any) {
                throw new Error(e.message);
            }
        });
    });
});
/* #endregion */

const SEARCH_STOCK_SALES = async (detail: any[], newStart: Date, newEnd: Date, MIN_X: any, MAX_X: any): Promise<any> => {
    return Promise.all(
        detail.map(async (element: any) => {
            // console.log(element._cellar);
            // console.log(element._id._id);

            const SEARCH_SALES = await TempSale.aggregate(
                [
                    {
                        $match: {
                            _cellar: OBJECT_ID(element._cellar),
                            _product: OBJECT_ID(element._id._id),
                            date: {
                                $gte: new Date(newStart.toDateString()),
                                $lt: new Date(newEnd.toDateString()),
                            },
                        },
                    },
                    {
                        $group: {
                            _id: '$_product',
                            suma: { $sum: "$quantity" },
                        }
                    },
                    {
                        "$project": {
                            _id: 1,
                            suma: 1,
                        }
                    }
                ]
            );
            let sales = 0;
            if (SEARCH_SALES.length > 0) {
                sales = SEARCH_SALES[0].suma
            }
            const PROM_ADJUST_MONTH = (+element.promMonth + +sales) / 2;
            const PROM_ADJUST_DAY = (+PROM_ADJUST_MONTH / 30);

            const TEMP_STORAGE = await TempStorage.findOne({
                _cellar: element._cellar,
                _product: element._id._id,
            }).populate('_cellar').exec();

            let stock = 0;
            if (TEMP_STORAGE) {
                stock = TEMP_STORAGE.stock;
            }
            const SUPPLY = (+PROM_ADJUST_DAY * +(+MIN_X + +MAX_X));
            const APROX_SUPPLY = Math.ceil(SUPPLY);

            // VARIABLES LISTAS
            let request = 0;
            if (APROX_SUPPLY > 0) {
                request = +APROX_SUPPLY - +stock;
            }

            const MIN_STOCK = Math.ceil(PROM_ADJUST_DAY * 15)
            const MAX_STOCK = Math.ceil(PROM_ADJUST_DAY * 30)
            // ACTUALIZANDO ESTADISTICAS...
            if (!TEMP_STORAGE) {
                console.log('CREADO');
                const NEW_TEMP_STORAGE = new TempStorage({
                    _cellar: element._cellar,
                    _product: element._id._id,
                    stock: 0,
                    minStock: MIN_STOCK,
                    maxStock: MAX_STOCK,
                    supply: request,
                    lastUpdateStatics: moment().tz("America/Guatemala").format()
                });

                return NEW_TEMP_STORAGE.save().then();
            } else {
                return TempStorage.updateOne(
                    {
                        _id: TEMP_STORAGE._id,
                    },
                    {
                        minStock: MIN_STOCK,
                        maxStock: MAX_STOCK,
                        supply: request,
                        lastUpdateStatics: moment().tz("America/Guatemala").format()
                    },
                ).exec();
            }
        })
    );
};

export default TEMP_STORAGE_ROUTER;