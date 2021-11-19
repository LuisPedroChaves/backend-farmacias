import { Router, Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import xlsx from 'node-xlsx';
import bluebird from 'bluebird';

import Product from '../models/product';
import TempSale from '../models/tempSale';

const TEMP_SALE_ROUTER = Router();
TEMP_SALE_ROUTER.use(fileUpload());

/* #region  POST */
TEMP_SALE_ROUTER.post('/xlsx',  (req: Request, res: Response) => {
    const BODY = req.body;

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

    // Extensiones permitidas
    const VALID_EXTS = ['xlsx'];

    if (VALID_EXTS.indexOf(EXT_FILE) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Extensión no válida',
            errors: { message: 'Las extensiones válidas son: ' + VALID_EXTS.join(', ') }
        });
    }

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
        let errors: any[] = [];
        await bluebird.mapSeries(DOC[0].data, async (doc: any, index) => {
            try {
                const BARCODE: string = doc[0];
                const QUANTITY: number = doc[1];

                let _product = await Product.findOne({
                    barcode: BARCODE,
                    deleted: false,
                }).exec();

                if (!_product) {
                    errors.push({
                        barcode: BARCODE,
                        error: 'No se encontró un producto con este código'
                    })
                }else {
                    const NEW_TEMP_SALE = new TempSale({
                        _cellar: BODY._cellar,
                        _product: _product._id,
                        date: BODY.date,
                        quantity: QUANTITY
                    });

                    await NEW_TEMP_SALE.save().then();
                }

                code++;
                console.log("🚀 ~ file: product.ts ~ line 372 ~ awaitbluebird.mapSeries ~ code", code)
            } catch (e: any) {
                throw new Error(e.message);
            }
        });

        return res.status(200).json({
            ok: true,
            errors
        });
    });
});
/* #endregion */

export default TEMP_SALE_ROUTER;