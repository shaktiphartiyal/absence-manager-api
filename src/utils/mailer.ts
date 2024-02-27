import nodemailer from 'nodemailer';
import { Config } from "../config/config";
export class Mailer
{
    private transporter: any;
    constructor()
    {
        this.transporter = nodemailer.createTransport({
            host: Config.emaiHost,
            port: Config.emailPort,
            secure: Config.emailSecure,
            auth: {
              user: Config.emailUser,
              pass: Config.emailPassword,
            },
            tls: { 
              rejectUnauthorized: false 
            }
          });
    }

    public async send(options: {receivers: string, subject: string, html?: string, text?: string}): Promise<any>
    {
        return this.transporter.sendMail({
            from: Config.emailUser,
            to: options.receivers,
            subject: options.subject,
            text: !!options.text ? options.text : undefined,
            html: !!options.html ? options.html : undefined,
          });
    }
}