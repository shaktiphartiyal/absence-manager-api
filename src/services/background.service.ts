import { Config } from "../config/config";
import { AppDataSource } from '../data-source';
import { Worker, isMainThread, workerData } from 'worker_threads';
import Logger from '../utils/logger';
import nodemailer from 'nodemailer';

export class BackgroundService
{
  public static _worker: Worker; 
  public static async SendNotification(channel: 'EMAIL', parameters: {receiver: string, subject: string, text?: string, html?: string})
  {
    if(!isMainThread)
    {
      return;
    }
    const enqueResult = await AppDataSource
    .createQueryBuilder()
    .insert()
    .into('notifications')
    .values([
        {
            channel: channel,
            receiver: parameters.receiver,
            subject: parameters.subject,
            text: parameters.text,
            html: parameters.html
        }
    ])
    .execute();
    if(enqueResult)
    {
      Logger.debug("Mail notification queued.")
    }
    return !!enqueResult;
  }


  private emailSenderThreadActive = false;
  constructor()
  {
    if(isMainThread)
    {
      throw 'CANNOT RUN FROM MAIN THREAD!';
    }
    AppDataSource.initialize();
    setInterval(() => {
      if(!this.emailSenderThreadActive)
      {
        this.sendMail();
      }
    }, 3000);
  }

  private async sendMail(): Promise<any>
  {
    this.emailSenderThreadActive = true;
    const emailsToSend = await AppDataSource
                        .createQueryBuilder()
                        .select()
                        .from('notifications', '')
                        .where("channel = :channel", { channel: 'EMAIL' })
                        .andWhere("status = :status", { status: 0 })
                        .getRawMany();
    const transporter = nodemailer.createTransport({
      host: Config.email.emaiHost,
      port: Config.email.emailPort,
      secure: Config.email.emailSecure,
      auth: {
        user: Config.email.emailUser,
        pass: Config.email.emailPassword,
      },
      tls: { 
        rejectUnauthorized: false 
      }
    });
    for(const emailToSend of emailsToSend)
    {
      let result:any = '';
      await AppDataSource
            .createQueryBuilder()
            .update('notifications')
            .set({
                status: 1
            })
            .where("id = :id", { id: emailToSend.id })
            .execute();
      if(Config.email.mockSending)
      {
        result = 'MOCK SENT OK';
        await AppDataSource
              .createQueryBuilder()
              .update('notifications')
              .set({
              status: 2,
              result: result 
              })
              .where("id = :id", { id: emailToSend.id })
              .execute();        
      }
      else
      {
        result = await transporter.sendMail({
          from: Config.email.emailUser,
          to: emailToSend.receiver,
          subject: emailToSend.subject,
          text: !!emailToSend.text ? emailToSend.text : undefined,
          html: !!emailToSend.html ? emailToSend.html : undefined,
        });
        if(!!result.messageId && result.accepted.length > 0)
        {
          result = 'SUCCESS';
          await AppDataSource
              .createQueryBuilder()
              .update('notifications')
              .set({
              status: 2,
              result: result 
              })
              .where("id = :id", { id: emailToSend.id })
              .execute();
        }
        else
        {
          console.error(result);
          result = 'FAILURE';
          await AppDataSource
              .createQueryBuilder()
              .update('notifications')
              .set({
              status: 3,
              result: result 
              })
              .where("id = :id", { id: emailToSend.id })
              .execute();          
        }
      }
    }
    this.emailSenderThreadActive = false;
  }
}


if(!isMainThread)
{
  if(workerData?.signal === 'INIT')
  {
    new BackgroundService();
  }
}



export async function startBackgroundService() :Promise<void>
{
  if(isMainThread)
  {
    BackgroundService._worker = new Worker(__filename, {workerData: {signal: 'INIT'}});
  }
}