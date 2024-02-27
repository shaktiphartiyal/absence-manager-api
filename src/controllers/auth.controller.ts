import { Request, Response, Router } from 'express';
import {Result} from '../utils/result';
import { AppDataSource } from '../data-source';
import { Helpers } from '../utils/helpers';
import jwt from 'jsonwebtoken';
import { Config } from '../config/config';


export const authController = Router();

authController.post('/login', async (req: Request, res: Response) => {
    const email = req.body.email;
    const password = req.body.password;
    if(!email || !password)
    {
        return Result.BAD_REQUEST(res);
    }
    const user = await AppDataSource
    .createQueryBuilder()
    .select(['id', 'username', 'name', 'password', 'active', 'is_admin'])
    .from('users', '')
    .where("users.username = :username", { username: email })
    .getRawOne();
    if(!user || user.active != 1)
    {
        return Result.UNAUTHORIZED(res, {}, 'Invalid user/password !');
    }
    const passwordMatch = await Helpers.matchHash(password, user.password);
    if(passwordMatch)
    {
        const token = jwt.sign({
            uid: user.id,
            ur: user.is_admin
          }, Config.jwtKey, { expiresIn: Config.jwtExpiry });
        return Result.ACCEPTED(res, {
            token: token,
            name: user.name,
            permissions: [user.is_admin === 1 ? 'ADMIN': '']
        });
    }
    else
    {
        return Result.UNAUTHORIZED(res, {}, 'Invalid user/password !');
    }
});