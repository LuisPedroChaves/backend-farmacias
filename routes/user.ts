import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs'
import { mdAuth } from '../middleware/auth';

import User from '../models/user';
// import mongoose from 'mongoose';
// var ObjectId = mongoose.Types.ObjectId;

const USER_ROUTER = Router();

/* #region  GET'S */
USER_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
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

// by ID
USER_ROUTER.get('/user/:id', mdAuth, (req: Request, res: Response) => {
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

        res.status(200).json({
            ok: true,
            user,
        });
    })
    .populate('_role', '')
});
/* #endregion */

/* #region  PUT'S */
USER_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
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

USER_ROUTER.put('/changepass/:id', mdAuth, (req: Request, res: Response) => {
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

		if (!bcrypt.compareSync(body.oldPassword, user.password)) {
			return res.status(400).json({
				ok: false,
				mensaje: 'Contraseña Incorrecta',
				errors: err,
			});
		}

		user.password = bcrypt.hashSync(body.newPassword, 10);

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
USER_ROUTER.delete('/:id', mdAuth, (req: Request, res: Response) => {
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

/* #region  LOGIN */
USER_ROUTER.post('/login', mdAuth,  (req: Request, res: Response) => {
	const body = req.body;

	User.findOne({
		username: body.username,
		deleted: false,
	})
		.populate('_role', '')
		.populate('_cellar', '')
		.exec((err, userBD) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: 'Error al buscar usuario',
					errors: err,
				});
			}

			if (!userBD) {
				return res.status(400).json({
					ok: false,
					mensaje: 'Credenciales incorrectas - email',
					errors: err,
				});
			}

			if (!bcrypt.compareSync(body.password, userBD.password)) {
				return res.status(400).json({
					ok: false,
					mensaje: 'Credenciales incorrectas - password',
					errors: err,
				});
			}

			if (userBD._role.type !== 'ADMIN') {
				return res.status(400).json({
					ok: false,
					mensaje: 'Credenciales incorrectas',
					errors: err,
				});
			}

            res.status(200).json({
                ok: true
            });
		});
});
/* #endregion */

/* #region  POST cellar */
USER_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
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

export default USER_ROUTER;
