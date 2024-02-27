import { Request, Response, Router } from 'express';
import {Result} from '../utils/result';

const adminMiddleware = async function (req: Request, res: Response, next:any) {
    const user = (req as any).authUser;
    if(user.ur == 1)
    {
        next();
    }
    else
    {
        return Result.FORBIDDEN(res, {}, 'Not enough permissions to access this feature.');
    }
};

export default adminMiddleware;