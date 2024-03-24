import * as bcrypt from 'bcrypt';
import crypto from 'crypto'
import { Config } from '../config/config';

class Crypt
{
  public static get key()
  {
    return crypto
    .createHash('sha512')
    .update(Config.encryption.secret_key)
    .digest('hex')
    .substring(0, 32);
  }

  public static get encryptionIV()
  {
    return crypto
    .createHash('sha512')
    .update(Config.encryption.secret_iv)
    .digest('hex')
    .substring(0, 16);
  }
}
export class Helpers
{
  public static async hash(password: string): Promise<string>
  {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  public static async matchHash(password: string, hash: string)
  {
    return await bcrypt.compare(password, hash);
  }
  
  public static isEmail(email:string)
  {
    return email.match(/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i);
  }

  public static formatDate(date: Date)
  {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  public static async Encrypt(stringData: string)
  {
    const cipher = crypto.createCipheriv(Config.encryption.encryption_method, Crypt.key, Crypt.encryptionIV)
    return Buffer.from(cipher.update(stringData, 'utf8', 'hex') + cipher.final('hex')).toString('base64');
  }

  public static async Decrypt(cypherText: string)
  {
    try
    {
      const buff = Buffer.from(cypherText, 'base64')
      const decipher = crypto.createDecipheriv(Config.encryption.encryption_method, Crypt.key, Crypt.encryptionIV)
      return (
        decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
        decipher.final('utf8')
      );
    }
    catch(e)
    {
      return null;
    }
  }
}