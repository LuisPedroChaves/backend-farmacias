import { Router, Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import xlsx from 'node-xlsx';
import bluebird from 'bluebird';

import { mdAuth } from '../middleware/auth';
import Product from '../models/product';
import TempStorage from '../models/tempStorage';

const TEMP_STORAGE_ROUTER = Router();
TEMP_STORAGE_ROUTER.use(fileUpload());


/* #region  GET pagination */
TEMP_STORAGE_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
    // Paginación
    let page = req.query.page || 0;
    let size = req.query.size || 10;
    let search = req.query.search || '';

    page = Number(page);
    size = Number(size);
    search = String(search);

    let query: any = {};

    if (search) {
        const REGEX = new RegExp(search, 'i');
        query = {
            deleted: false,
            description: REGEX,
        };

    } else {
        query = {
            deleted: false,
        };
    }

    Product.find(
        query
    )
        .populate('_brand')
        .populate('substances')
        .populate('symptoms')
        .skip(page * size)
        .limit(size)
        .sort({
            code: 1
        })
        .exec(async (err, products) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando productos',
                    errors: err
                });
            }

            const TOTAL: number = await Product.find(query)
                .countDocuments()
                .exec();

            res.status(200).json({
                ok: true,
                products,
                TOTAL
            });
        });
});
/* #endregion */

/* #region  GET search product */
TEMP_STORAGE_ROUTER.get('/search', mdAuth, (req: Request, res: Response) => {
    let search = req.query.search || '';
    search = String(search);

    const REGEX = new RegExp(search, 'i');

    Product.aggregate([
        {
            $match: {
                description: REGEX,
                discontinued: false,
                deleted: false
            }
        },
        {
            $unwind: '$presentations'
        },
        {
            $limit: 10
        },
        {
            $lookup:
            {
                from: "brands",
                localField: "_brand",
                foreignField: "_id",
                as: "_brand"
            }
        },
        {
            $unwind: '$_brand',
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

/* #region  POST */
TEMP_STORAGE_ROUTER.post('/xlsx/:cellar', mdAuth, (req: Request, res: Response) => {
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
        let errors = [];
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
                }else {
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

        return res.status(201).json({
            ok: true,
            m: 'PRODUCTOS INGRESADOS'
        });
    });
});
/* #endregion */

export default TEMP_STORAGE_ROUTER;