import { Router, Request, Response } from "express";
import fileUpload from "express-fileupload";
import xlsx from "node-xlsx";
import bluebird from "bluebird";

import { mdAuth } from "../middleware/auth";
import Provider, { IProvider } from "../models/provider";
import { UPDATE_BALANCE } from "../functions/provider";

const PROVIDER_ROUTER = Router();
PROVIDER_ROUTER.use(fileUpload());

/* #region  GET */
PROVIDER_ROUTER.get("/", mdAuth, (req: Request, res: Response) => {
  Provider.find({
    $or: [{ isExpenses: { $exists: false } }, { isExpenses: false }],
    deleted: false,
  })
    .sort({
      name: 1,
    })
    .exec(async (err: any, providers: IProvider[]) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: "Error listando proveedores",
          errors: err,
        });
      }

      res.status(200).json({
        ok: true,
        providers,
      });
    });
});

PROVIDER_ROUTER.get("/isExpenses", mdAuth, (req: Request, res: Response) => {
  Provider.find({
    isExpenses: true,
    deleted: false,
  })
    .sort({
      name: 1,
    })
    .exec(async (err: any, providers: IProvider[]) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: "Error listando proveedores",
          errors: err,
        });
      }

      res.status(200).json({
        ok: true,
        providers,
      });
    });
});
/* #endregion */

/* #region  PUT */
PROVIDER_ROUTER.put("/balance", mdAuth, async (req: Request, res: Response) => {
  const body = req.body;

  await UPDATE_BALANCE(body._provider, body.amount, body.action);

  return res.status(200).json({
    ok: true,
  });
});

PROVIDER_ROUTER.put("/:id", mdAuth, (req: Request, res: Response) => {
  const id = req.params.id;
  const body = req.body;

  Provider.findById(id, (err, provider) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: "Error al buscar proveedor",
        errors: err,
      });
    }

    if (!provider) {
      return res.status(400).json({
        ok: false,
        mensaje: "El proveedor con el id" + id + " no existe",
        errors: {
          message: "No existe un proveedor con ese ID",
        },
      });
    }

    provider.name = body.name;
    provider.checkName = body.checkName;
    provider.address = body.address;
    provider.nit = body.nit;
    provider.phone = body.phone;
    provider.email = body.email;
    provider.creditDays = body.creditDays;
    provider.credit = body.credit;
    provider.iva = body.iva;
    provider.isr = body.isr;
    provider.isExpenses = body.isExpenses;

    provider.save((err, provider) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          mensaje: "Error al actualizar proveedor",
          errors: err,
        });
      }

      res.status(200).json({
        ok: true,
        provider,
      });
    });
  });
});
/* #endregion */

PROVIDER_ROUTER.delete("/:id", mdAuth, (req: Request, res: Response) => {
  const id = req.params.id;

  Provider.findById(id, (err, provider) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: "Error al buscar proveedor",
        errors: err,
      });
    }

    if (!provider) {
      return res.status(400).json({
        ok: false,
        mensaje: "El proveedor con el id" + id + " no existe",
        errors: {
          message: "No existe un proveedor con ese ID",
        },
      });
    }

    provider.deleted = true;

    provider.save((err, provider) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          mensaje: "Error al borrar proveedor",
          errors: err,
        });
      }

      res.status(200).json({
        ok: true,
        provider,
      });
    });
  });
});

/* #region  POST */
PROVIDER_ROUTER.post("/", mdAuth, (req: Request, res: Response) => {
  const body: IProvider = req.body;

  Provider.findOne(
    {
      code: { $ne: null! },
      deleted: false,
    },
    "code",
    {
      sort: {
        code: -1,
      },
    },
    function (err, provider) {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: "Error al buscar correlativo",
          errors: err,
        });
      }

      // Definiciones para la factura
      let correlative = 0;
      if (provider) {
        correlative = Number(provider.code) + 1;
      }

      const newProvider = new Provider({
        code: correlative,
        name: body.name,
        checkName: body.checkName,
        address: body.address,
        nit: body.nit,
        phone: body.phone,
        email: body.email,
        creditDays: body.creditDays,
        credit: body.credit,
        iva: body.iva,
        isr: body.isr,
        isExpenses: body.isExpenses,
      });

      newProvider
        .save()
        .then((provider) => {
          res.status(200).json({
            ok: true,
            provider,
          });
        })
        .catch((err) => {
          res.status(400).json({
            ok: false,
            mensaje: "Error al crear proveedor",
            errors: err,
          });
        });
    }
  );
});

PROVIDER_ROUTER.post("/xlsx", mdAuth, (req: Request, res: Response) => {
  // Sino envia ningún archivo
  if (!req.files) {
    return res.status(400).json({
      ok: false,
      mensaje: "No Selecciono nada",
      errors: { message: "Debe de seleccionar un archivo" },
    });
  }

  // Obtener nombre y la extensión del archivo
  const FILE: any = req.files.archivo;
  const NAME_FILE = FILE.name.split(".");
  const EXT_FILE = NAME_FILE[NAME_FILE.length - 1];

  // Nombre del archivo personalizado
  const NEW_NAME_FILE = `${new Date().getMilliseconds()}.${EXT_FILE}`;

  // Mover el archivo de la memoria temporal a un path
  const PATH = `./uploads/temp/${NEW_NAME_FILE}`;

  FILE.mv(PATH, async (err: any) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: "Error al mover archivo",
        errors: err,
      });
    }

    const DOC = xlsx.parse(PATH);

    await bluebird.mapSeries(DOC[0].data, async (doc: any, index) => {
      try {
        const PROVIDER = new Provider({
          code: doc[0],
          name: doc[1],
          nit: doc[2],
          address: doc[3],
          phone: doc[4],
          email: doc[5],
        });

        let product = await PROVIDER.save().then();
      } catch (e: any) {
        throw new Error(e.message);
      }
    });

    return res.status(201).json({
      ok: true,
      m: "PROVEEDORES INGRESADOS",
    });
  });
});
/* #endregion */

export default PROVIDER_ROUTER;
