import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export type TypedRequestHandler<P extends ParamsDictionary = ParamsDictionary> = (
    req: Request<P>,
    res: Response,
    next: NextFunction
) => Promise<void> | void;