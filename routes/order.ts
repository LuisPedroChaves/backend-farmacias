import { Router, Request, Response } from 'express';
// import mongoose from 'mongoose';
import { mdAuth } from '../middleware/auth'
import Order from '../models/order';
import Customer from '../models/customer';

import { IOrder } from '../models/order';

const orderRouter = Router();
// const ObjectId = mongoose.Types.ObjectId;

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
        .exec((err: any, orders: IOrder) => {
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

/* #region  GET / ID */
orderRouter.get('/order/:id', mdAuth, (req: Request, res: Response) => {
	const id = req.params.id;

    Order.findById(id, (err, order) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				mensaje: 'Error al buscar orden',
				errors: err,
			});
		}

		if (!order) {
			return res.status(400).json({
				ok: false,
				mensaje: 'La orden con el id' + id + ' no existe',
				errors: {
					message: 'No existe una orden con ese ID',
				},
			});
		}

        res.status(200).json({
            ok: true,
            order,
        });
	});
});
/* #endregion */

/* #region  PUT */
orderRouter.put('/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;
    const body = req.body;

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

        if (body.nit) {
            body.nit = body.nit.replace(/\s/g, '');
            body.nit = body.nit.replace(/-/g, '').toUpperCase();
        }

        Customer.findOne({
            nit: body.nit,
            deleted: false
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
                } else {
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
            } else if (_customer) {
                _customer.name = body.name;
                _customer.nit = body.nit;
                _customer.phone = body.phone;
                _customer.address = body.address;
                _customer.town = body.town;
                _customer.department = body.department;

                await _customer.save((err, NewCustomer) => {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            mensaje: 'Error al actualizar cliente',
                            errors: err
                        });
                    }
                    _customer = NewCustomer;
                });
            }

            order._customer = _customer;
            order._user = body._user;
            order.nit = body.nit;
            order.name = body.name;
            order.phone = body.phone;
            order.address = body.address;
            order.town = body.town;
            order.department = body.department;
            order.details = body.details;
            order.payment = body.payment;
            order.total = body.total;

            order.save((err, order) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al actualizar orden',
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
});
/* #endregion */

/* #region  PUT */
orderRouter.put('/state/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;
    const body = req.body;

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

        order.noBill = body.noBill;
        order.state = body.state;
        order.timeDispatch = body.timeDispatch;
        order.timeSend = body.timeSend;
        order.timeDelivery = body.timeDelivery;

        order.save((err, order) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar order',
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

/* #region  DELETE */
orderRouter.delete('/:id', mdAuth, (req: Request, res: Response) => {
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
            nit: body.nit,
            deleted: false
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
                } else {
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
            }else if (_customer) {
                _customer.name = body.name;
                _customer.nit = body.nit;
                _customer.phone = body.phone;
                _customer.address = body.address;
                _customer.town = body.town;
                _customer.department = body.department;

                await _customer.save((err, NewCustomer) => {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            mensaje: 'Error al actualizar cliente',
                            errors: err
                        });
                    }
                    _customer = NewCustomer;
                });
            }

            Order.findOne(
                {
                    _cellar: body._cellar,
                    deleted: false
                },
                'noOrder',
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

                    const newOrder = new Order({
                        _cellar: body._cellar,
                        _user: body._user,
                        _customer,
                        noOrder: correlative,
                        noBill: body.noBill,
                        name: body.name,
                        nit: body.nit,
                        phone: body.phone,
                        address: body.address,
                        town: body.town,
                        department: body.department,
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