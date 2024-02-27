import { Request, Response, Router } from 'express';
import {Result} from '../utils/result';
import { AppDataSource } from '../data-source';
import { Helpers } from '../utils/helpers';
import jwt from 'jsonwebtoken';
import { Config } from '../config/config';

const authMiddleware = async function (req: Request, res: Response, next:any) {
    const header = req.header("Authorization");
    if (!header)
    {
        return Result.UNAUTHORIZED(res);
    }
    const regex = /^Bearer (.*)$/;
    const match = header.match(regex);
    const token = match ? match[1] : null;
    if(!token)
    {
        return Result.UNAUTHORIZED(res);
    }
    try
    {
        const verified:any = jwt.verify(token, Config.jwtKey);
        if(!verified)
        {
            return Result.UNAUTHORIZED(res);
        }
        (req as any).authUser = {id: verified.uid, ur: verified.ur};
        next();
    } catch (err) {
        return Result.UNAUTHORIZED(res);
    }
};

export default authMiddleware;