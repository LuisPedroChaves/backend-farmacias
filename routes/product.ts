import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth';
import fileUpload from 'express-fileupload';
import xlsx from 'node-xlsx';
import bluebird from 'bluebird';
import Product from '../models/product';
import Brand from '../models/brand';
import Substance from '../models/substance';

const PRODUCT_ROUTER = Router();
PRODUCT_ROUTER.use(fileUpload());


/* #region  GET pagination */
PRODUCT_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
    // Paginación
    let page = req.query.page || 0;
    let size = req.query.size || 10;
    let search = req.query.search || '';
    search = String(search);
    const REGEX = new RegExp(search, 'i');

    page = Number(page);
    size = Number(size);
    // Product.collection.createIndex({code: "number", description: "text"})

    Product.find({
        deleted: false,
        // $code: {$search: Number(search)},
        // $text: {$search: String(REGEX) },
        description: REGEX,
        // $or:[
        //     {"_brand.name": search},
        //     {"description":search}
        // ]
    })
        .collation( { locale: "es" })
        .populate('_brand')
        .skip(page)
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

            const TOTAL: number = await Product.find({ deleted: false, })
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

/* #region  PUT */
PRODUCT_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    try {
        const ID = req.params.id;
        const BODY = req.body;

        Product.findById(ID, (err, product) => {
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
                    mensaje: 'El producto con el id' + ID + ' no existe',
                    errors: {
                        message: 'No existe un producto con ese ID'
                    }
                });
            }

            if (BODY._brand) {
                BODY._brand.name = BODY._brand.name.replace(/\s/g, '');
                BODY._brand.name = BODY._brand.name.replace(/-/g, '').toUpperCase();
            }

            Brand.findOne({
                name: BODY._brand.name,
                deleted: false,
            }).exec(async (err, _brand) => {
                if (err) {
                    res.status(500).json({
                        ok: false,
                        mensaje: 'Error al buscar marca',
                        errors: err,
                    });
                }

                if (!_brand) {
                    const BRAND = new Brand({
                        name: BODY._brand.name
                    });

                    await BRAND
                        .save()
                        .then((brand) => {
                            _brand = brand;
                        })
                        .catch(err => {
                            res.status(400).json({
                                ok: false,
                                mensaje: 'Error al crear marca',
                                errors: err,
                            });
                        })
                }

                product._brand = _brand;
                product.code = BODY.code;
                product.barcode = BODY.barcode;
                product.description = BODY.description;
                product.healthProgram = BODY.healthProgram;
                product.presentations = BODY.presentations;
                product.substances = BODY.substances;
                product.symptoms = BODY.symptoms;
                product.exempt = BODY.exempt;
                product.discontinued = BODY.discontinued;

                product.save((err, product) => {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            mensaje: 'Error al actualizar producto',
                            errors: err
                        });
                    }

                    res.status(200).json({
                        ok: true,
                        product
                    });
                });
            });
        });
    } catch (error) {
        console.log("🚀 ~ file: product.ts ~ line 23 ~ PRODUCT_ROUTER.put ~ error", error)
    }
});
/* #endregion */

/* #region  DELETE */
PRODUCT_ROUTER.delete('/:id', mdAuth, (req: Request, res: Response) => {
    try {
        const ID = req.params.id;

        Product.findById(ID, (err, product) => {
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
                    mensaje: 'El producto con el id' + ID + ' no existe',
                    errors: {
                        message: 'No existe un producto con ese ID'
                    }
                });
            }

            product.deleted = true;

            product.save((err, product) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al borrar producto',
                        errors: err
                    });
                }

                res.status(200).json({
                    ok: true,
                    product
                });
            });
        });
    } catch (error) {
        console.log(error);
    }
});
/* #endregion */

/* #region  POST */
PRODUCT_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    try {
        const BODY = req.body;

        if (BODY._brand) {
            BODY._brand.name = BODY._brand.name.replace(/\s/g, '');
            BODY._brand.name = BODY._brand.name.replace(/-/g, '').toUpperCase();
        }

        Brand.findOne({
            name: BODY._brand.name,
            deleted: false,
        }).exec(async (err, _brand) => {
            if (err) {
                res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar marca',
                    errors: err,
                });
            }

            if (!_brand) {
                const BRAND = new Brand({
                    name: BODY._brand.name
                });

                await BRAND
                    .save()
                    .then((brand) => {
                        _brand = brand;
                    })
                    .catch(err => {
                        res.status(400).json({
                            ok: false,
                            mensaje: 'Error al crear marca',
                            errors: err,
                        });
                    })
            }

            const PRODUCT = new Product({
                _brand,
                code: BODY.code,
                barcode: BODY.barcode,
                description: BODY.description,
                healthProgram: BODY.healthProgram,
                presentations: BODY.presentations,
                substances: BODY.substances,
                symptoms: BODY.symptoms,
                exempt: BODY.exempt,
            });

            PRODUCT
                .save()
                .then((product) => {
                    res.status(201).json({
                        ok: true,
                        product
                    });
                })
                .catch(err => {
                    res.status(400).json({
                        ok: false,
                        mensaje: 'Error al crear producto',
                        errors: err
                    });
                });
        });
    } catch (error) {
        console.log("🚀 ~ file: product.ts ~ line 10 ~ PRODUCT_ROUTER.post ~ error", error)
    }
});
/* #endregion */

PRODUCT_ROUTER.post('/xlsx', mdAuth, (req: Request, res: Response) => {

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

        let code = 0;
        await bluebird.mapSeries(DOC[0].data, async (doc: any, index) => {
            try {
                let marca: string = doc[6];
                if (marca) {
                    marca = marca.replace(/\s/g, '');
                    marca = marca.replace(/-/g, '').toUpperCase();
                }

                let _brand = await Brand.findOne({
                    name: marca,
                    deleted: false,
                }).exec();

                if (!_brand) {
                    const BRAND = new Brand({
                        name: marca
                    });

                    _brand = await BRAND
                        .save()
                        .then();
                }

                let misSus: any = [];
                if (doc[14]) { // SUSTANCIAS
                    let sustancias = doc[14].split('+');

                    await bluebird.mapSeries(sustancias, async (sustain: any, index) => {
                        if (sustain) {
                            sustain = sustain.replace(/\s/g, '');
                            sustain = sustain.replace(/-/g, '').toUpperCase();
                        }

                        let _sus = await Substance.findOne({
                            name: sustain,
                            deleted: false,
                        }).exec();

                        if (!_sus) {
                            const SUBSTANCE = new Substance({
                                name: sustain
                            });

                            _sus = await SUBSTANCE
                                .save()
                                .then();
                        }

                        misSus.push({_substanace: _sus});
                    });
                }

                const PRODUCT = new Product({
                    _brand,
                    code: code,
                    barcode: doc[3],
                    description: doc[1],
                    substances: misSus
                });

                let product = await PRODUCT
                    .save()
                    .then();

                code++;
                console.log("🚀 ~ file: product.ts ~ line 372 ~ awaitbluebird.mapSeries ~ code", code)
            } catch (e) {
                throw new Error(e.message);
            }
        });

        return res.status(201).json({
            ok: true,
            m: 'PRODUCTOS INGRESADOS'
        });
    });
});

export default PRODUCT_ROUTER;