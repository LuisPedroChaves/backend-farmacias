import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth';
import fileUpload from 'express-fileupload';
import xlsx from 'node-xlsx';
import bluebird from 'bluebird';
import Product from '../models/product';
import Brand from '../models/brand';

const PRODUCT_ROUTER = Router();
PRODUCT_ROUTER.use(fileUpload());


/* #region  GET pagination */
PRODUCT_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
    // Paginación
    let page = req.query.page || 0;
    let size = req.query.size || 20;
    page = Number(page) - 1;
    size = Number(size);
    page = (size * page);

    Product.find({
        deleted: false,
    })
        .populate('_brand')
        .skip(page)
        .limit(size)
        .sort({
            '_brand.name': 1
        })
        .exec((err, products) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando productos',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                products
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
                product.description = BODY.description;
                product.wholesale_price = BODY.wholesale_price;
                product.distributor_price = BODY.distributor_price;

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
                description: BODY.description,
                wholesale_price: BODY.wholesale_price,
                distributor_price: BODY.distributor_price,
                retail_price: BODY.retail_price,
                cf_price: BODY.cf_price,
                missing: BODY.missing,
                stagnant: BODY.stagnant,
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

        await bluebird.mapSeries(DOC[0].data, async (doc: any, index) => {
            try {
                let marca: string = doc[2];
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

                const PRODUCT = new Product({
                    _brand,
                    code: doc[0],
                    description: doc[1],
                    wholesale_price: doc[3],
                    distributor_price: doc[4],
                    retail_price: doc[5],
                    cf_price: doc[6],
                    missing: [],
                    stagnant: [],
                });

                let product = await PRODUCT
                    .save()
                    .then();

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