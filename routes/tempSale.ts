import { Router, Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import xlsx from 'node-xlsx';
import bluebird from 'bluebird';
import mongoose from 'mongoose';
import moment from 'moment';

import { mdAuth } from '../middleware/auth';
import Product, { IProduct } from '../models/product';
import TempSale from '../models/tempSale';
import TempStorage from '../models/tempStorage';
import { ITempSale } from '../models/tempSale';

const TEMP_SALE_ROUTER = Router();
TEMP_SALE_ROUTER.use(fileUpload());

const OBJECT_ID = mongoose.Types.ObjectId;

/* #region  GET */
// REPORTE DE ESTADISTICAS
TEMP_SALE_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
    const _cellar: any = req.query._cellar;
    const _brand: any = req.query._brand;
    const MIN_X = req.query.minX || 0;
    const MAX_X = req.query.maxX || 0;

    // Rango de fechas para historial de ventas
    let startDate = new Date(String(req.query.startDate));
    let endDate = new Date(String(req.query.endDate));
    endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    // Rango de fechas para consultar las ventas del último mes
    let startDate2 = new Date(String(req.query.startDate2));
    let endDate2 = new Date(String(req.query.endDate2));
    endDate2.setDate(endDate2.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    // Calculamos los dias y los meses en un rango de fechas
    const START = moment(startDate);
    const END = moment(endDate);
    const DAYS = END.diff(START, 'days');
    // Condicionamos la veriable MONTHS para que no sea igual a cero
    // Porque en las operaciones no se pueden dividir entre cero
    // Sí la diferencia queda en cero entonces la igualamos a 1
    const MONTHS = (END.diff(START, 'months') === 0) ? 1 : END.diff(START, 'months');

    TempSale.aggregate(
        [
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
                    promDays: { $divide: ["$suma", DAYS] },
                }
            }
        ],
        async function (err: any, tempSales: ITempSale[]) {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando inventario',
                    errors: err,
                });
            }

            // const tempsale = tempSales.find(ts => ts._id.barcode === '13375');
            // console.log("🚀 ~ file: tempSale.ts ~ line 103 ~ tempsale", tempsale)
            // console.log("🚀 ~ file: tempSale.ts ~ line 103 ~ startDate2", startDate2)
            // console.log("🚀 ~ file: tempSale.ts ~ line 103 ~ endDate2", endDate2)
            // console.log("🚀 ~ file: tempSale.ts ~ line 103 ~ MIN_X", MIN_X)
            // console.log("🚀 ~ file: tempSale.ts ~ line 103 ~ MAX_X", MAX_X)

            //Sumamos un mes para calcular ventas al ultimo mes
            tempSales = await SEARCH_STOCK_SALES(tempSales, startDate2, endDate2, MIN_X, MAX_X);

            res.status(200).json({
                ok: true,
                tempSales,
            });
        }
    );
});

// Consulta el stock actual y las ventas realizadas en un rango de fechas
// Filtrado por laboratorio
TEMP_SALE_ROUTER.get('/tempStatistics', mdAuth, (req: Request, res: Response) => {
    const _cellar: any = req.query._cellar;
    const _brand: any = req.query._brand;

    // Rango de fechas para historial de ventas
    let startDate = new Date(String(req.query.startDate));
    let endDate = new Date(String(req.query.endDate));
    endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    Product.find({
        _brand,
        deleted: false
    })
        .sort({
            _id: 1
        })
        .exec(async (err, products: IProduct[]) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando productos',
                    errors: err
                });
            }

            const RESULT: any[] = await SEARCH_TEMP_STOCK_SALES(products, _cellar, startDate, endDate);

            res.status(200).json({
                ok: true,
                products: RESULT,
            });
        });
});

