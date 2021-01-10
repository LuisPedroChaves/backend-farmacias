import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs'
import User from '../models/user';

// var mdAuth = require('../middleware/auth');
// import mongoose from 'mongoose';
// var ObjectId = mongoose.Types.ObjectId;

const userRouter = Router();

/* #region  GET */
// appRouter.get('/', mdAuth.verificaToken, (req: Request, res: Response) => {
userRouter.get('/', (req: Request, res: Response) => {
	User.find(
		{
			deleted: false,
		},
		'_role _cellar name username imageIndex email'
	)
		.populate('_role')
		.populate('_cellar')
		.sort({ name: 1 })
		.exec((err, users) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: 'Error listando usuarios',
					errors: err,
				});
			}

			res.status(200).json({
				ok: true,
				users: users,
			});
		});
});
/* #endregion */

/* #region  PUT */
// cellarRouter.put('/:id', mdAuth.verificaToken, (req: Request, res: Response) => {
userRouter.put('/:id', (req: Request, res: Response) => {
	const id = req.params.id;
	const body = req.body;

	User.findById(id, (err, user) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				mensaje: 'Error al buscar usuario',
				errors: err,
			});
		}

		if (!user) {
			return res.status(400).json({
				ok: false,
				mensaje: 'El usuario con el id' + id + ' no existe',
				errors: {
					message: 'No existe un usuario con ese ID',
				},
			});
		}

		user._role = body._role;
		user._cellar = body._cellar;
		user.name = body.name;
		user.imageIndex = body.imageIndex;
		user.email = body.email;

		user.save((err, userS) => {
			if (err) {
				return res.status(400).json({
					ok: false,
					mensaje: 'Error al actualizar usuario',
					errors: err,
				});
			}

			userS.password = '********';

			res.status(200).json({
				ok: true,
				user: userS,
			});
		});
	});
});
/* #endregion */

/* #region  DELETE */
// cellarRouter.put('/delete/:id', mdAuth.verificaToken, (req: Request, res: Response) => {
userRouter.delete('/:id', (req: Request, res: Response) => {
	const id = req.params.id;

	User.findById(id, (err, user) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				mensaje: 'Error al buscar usuario',
				errors: err,
			});
		}

		if (!user) {
			return res.status(400).json({
				ok: false,
				mensaje: 'El usuario con el id' + id + ' no existe',
				errors: {
					message: 'No existe un usuario con ese ID',
				},
			});
		}

		user.username = user.username + ' borrado';
		user.deleted = true;

		user.save((err, userD) => {
			if (err) {
				return res.status(400).json({
					ok: false,
					mensaje: 'Error al borrar usuario',
					errors: err,
				});
			}

			res.status(200).json({
				ok: true,
				user: userD,
			});
		});
	});
});
/* #endregion */

/* #region  POST cellar */
// cellarRouter.post('/', mdAuth.verificaToken, (req: Request, res: Response) => {
userRouter.post('/', (req: Request, res: Response) => {
	const body = req.body;

	const user = new User({
		_role: body._role,
		_cellar: body._cellar,
		name: body.name,
		username: body.username,
		password: bcrypt.hashSync(body.password, 10),
		imageIndex: body.imageIndex,
		email: body.email,
	});

	user
		.save()
		.then((user) => {
			res.status(201).json({
				ok: true,
				user: user,
			});
		})
		.catch((err) => {
			res.status(400).json({
				ok: false,
				mensaje: 'Error al crear usuario',
				errors: err,
			});
		});
});
/* #endregion */

export default userRouter;
