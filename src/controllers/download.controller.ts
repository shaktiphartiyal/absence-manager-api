import { Request, Response, Router } from 'express';
import {Result} from '../utils/result';
import { Config } from '../config/config';


export const downloadController = Router();

downloadController.get('/leave-report/:report', async (req: Request, res: Response) => {
    const csvFile = req.params.report;
    if(!csvFile)
    {
        return Result.BAD_REQUEST(res, {}, 'Invalid URL');
    }
    const csvFilePath = `${Config.csvPath}/${csvFile}`;
});