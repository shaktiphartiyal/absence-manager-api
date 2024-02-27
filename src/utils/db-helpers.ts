import { Request } from 'express';
import { DataSource } from 'typeorm';
export class DBHelpers
{
  public static async paginate(req: Request, dataSource: DataSource, table: string, whereQuery: string|undefined=undefined, whereValue: any|undefined=undefined): Promise<{records: any, total: number}>
  {
    const page = req.query.page ? Number(req.query.page) : 1;
    const rows = req.query.rows ? Number(req.query.rows) : 10;
    let total: any = 0;
    let records: Array<any> = [];

    if(whereQuery && whereValue)
    {
      total = await dataSource
      .createQueryBuilder()
      .select("COUNT(*)", "count")
      .from(table, '')
      .where(whereQuery, whereValue)
      .getRawOne();
      records = await dataSource
      .createQueryBuilder()
      .select()
      .from(table, '')
      .where(whereQuery, whereValue)
      .take(rows)
      .skip(rows*(page-1))
      .orderBy("id", 'DESC')
      .getRawMany();
    }
    else
    {
      total = await dataSource
      .createQueryBuilder()
      .select("COUNT(*)", "count")
      .from(table, '')
      .getRawOne();
  
      records = await dataSource
      .createQueryBuilder()
      .select()
      .from(table, '')
      .take(rows)
      .skip(rows*(page-1))
      .orderBy("id", 'DESC')
      .getRawMany();
    }
    return {records: records, total: total.count};

  }

}