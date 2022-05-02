import { Router, Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import xlsx from 'node-xlsx';
import bluebird from 'bluebird';
import moment from 'moment-timezone';

import { mdAuth } from '../middleware/auth';
import Product from '../models/product';
import Brand from '../models/brand';
import Substance from '../models/substance';
import Symptoms from '../models/symptoms';
import { IProduct } from '../models/product';

const PRODUCT_ROUTER = Router();
PRODUCT_ROUTER.use(fileUpload());


/* #region  GET */
// Pagination
PRODUCT_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
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

PRODUCT_ROUTER.get('/search', mdAuth, (req: Request, res: Response) => {
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

PRODUCT_ROUTER.get('/searchCheckStock', mdAuth, (req: Request, res: Response) => {
    let search = req.query.search || '';
    search = String(search);
    let searchSplit = search.split('.');
    const FIELD = req.query.field || 'barcode';

    let query: any[] = [
        {
            $match: {
                barcode: search,
                discontinued: false,
                deleted: false
            }
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
        {
            $limit: 10
        },
    ];

    if (FIELD === 'description') {
        const REGEX = new RegExp(searchSplit[0], 'i');
        query[0] = {
            $match: {
                description: REGEX,
                discontinued: false,
                deleted: false
            }
        }

        if (searchSplit.length > 1) {
            const REGEX2 = new RegExp(searchSplit[1], 'i');
            query.splice(3, 0, {
                $match: {
                    '_brand.name': REGEX2
                }
            })
        }
    }

    // console.log(query);

    Product.aggregate(query).then((products) => {
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

// Busqueda en index por BARCODE y DESCRIPTION
// TODO: Eliminar si ya no funciona, Actualmente esta en desuso.
PRODUCT_ROUTER.get('/searchByIndex', mdAuth, (req: Request, res: Response) => {
    let search = req.query.search || '';
    search = String(search);

    if (search.length > 0) {
        Product.aggregate([
            {
                $search: {
                    index: 'checkStock',
                    "autocomplete": {
                        "query": search,
                        "path": "description",
                        "fuzzy": {
                            "maxEdits": 1,
                            "prefixLength": 1,
                            "maxExpansions": 256
                        }
                    }
                    // Autocompletado en varios campos
                    // "compound": {
                    //     "should": [{
                    //         "autocomplete": {
                    //             "query": search,
                    //             "path": "description",
                    //             "fuzzy": {
                    //                 "maxEdits": 1,
                    //                 "prefixLength": 1,
                    //                 "maxExpansions": 256
                    //               }
                    //         }
                    //     },
                    //     {
                    //         "autocomplete": {
                    //             "query": search,
                    //             "path": "barcode",
                    //         }
                    //     }]
                    // }
                }
            },
            {
                $match: {
                    deleted: false
                }
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
            {
                $sort: {
                    description: 1
                }
            }
        ], (err: any, products: IProduct[]) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando productos',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                products,
            });
        })
    } else {
        res.status(200).json({
            ok: true,
            products: [],
        });
    }
});

PRODUCT_ROUTER.get('/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;

    Product.findById(id, (err, product) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar producto',
                errors: err,
            });
        }

        if (!product) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El producto con el id' + id + ' no existe',
                errors: {
                    message: 'No existe un producto con ese ID',
                },
            });
        }

        res.status(200).json({
            ok: true,
            product,
        });
    })
        .populate('_brand', '')
        .populate('substances', '')
        .populate('symptoms', '');
});
/* #endregion */