// Productos más vendidos
TEMP_SALE_ROUTER.get('/bestSellers', mdAuth, (req: Request, res: Response) => {
    const _cellar: any = req.query._cellar;
    // Rango de fechas para historial de ventas
    let startDate = new Date(String(req.query.startDate));
    let endDate = new Date(String(req.query.endDate));
    endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    let query: any[] = [
        {
            $match: {
                date: {
                    $gte: new Date(startDate.toDateString()),
                    $lt: new Date(endDate.toDateString()),
                },
            }
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
            $group: {
                _id: '$_product',
                totalSales: {
                    $sum: '$quantity'
                }
            }
        },
        {
            $sort: { totalSales: -1 }
        },
        {
            $limit: 1500
        },
        {
            $project: {
                _id: '$_id._id',
                code: '$_id.code',
                barcode: '$_id.barcode',
                description: '$_id.description',
                brand: '$_id._brand.name',
                total: '$totalSales'
            }
        }
    ];

    if (_cellar !== '') {
        // Filtro por sucursal
        query.splice(0, 1, {
            $match: {
                _cellar: OBJECT_ID(_cellar),
                date: {
                    $gte: new Date(startDate.toDateString()),
                    $lt: new Date(endDate.toDateString()),
                },
            }
        })
    }

    TempSale.aggregate(query).then((tempSales) => {
        res.status(200).json({
            ok: true,
            tempSales
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

// Productos menos vendidos
TEMP_SALE_ROUTER.get('/worstSellers', mdAuth, (req: Request, res: Response) => {
    const _cellar: any = req.query._cellar;
    // Rango de fechas para historial de ventas
    let startDate = new Date(String(req.query.startDate));
    let endDate = new Date(String(req.query.endDate));
    endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    let query: any[] = [
        {
            $match: {
                date: {
                    $gte: new Date(startDate.toDateString()),
                    $lt: new Date(endDate.toDateString()),
                },
            }
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
            $group: {
                _id: '$_product',
                totalSales: {
                    $sum: '$quantity'
                }
            }
        },
        {
            $sort: { totalSales: 1 }
        },
        {
            $limit: 500
        },
        {
            $project: {
                _id: '$_id._id',
                code: '$_id.code',
                barcode: '$_id.barcode',
                description: '$_id.description',
                brand: '$_id._brand.name',
                total: '$totalSales'
            }
        }
    ];

    if (_cellar !== '') {
        // Filtro por sucursal
        query.splice(0, 1, {
            $match: {
                _cellar: OBJECT_ID(_cellar),
                date: {
                    $gte: new Date(startDate.toDateString()),
                    $lt: new Date(endDate.toDateString()),
                },
            }
        })
    }

    TempSale.aggregate(query).then((tempSales) => {
        res.status(200).json({
            ok: true,
            tempSales
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

/* #region  POST */
TEMP_SALE_ROUTER.post('/xlsx', (req: Request, res: Response) => {
    const BODY = req.body;

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
    const PATH = `dist/uploads/temp/${NEW_NAME_FILE}`;

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
                const DATE = new Date(moment(ExcelDateToJSDate(doc[0])).tz("America/Guatemala").format());
                const BARCODE: string = doc[1].replace(/^\s+|\s+$/g, "");
                const QUANTITY: number = doc[2];

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
                    const NEW_TEMP_SALE = new TempSale({
                        _cellar: BODY._cellar,
                        _product: _product._id,
                        date: DATE,
                        quantity: QUANTITY
                    });

                    await NEW_TEMP_SALE.save().then();
                }

                code++;
                console.log("🚀 ~ file: product.ts ~ line 372 ~ awaitbluebird.mapSeries ~ code", code)
                console.log(errors);
                // res.write(code.toString())
            } catch (e: any) {
                throw new Error(e.message);
            }
        });

        // res.end()

        // res.send({
        //     ok: true,
        //     errors
        // });
    });
});

TEMP_SALE_ROUTER.post('/xlsx/delete', (req: Request, res: Response) => {
    const BODY = req.body;

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
    const PATH = `dist/uploads/temp/${NEW_NAME_FILE}`;

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
                const DATE = new Date(moment(ExcelDateToJSDate(doc[0])).tz("America/Guatemala").format());
                const BARCODE: string = doc[1];
                const QUANTITY: number = doc[2];

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
                    let tempSale = await TempSale.findOne({
                        _cellar: BODY._cellar,
                        _product: _product._id,
                        date: DATE,
                        quantity: QUANTITY
                    }).exec();

                    if (!tempSale) {
                        errors.push({
                            barcode: BARCODE,
                            error: 'No se encontró un producto con este código'
                        })
                    } else {
                        await TempSale.deleteOne(
                            {
                                _id: tempSale._id,
                            }
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

const SEARCH_STOCK_SALES = async (detail: any[], newStart: Date, newEnd: Date, MIN_X: any, MAX_X: any): Promise<any> => {
    return Promise.all(
        detail.map(async (element: any) => {
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
                console.log("🚀 ~ file: tempSale.ts ~ line 570 ~ detail.map ~ sales", sales)
            }
            element.salesMonth = sales;
            const PROM_ADJUST_MONTH = (+element.promMonth + +sales) / 2;
            element.promAdjustMonth = Math.ceil(PROM_ADJUST_MONTH);
            const PROM_ADJUST_DAY = (+PROM_ADJUST_MONTH / 30);
            element.promAdjustDay = Math.ceil(PROM_ADJUST_DAY);

            const SEARCH_STOCK = await TempStorage.aggregate(
                [
                    {
                        $match: {
                            _cellar: OBJECT_ID(element._cellar),
                            _product: OBJECT_ID(element._id._id),
                        },
                    }
                ]);

            let stock = 0;
            if (SEARCH_STOCK.length > 0) {
                stock = SEARCH_STOCK[0].stock;
            }
            element.stock = stock;

            const SUPPLY = (+PROM_ADJUST_DAY * +(+MIN_X + +MAX_X));
            element.supply = SUPPLY.toFixed(2);
            element.aproxSupply = Math.ceil(SUPPLY);

            if (element.aproxSupply > 0) {
                element.request = +element.aproxSupply - +element.stock;
            } else {
                element.request = 0;
            }
            // MINIMOS Y MAXIMOS
            element.minStock = Math.ceil(PROM_ADJUST_DAY * 15);
            element.maxStock = Math.ceil(PROM_ADJUST_DAY * 30);
            // Aproximando valores
            element.promMonth = Math.ceil(element.promMonth);
            element.promDays = Math.ceil(element.promDays);
            return element;
        })
    );
};

const SEARCH_TEMP_STOCK_SALES = async (detail: any[], _cellar: string, newStart: Date, newEnd: Date): Promise<any> => {
    return Promise.all(
        detail.map(async (element: any) => {
            element = element.toObject();
            const SEARCH_SALES = await TempSale.aggregate(
                [
                    {
                        $match: {
                            _cellar: OBJECT_ID(_cellar),
                            _product: OBJECT_ID(element._id),
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
            element.sales = sales;

            const SEARCH_STOCK = await TempStorage.aggregate(
                [
                    {
                        $match: {
                            _cellar: OBJECT_ID(_cellar),
                            _product: OBJECT_ID(element._id),
                        },
                    }
                ]);

            let stock = 0;
            let lastUpdateStock = 0;
            if (SEARCH_STOCK.length > 0) {
                stock = SEARCH_STOCK[0].stock;
                lastUpdateStock = SEARCH_STOCK[0].lastUpdateStock;
            }
            element.stock = stock;
            element.lastUpdateStock = lastUpdateStock;
            return element;
        })
    );
};

const ExcelDateToJSDate = (serialXlsx: number) => {
    var utc_days = Math.floor(serialXlsx - 25569);
    var utc_value = utc_days * 86400;
    var date_info = new Date(utc_value * 1000);

    var fractional_day = serialXlsx - Math.floor(serialXlsx) + 0.0000001;

    var total_seconds = Math.floor(86400 * fractional_day);

    var seconds = total_seconds % 60;

    total_seconds -= seconds;

    var hours = Math.floor(total_seconds / (60 * 60));
    var minutes = Math.floor(total_seconds / 60) % 60;

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

export default TEMP_SALE_ROUTER;