import * as bcrypt from 'bcrypt';
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
}