/* #region  PUT */
PRODUCT_ROUTER.put('/', mdAuth, async (req: Request, res: Response) => {
    const BODY = req.body;

    const barcode = BODY.barcode;
    // PRESENTACION POR UNIDAD
    const PRESENTATIONS: any = [];
    const name: string = 'UNIDAD';
    const cost: number = BODY.cost;
    const wholesale_price: number = BODY.wholesale_price;
    const distributor_price: number = BODY.distributor_price;
    const retail_price: number = BODY.retail_price;
    const cf_price: number = BODY.cf_price;
    const quantity: number = 1;
    const commission: number = 0;
    PRESENTATIONS.push({
        name,
        wholesale_price,
        distributor_price,
        retail_price,
        cf_price,
        quantity,
        commission,
        cost
    });

    const PRODUCT = await Product.findOne({
        barcode,
    }).exec();

    if (!PRODUCT) {
        if (BODY._brand) {
            let _brand = await Brand.findOne({
                code: BODY._brand,
                deleted: false,
            }).exec();

            if (_brand) {
                const NEW_PRODUCT = new Product({
                    _brand,
                    code: 0,
                    barcode,
                    description: BODY.description.toUpperCase(),
                    presentations: PRESENTATIONS
                });

                let product = await NEW_PRODUCT
                    .save()
                    .then();
            } else {
                const NEW_PRODUCT = new Product({
                    code: 0,
                    barcode,
                    description: BODY.description.toUpperCase(),
                    presentations: PRESENTATIONS
                });

                let product = await NEW_PRODUCT
                    .save()
                    .then();
            }
        } else {
            const NEW_PRODUCT = new Product({
                code: 0,
                barcode,
                description: BODY.description.toUpperCase(),
                presentations: PRESENTATIONS
            });

            let product = await NEW_PRODUCT
                .save()
                .then();
        }
        return res.status(200).json({
            ok: true
        });
    }

    if (BODY._brand) {
        let _brand = await Brand.findOne({
            code: BODY._brand,
            deleted: false,
        }).exec();

        if (_brand) {
            await Product.updateOne({
                _id: PRODUCT._id
            }, {
                _brand,
                barcode,
                description: BODY.description.toUpperCase(),
                presentations: PRESENTATIONS
            }).exec();
        } else {
            await Product.updateOne({
                _id: PRODUCT._id
            }, {
                barcode,
                description: BODY.description.toUpperCase(),
                presentations: PRESENTATIONS
            }).exec();
        }

        res.status(200).json({
            ok: true
        });
    } else {
        await Product.updateOne({
            _id: PRODUCT._id
        }, {
            barcode,
            description: BODY.description.toUpperCase(),
            presentations: PRESENTATIONS
        }).exec();

        res.status(200).json({
            ok: true
        });
    }
})

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

                const SUBSTANCES = await SEARCH_SUBSTANCES(BODY.substances);
                const SYMPTOMS = await SEARCH_SYMPTOMS(BODY.symptoms);

                product._brand = _brand;
                product.barcode = BODY.barcode;
                product.description = BODY.description;
                product.healthProgram = BODY.healthProgram;
                product.presentations = BODY.presentations;
                product.substances = SUBSTANCES;
                product.symptoms = SYMPTOMS;
                product.lastUpdate = moment().tz("America/Guatemala").format();
                product.exempt = BODY.exempt;

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

