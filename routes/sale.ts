import { Router, Request, Response } from 'express';
// import mongoose from 'mongoose';
import moment from 'moment-timezone';
import { mdAuth } from '../middleware/auth'
import Sale from '../models/sale';
import Customer from '../models/customer';

import { ISale, ISaleBalance } from '../models/sale';

const saleRouter = Router();
// const ObjectId = mongoose.Types.ObjectId;

/* #region  GET */
saleRouter.get('/history/:_customer', mdAuth, (req: Request, res: Response) => {
    const mes: number = Number(req.query.month);
    let mes2 = 0;
    let año: number = Number(req.query.year);
    let año2: number = Number(req.query.year);
    const _customer = req.params._customer;

    if (mes == 12) {
        mes2 = 1;
        año2 = año + 1;
    } else {
        mes2 = mes + 1;
    }

    Sale.find(
        {
            _customer,
            date: {
                $gte: new Date(año + ',' + mes),
                $lt: new Date(año2 + ',' + mes2),
            },
            paid: true,
            deleted: false
        },
        ''
    )
        .populate('_seller', '')
        .populate('_cellar', '')
        .sort({
            date: -1
        })
        .exec((err: any, sales: ISale) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando ventas',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                sales
            });
        });
});
/* #endregion */

/* #region  GET */
saleRouter.get('/:_cellar', mdAuth, (req: Request, res: Response) => {
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

    Sale.find(
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
        .populate('_seller', '')
        .populate('_customer', '')
        .sort({
            date: -1
        })
        .exec((err: any, sales: ISale) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando ventas',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                sales
            });
        });
});
/* #endregion */

/* #region  PUT venta */
saleRouter.put('/:id', mdAuth, (req, res) => {
    const id = req.params.id;
    const body = req.body;

    Sale.findById(id, function(err, sale: ISale) {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al buscar venta',
          errors: err
        });
      }

      if (!sale) {
        return res.status(400).json({
          ok: false,
          mensaje: 'La venta con el id' + id + ' no existe',
          errors: {
            message: 'No existe una venta con ese ID'
          }
        });
      }

      // CALCULO PARA PAGAR LA COMPRA
      var balance: number = body.balance.reduce(
        (sum: number, item: ISaleBalance) => Number(sum) + Number(item.amount),
        0
      );

      if (Number((sale.total - balance).toFixed(2)) <= 0) {
        body.paid = true;
      } else {
        body.paid = false;
      }

      sale.balance = body.balance;
      sale.paid = body.paid;

      sale.save(function(err, sale) {
        if (err) {
          return res.status(400).json({
            ok: false,
            mensaje: 'Error al actualizar venta',
            errors: err
          });
        }

        res.status(200).json({
            ok: true,
            sale
          });
      });
    });
  });
  /* #endregion */

  /* #region  DELETE */
  saleRouter.delete('/:id', mdAuth, (req: Request, res: Response) => {
	const id = req.params.id;

	Sale.findById(id, (err, sale) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				mensaje: 'Error al buscar venta',
				errors: err,
			});
		}

		if (!sale) {
			return res.status(400).json({
				ok: false,
				mensaje: 'La venta con el id' + id + ' no existe',
				errors: {
					message: 'No existe una venta con ese ID',
				},
			});
		}

		sale.deleted = true;

		sale.save((err, sale) => {
			if (err) {
				return res.status(400).json({
					ok: false,
					mensaje: 'Error al borrar venta',
					errors: err,
				});
			}

			res.status(200).json({
				ok: true,
				sale,
			});
		});
	});
});
/* #endregion */

/* #region  POST cellar */
saleRouter.post('/', mdAuth, (req: Request, res: Response) => {
    const body = req.body;

    try {
        if (body.code) {
            body.code = body.code.replace(/\s/g, '').toUpperCase();
        }

        Customer.findOne({
            $or: [{ code: body.code }, { nit: body.nit }],
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
                    body.nit = 'CF';
                }
                // hay que guaradar el cliente
                const customer = new Customer({
                    code: body.code,
                    name: body.name,
                    nit: body.nit,
                    phone: body.phone,
                    address: body.address,
                    town: body.town,
                    department: body.department,
                    company: body.company,
                    transport: body.transport,
                    limitCredit: body.limitCredit,
                    limitDaysCredit: body.limitDaysCredit,
                    _seller: body._seller,
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
            } else if (_customer) {
                _customer.code = body.code;
                _customer.name = body.name;
                _customer.nit = body.nit;
                _customer.phone = body.phone;
                _customer.address = body.address;
                _customer.town = body.town;
                _customer.department = body.department;
                _customer.company = body.company;
                _customer.transport = body.transport;
                _customer.limitCredit = body.limitCredit;
                _customer.limitDaysCredit = body.limitDaysCredit;
                _customer._seller = body._seller;

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

            const newSale = new Sale({
                _cellar: body._cellar,
                _customer,
                _seller: body._seller,
                date: body.date,
                noBill: body.noBill,
                balance: body.balance,
                total: body.total,
            });

            newSale
                .save()
                .then((sale) => {
                    res.status(200).json({
                        ok: true,
                        sale,
                    });
                })
                .catch((err) => {
                    res.status(400).json({
                        ok: false,
                        mensaje: 'Error al crear venta',
                        errors: err,
                    });
                });
        });
    } catch (err) {
        // ERROR GLOBAL
        console.log("🚀 ~ file: order.ts ~ line 1248 ~ orderRouter.post ~ err", err)
    }
});
/* #endregion */

export default saleRouter;
