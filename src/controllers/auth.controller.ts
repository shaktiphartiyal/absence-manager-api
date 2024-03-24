import { Request, Response, Router } from 'express';
import {Result} from '../utils/result';
import { AppDataSource } from '../data-source';
import { Helpers } from '../utils/helpers';
import jwt from 'jsonwebtoken';
import { Config } from '../config/config';
import * as fs from 'fs';
import { BackgroundService } from '../services/background.service';


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

authController.post('/forgot-password', async (req: Request, res: Response) => {
    const email = req.body.email;
    if(!email)
    {
        return Result.BAD_REQUEST(res);
    }
    const user = await AppDataSource
                .createQueryBuilder()
                .select(['id', 'name', 'forgot_link_sent_at', 'username'])
                .from('users', '')
                .where("users.username = :username", { username: email })
                .getRawOne();
    if(user)
    {
        const currentTime = new Date();
        if(!!user.forgot_link_sent_at)
        {
            const differenceInSeconds = (currentTime.getTime() - user.forgot_link_sent_at.getTime()) / 1000;
            if(differenceInSeconds <= Config.passwordReset.timeInSecondsBetweenPasswordResets)
            {
                return Result.CONFLICT(res, {}, `Please retry password reset after ${Config.passwordReset.timeInSecondsBetweenPasswordResets} seconds`);
            }
        }
        const encHash = {
            t: currentTime,
            i: user.id
        };
        const encryptedHash = await Helpers.Encrypt(JSON.stringify(encHash));
        const resetUrl = `${Config.passwordReset.resetUrl}?rc=${encryptedHash}`;
        try
        {
            let filecontent = fs.readFileSync(`${__dirname}/../static/mail-templates/forgot-password.html`, 'utf8');
            filecontent = filecontent.replace(/{{NAME}}/g, user.name)
                          .replace(/{{PASSWORD_RESET_LINK}}/g, resetUrl);
            BackgroundService.SendNotification('EMAIL', {
                receiver: email,
                subject: 'Request to reset your password',
                html: filecontent
            });
            await AppDataSource
                    .createQueryBuilder()
                    .update('users')
                    .set({
                        forgot_link_sent_at: currentTime
                    })
                    .where("users.id = :id", { id: user.id })
                    .execute();
        } catch (err) {
            return Result.EXPECTATION_FAILED(res, {}, 'Unable to send password reset request.');
            console.error(err);
        }
    }
    return Result.OK(res, {message: 'Password reset link sent.'});
});


authController.post('/verify-reset-password-rc', async (req: Request, res: Response) => {
    const rc = req.body.rc;
    if(!rc)
    {
        return Result.BAD_REQUEST(res);
    }
    const rcToken = await rcTokenValidAndInTime(rc);
    if(rcToken === false)
    {
        return Result.BAD_REQUEST(res);
    }
    return Result.OK(res, {message: 'HASH VALID'});
});

authController.post('/reset-password', async (req: Request, res: Response) => {
    const rc = req.body.rc;
    const newPassword = req.body.newPassword;
    const repeatPassword = req.body.repeatPassword;
    if(!rc || ! newPassword || !repeatPassword || (newPassword !== repeatPassword))
    {
        return Result.BAD_REQUEST(res, {}, 'Invalid link or passwords do not match.');
    }
    const userId = await rcTokenValidAndInTime(rc);
    if(userId === false)
    {
        return Result.BAD_REQUEST(res);
    }
    const update = await AppDataSource
                    .createQueryBuilder()
                    .update('users')
                    .set({
                        password: await Helpers.hash(newPassword)
                    })
                    .where("users.id = :id", { id: userId })
                    .execute();
    if(!!update.affected)
    {
        return Result.OK(res, {}, 'Password changed successfully.');
    }
    else
    {
        return Result.EXPECTATION_FAILED(res, {}, 'Unable to update password!');
    }
    return Result.IMATP(res, {message: ''});
});


async function rcTokenValidAndInTime(token: string)
{
    try
    {
        let decryptedRc:any = await Helpers.Decrypt(token);
        if(!decryptedRc)
        {
            return false;
        }
        decryptedRc = JSON.parse(decryptedRc);
        const currentTime = new Date();
        const differenceInSeconds = (currentTime.getTime() - new Date(decryptedRc.t).getTime()) / 1000;
        // if(differenceInSeconds >= Config.passwordReset.resetTokenValidForSeconds)
        // {
        //     return false;
        // }
        return decryptedRc.i;
    }
    catch(e)
    {
        return false;
    }
} 