PRODUCT_ROUTER.put('/prices/:id', mdAuth, (req: Request, res: Response) => {
    const ID = req.params.id;
    const BODY = req.body;

    Product.updateOne(
        {
            _id: BODY._id,
            'presentations.name': BODY.name,
        },
        {
            'presentations.$.wholesale_price': BODY.wholesale_price,
            'presentations.$.distributor_price': BODY.distributor_price,
            'presentations.$.retail_price': BODY.retail_price,
            'presentations.$.cf_price': BODY.cf_price,
        },
        (err, product) => {
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
/* #endregion */

/* #region  Delete */
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

PRODUCT_ROUTER.delete('/discontinued/:id', mdAuth, (req: Request, res: Response) => {
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

            product.discontinued = true;

            product.save((err, product) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al descontinuar producto',
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

            Product.findOne(
                {
                    deleted: false
                },
                'code',
                {
                    sort: {
                        code: -1
                    }
                },
                async (err, product) => {
                    if (err) {
                        return res.status(500).json({
                            ok: false,
                            mensaje: 'Error al buscar correlativo',
                            errors: err,
                        });
                    }

                    // Definiciones para la factura
                    let correlative = 1;
                    if (product) {
                        correlative = Number(product.code) + 1;
                    }

                    const SUBSTANCES = await SEARCH_SUBSTANCES(BODY.substances);
                    const SYMPTOMS = await SEARCH_SYMPTOMS(BODY.symptoms);

                    const PRODUCT = new Product({
                        _brand,
                        code: correlative,
                        barcode: BODY.barcode,
                        description: BODY.description,
                        healthProgram: BODY.healthProgram,
                        presentations: BODY.presentations,
                        substances: SUBSTANCES,
                        symptoms: SYMPTOMS,
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
                }
            );
        });
    } catch (error) {
        console.log("🚀 ~ file: product.ts ~ line 10 ~ PRODUCT_ROUTER.post ~ error", error)
    }
});

PRODUCT_ROUTER.post('/xlsx', (req: Request, res: Response) => {

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

        let code = 1;
        await bluebird.mapSeries(DOC[0].data, async (doc: any, index) => {
            try {
                const BRAND_CODE: number = doc[2];

                let _brand = await Brand.findOne({
                    code: BRAND_CODE,
                    deleted: false,
                }).exec();

                if (_brand) {
                    // Seguimos solo si existe la marca
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

                            misSus.push({ _substanace: _sus });
                        });
                    }

                    const DESCRIPTION: string = doc[1];

                    // PRESENTACION POR UNIDAD
                    const PRESENTATIONS: any = [];
                    const name: string = 'UNIDAD';
                    const cost: number = doc[3];
                    const wholesale_price: number = doc[4];
                    const distributor_price: number = doc[5];
                    const retail_price: number = doc[6];
                    const cf_price: number = doc[7];
                    const quantity: number = 1;
                    const commission: number = 0;
                    PRESENTATIONS.push({
                        name,
                        wholesale_price,
                        distributor_price,
                        retail_price,
                        cf_price,
                        quantity,
                        commission,
                        cost
                    });

                    const PRODUCT = await Product.findOne({
                        barcode: doc[0],
                    }).exec();

                    if (!PRODUCT) {
                        const NEW_PRODUCT = new Product({
                            _brand,
                            code: code,
                            barcode: doc[0],
                            description: DESCRIPTION.toUpperCase(),
                            substances: misSus,
                            presentations: PRESENTATIONS
                        });

                        let product = await NEW_PRODUCT
                            .save()
                            .then();
                    } else {
                        await Product.updateOne({
                            _id: PRODUCT._id
                        }, {
                            _brand,
                            code: code,
                            barcode: doc[0],
                            description: DESCRIPTION.toUpperCase(),
                            substances: misSus,
                            presentations: PRESENTATIONS
                        }).exec();
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
            m: 'PRODUCTOS INGRESADOS'
        });
    });
});
/* #endregion */

const SEARCH_SUBSTANCES = (substances: string[]): Promise<[]> => {

    const PROMISES = substances.map((element: string) => {
        return new Promise((resolve, reject) => {

            if (element) {
                element = element.replace(/\s/g, '');
                element = element.replace(/-/g, '').toUpperCase();
            }

            Substance.findOne({
                name: element,
                deleted: false,
            }).exec(async (err, substance) => {
                if (err) {
                    reject(err);
                }

                if (!substance) {
                    const SUBSTANCE = new Substance({
                        name: element
                    });

                    await SUBSTANCE
                        .save()
                        .then((substanceSave) => {
                            resolve(substanceSave._id);
                        })
                        .catch(err => {
                            reject(err)
                        })
                } else {
                    resolve(substance._id);
                }
            });
        });
    });

    return Promise.all(PROMISES).then();
};

const SEARCH_SYMPTOMS = (symptoms: string[]): Promise<[]> => {

    const PROMISES = symptoms.map((element: string) => {
        return new Promise((resolve, reject) => {

            if (element) {
                element = element.replace(/\s/g, '');
                element = element.replace(/-/g, '').toUpperCase();
            }

            Symptoms.findOne({
                name: element,
                deleted: false,
            }).exec(async (err, symptom) => {
                if (err) {
                    reject(err);
                }

                if (!symptom) {
                    const SYMPTOM = new Symptoms({
                        name: element
                    });

                    await SYMPTOM
                        .save()
                        .then((symptomSave) => {
                            resolve(symptomSave._id);
                        })
                        .catch(err => {
                            reject(err)
                        })
                } else {
                    resolve(symptom._id);
                }
            });
        });
    });

    return Promise.all(PROMISES).then();
};

export default PRODUCT_ROUTER;