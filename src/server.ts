import bodyParser from "body-parser";
import morgan from 'morgan';
import {ApiRouter} from './routes/api.router';
import Logger from './utils/logger';
import express, {Request,Response,Application} from 'express';
import path from 'path';

const app = express();
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(morgan('dev'));


app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
  });
app.options('*', async (req: Request, res: Response) => {
    res.header('Access-Control-Max-Age', '7200');
    res.header("Access-Control-Allow-Methods", "GET,PUT,PATCH,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "*");
    return res.status(200).end();
});

app.use('/api', ApiRouter);

app.use('/assets', express.static(__dirname + '/static/assets'));

app.get('/', (req:Request, res:Response) => {
    res.sendFile(path.join(__dirname, 'static/home.html'));
});

app.get('/ping', (req:Request, res:Response) => {
    res.send('pong');
});

app.use((req, res, next) => {
    const error = new Error("Resource not found !!");
    (error as any).status = req.statusCode || 404;
    next(error);
});

app.use((error: any, req : any, res: any, next: any) => {
    Logger.error(error.message, error);
    res.status(error.status || 500);
    res.json({
        error: {
            status: false,
            message: error.message
        }
    });
});

export default app;