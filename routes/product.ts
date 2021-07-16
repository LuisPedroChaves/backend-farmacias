import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth';
import Product from '../models/product';
import Brand from '../models/brand';

const PRODUCT_ROUTER = Router();

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

export default PRODUCT_ROUTER;