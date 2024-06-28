import { Router, Request, Response } from 'express';
import fs from 'fs';

const readFileRouter = Router();

readFileRouter.get('/:type/:file', (req: Request, res: Response) => {
    const type = req.params.type;
    const file = req.params.file;

    const path = `./uploads/${type}/${file}`;

    fs.stat(path, (err, stats) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar archivo',
                errors: err
            });
        }

        if (!stats) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El archivo no existe',
                errors: {
                    message: 'No existe el archivo, se ha eliminado o ha cambiado su ubicación'
                }
            });
        }

        res.sendfile(path);

    });

});

export default readFileRouter;