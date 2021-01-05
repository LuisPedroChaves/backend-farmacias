// import { Router, Request, Response } from 'express';
// import Role from '../models/role';

// // var mdAuth = require('../middleware/auth');
// // import mongoose from 'mongoose';
// // var ObjectId = mongoose.Types.ObjectId;

// const roleRouter = Router();

// /* #region  GET */
// // appRouter.get('/', mdAuth.verificaToken, (req: Request, res: Response) => {
// roleRouter.get('/', (req: Request, res: Response) => {
// 	Role.find(
// 		{
// 			deleted: false
// 		},
// 		''
// 	)
// 		.sort({
// 			name: 1
// 		})
// 		.exec((err, cellars) => {
// 			if (err) {
// 				return res.status(500).json({
// 					ok: false,
// 					mensaje: 'Error listando sucursales',
// 					errors: err
// 				});
// 			}

// 			res.status(200).json({
// 				ok: true,
// 				cellars
// 			});
// 		});
// });
// /* #endregion */

// /* #region  GET cellars DASHBOARD */
// // app.get('/dashboard/:id', mdAuth.verificaToken, function(req, res) {
// // 	var id = req.params.id;

// // 	Promise.all([
// // 		// contando EMPLEADOS
// // 		Employee.find({ _cellar: id })
// // 			.countDocuments()
// // 			.exec(),
// // 		// contando PRODUCTOS
// // 		Product.aggregate([
// // 			{
// // 				$match: {
// // 					'storage._cellar': ObjectId(id),
// // 					deleted: false
// // 				}
// // 			},
// // 			{
// // 				$unwind: '$storage'
// // 			},
// // 			{
// // 				$match: {
// // 					'storage._cellar': ObjectId(id),
// // 					deleted: false
// // 				}
// // 			},
// // 			{
// // 				$count: 'totalStorage'
// // 			}
// // 		]),
// // 		// contando EMPLEADOS
// // 		Sale.find({ _cellar: id })
// // 			.countDocuments()
// // 			.exec()
// // 	]).then(function(counts) {
// // 		let totalProducts = 0;
// // 		if (counts[1].length > 0) {
// // 			let arrayCount = counts[1];
// // 			let objectCount = arrayCount[0];
// // 			totalProducts = objectCount.totalStorage;
// // 		}

// // 		res.status(200).json({
// // 			ok: true,
// // 			clientes: counts[0],
// // 			productos: totalProducts,
// // 			empleados: counts[2]
// // 		});
// // 	});
// // });
// /* #endregion */

// /* #region  PUT */
// // cellarRouter.put('/:id', mdAuth.verificaToken, (req: Request, res: Response) => {
// roleRouter.put('/:id', (req: Request, res: Response) => {
// 	const id = req.params.id;
// 	const body = req.body;

// 	Role.findById(id, (err, cellar) => {
// 		if (err) {
// 			return res.status(500).json({
// 				ok: false,
// 				mensaje: 'Error al buscar sucursal',
// 				errors: err
// 			});
// 		}

// 		if (!cellar) {
// 			return res.status(400).json({
// 				ok: false,
// 				mensaje: 'La sucursal con el id' + id + ' no existe',
// 				errors: {
// 					message: 'No existe una sucursal con ese ID'
// 				}
// 			});
// 		}

// 		cellar.name = body.name;
// 		cellar.address = body.address;
// 		cellar.description = body.description;
// 		cellar.type = body.type;

// 		cellar.save((err, cellar) => {
// 			if (err) {
// 				return res.status(400).json({
// 					ok: false,
// 					mensaje: 'Error al actualizar sucursal',
// 					errors: err
// 				});
// 			}

// 			res.status(200).json({
// 				ok: true,
// 				cellar
// 			});
// 		});
// 	});
// });
// /* #endregion */

// /* #region  DELETE */
// // cellarRouter.put('/delete/:id', mdAuth.verificaToken, (req: Request, res: Response) => {
// roleRouter.delete('/:id', (req: Request, res: Response) => {
// 	const id = req.params.id;

// 	Role.findById(id, (err, cellar) => {
// 		if (err) {
// 			return res.status(500).json({
// 				ok: false,
// 				mensaje: 'Error al buscar sucursal',
// 				errors: err
// 			});
// 		}

// 		if (!cellar) {
// 			return res.status(400).json({
// 				ok: false,
// 				mensaje: 'La sucursal con el id' + id + ' no existe',
// 				errors: {
// 					message: 'No existe una sucursal con ese ID'
// 				}
// 			});
// 		}

// 		cellar.deleted = true;

// 		cellar.save((err, cellar) => {
// 			if (err) {
// 				return res.status(400).json({
// 					ok: false,
// 					mensaje: 'Error al borrar sucursal',
// 					errors: err
// 				});
// 			}

// 			res.status(200).json({
// 				ok: true,
// 				cellar
// 			});
// 		});
// 	});
// });
// /* #endregion */

// /* #region  POST cellar */
// // cellarRouter.post('/', mdAuth.verificaToken, (req: Request, res: Response) => {
// roleRouter.post('/', (req: Request, res: Response) => {
// 	const body = req.body;

// 	const cellar = new Role({
// 		name: body.name,
// 		address: body.address,
// 		description: body.description,
// 		type: body.type,
// 	});

// 	cellar
// 		.save()
// 		.then((cellar) => {
// 			res.status(201).json({
// 				ok: true,
// 				cellar
// 			});
// 		})
// 		.catch((error) => {
// 			res.status(400).json({
// 				ok: false,
// 				mensaje: 'Error al crear sucursal',
// 				errors: error
// 			});
// 		});
// });
// /* #endregion */

// export default roleRouter;
