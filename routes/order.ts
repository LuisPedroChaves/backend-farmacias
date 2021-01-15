import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth'
import Order from '../models/order';
import Customer from '../models/customer';

// import mongoose from 'mongoose';
// var ObjectId = mongoose.Types.ObjectId;

const orderRouter = Router();

/* #region  GET */
orderRouter.get('/:_cellar', mdAuth, (req: Request, res: Response) => {
    const mes: number = Number(req.query.month);
    let mes2 = 0;
    let año: number = Number(req.query.year);
    let año2: number = Number(req.query.year);
    const _cellar = req.params._cellar;

    if (mes == 12) {
        mes2 = 1;
        año2 = año + 1;
    } else {
        mes2 = mes + 1;
    }

    Order.find(
        {
            _cellar,
            date: {
                $gte: new Date(año + ',' + mes),
                $lt: new Date(año2 + ',' + mes2),
            },
            deleted: false
        },
        ''
    )
        .populate('_user', '')
        .populate('_customer', '')
        .sort({
            noOrder: -1
        })
        .exec((err, orders) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando ordenes',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                orders
            });
        });
});
/* #endregion */

/* #region  PUT */
orderRouter.put('/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;
    const body = req.body;

    Order.findById(id, (err, cellar) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar sucursal',
                errors: err
            });
        }

        if (!cellar) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La sucursal con el id' + id + ' no existe',
                errors: {
                    message: 'No existe una sucursal con ese ID'
                }
            });
        }

        // cellar.name = body.name;
        // cellar.address = body.address;
        // cellar.description = body.description;
        // cellar.type = body.type;

        cellar.save((err, cellar) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar sucursal',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                cellar
            });
        });
    });
});
/* #endregion */

/* #region  DELETE */
orderRouter.delete('/delete/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;

    Order.findById(id, (err, order) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar orden',
                errors: err
            });
        }

        if (!order) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La orden con el id' + id + ' no existe',
                errors: {
                    message: 'No existe una orden con ese ID'
                }
            });
        }

        order.deleted = true;

        order.save((err, order) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar orden',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                order
            });
        });
    });
});
/* #endregion */

/* #region  POST cellar */
orderRouter.post('/', mdAuth, (req: Request, res: Response) => {
    const body = req.body;

	try {
		if (body.nit) {
			body.nit = body.nit.replace(/\s/g, '');
			body.nit = body.nit.replace(/-/g, '').toUpperCase();
		}

		Customer.findOne({
			$or: [{ nit: body.nit }, { name: body.name }],
		}).exec(async (err, _customer) => {
			if (err) {
				res.status(500).json({
					ok: false,
					mensaje: 'Error al buscar cliente',
					errors: err,
				});
			}

			if (!_customer) {
				if (
					!body.nit ||
					body.nit === '' ||
					body.nit === 'C/F' ||
					body.nit === 'c/f' ||
					body.nit === 'cf' ||
					body.nit === 'CF'
				) {
					// El cliente no existe y no hay que guardarlo
					body.nit = 'CF';
				}
					// hay que guaradar el cliente
					const customer = new Customer({
						name: body.name,
						nit: body.nit,
						phone: body.phone,
						address: body.address,
						town: body.town,
						department: body.department,
					});

					await customer
						.save()
						.then((NewCustomer) => {
							_customer = NewCustomer;
						})
						.catch((err) => {
							res.status(400).json({
								ok: false,
								mensaje: 'Error al crear cliente',
								errors: err,
							});
						});
			}

			Order.findOne(
				{
					_cellar: body._cellar,
                    deleted: false
				},
                'no serie',
                {
                    sort: {
                        noOrder: -1
                    }
                },
				function (err, order) {
					if (err) {
						return res.status(500).json({
							ok: false,
							mensaje: 'Error al buscar correlativo',
							errors: err,
						});
					}

					// Definiciones para la factura
					let correlative = 0;
					if (order) {
						correlative = Number(order.noOrder) + 1;
					}
					body.nit = body.nit.replace(/\s/g, '');
                    body.nit = body.nit.replace(/-/g, '').toUpperCase();

                    const newOrder = new Order({
                        _cellar: body._cellar,
                        _user: body._user,
                        _customer,
                        noOrder: correlative,
                        noBill: body.noBill,
                        details: body.details,
                        payment: body.payment,
                        total: body.total,
                        timeOrder: body.timeOrder
                    });

                    newOrder
                        .save()
                        .then((order) => {
                            res.status(200).json({
                                ok: true,
                                order,
                            });
                        })
                        .catch((err) => {
                            res.status(400).json({
                                ok: false,
                                mensaje: 'Error al crear orden',
                                errors: err,
                            });
                        });
				}
			);
		});
	} catch (err) {
		// ERROR GLOBAL
        console.log("🚀 ~ file: order.ts ~ line 1248 ~ orderRouter.post ~ err", err)
	}
});
/* #endregion */

export default orderRouter;
