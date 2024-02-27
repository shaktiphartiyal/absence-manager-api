import { Request, Response, Router } from 'express';
import { AppDataSource } from '../data-source';
import { Result } from '../utils/result';
import { createObjectCsvWriter } from 'csv-writer';
import { Helpers } from '../utils/helpers';
import { Config } from '../config/config';
import * as fs from 'fs';
import path from 'path';
import Logger from '../utils/logger';
import { Mailer } from '../utils/mailer';

export const leaveController = Router();

leaveController.get('/:year', async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const year = Number(req.params.year);
    let leaves = await AppDataSource.query(`
    SELECT l.* from leaves as l
    join users as u ON u.id = l.user_id
    WHERE u.id = ? AND YEAR(l.leave_date) = ?
    `, [user.id, year]);
    leaves = leaves.map((x:any) => {
        return {
            ...x,
            leave_date: x.leave_date.getTime()
        }
    })
    return Result.OK(res, {leaves: leaves})
});

leaveController.post('/apply', async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const selectedDates:Array<string> = req.body.selectedDates;
    const reason: string = req.body.reason.trim();
    const queryValues = [];
    for(let date of selectedDates)
    {
        queryValues.push({
            user_id: user.id,
            leave_date: new Date(date),
            reason: reason,
            created_by: user.id
        });
    }
    const insertResult = await AppDataSource
                        .createQueryBuilder()
                        .insert()
                        .into('leaves', ['user_id', 'leave_date', 'reason', 'created_by'])
                        .values(queryValues)
                        .execute();
    if(!insertResult)
    {
        return Result.EXPECTATION_FAILED(res, {}, 'Unable to apply for leaves !');
    }

    // try{
    //     const managerDetails = await AppDataSource.query(
    //         `SELECT um.username as manager_email FROM users as u
    //          LEFT JOIN users as um ON u.manager = um.id
    //          WHERE u.id = ?
    //          `, [user.id]);
    //     if(managerDetails.length > 0)
    //     {
    //         const managerEmail = managerDetails[0].manager_email;
    //         const mailer = new Mailer();
    //         const mailResult = await mailer.send({
    //             receivers: managerEmail,
    //             subject: 'TEST',
    //             html: 'Hello <b> world</b> !'
    //         }).catch(e => {
    //             console.error(e);
    //         });
    //         console.log(mailResult);
    //     }
    // }
    // catch(e){}
    return Result.CREATED(res, {}, 'Leaves applied successfully');
});

leaveController.post('/cancel', async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const selectedDates:Array<string> = req.body.selectedDates;
    const reason: string = req.body.reason.trim();
    const queryValues = [];
    for(let date of selectedDates)
    {
        queryValues.push(new Date(date));
    }
    const cancelLeaves = await AppDataSource.query(`DELETE FROM leaves WHERE user_id  = ? AND leave_date IN (?)`, [user.id, queryValues]);
    if(cancelLeaves.affectedRows > 0)
    {
        return Result.EXPECTATION_FAILED(res, {}, 'Unable to cancel leaves !');
    }
    return Result.OK(res, {}, 'Leaves cencelled successfully');
});

leaveController.get('/team-leaves/:selectedYear/:selectedMonth/:selectedTeam?', async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const selectedYear = Number(req.params.selectedYear);
    const selectedMonth = Number(req.params.selectedMonth);
    let selectedTeam = Number(req.params.selectedTeam);
    if(user.ur != 1 || isNaN(selectedTeam))
    {
        let teamId = await AppDataSource
        .createQueryBuilder()
        .select("team_id")
        .from('team_users', '')
        .where('user_id = :uid', {uid: user.id})
        .getRawOne();
        if(!teamId)
        {
            return Result.PRECONDITION_FAILED(res, {}, 'No team allocated !');
        }
        selectedTeam = teamId.team_id;           
    }
    const teamLeaves: Array<any> = [];
    let teamLeavesFromDB = await AppDataSource.query(`
    SELECT
    u.id as user_id, u.name, u.signum, l.leave_date, l.status, l.id as leave_id
    from leaves as l
    join users as u ON u.id = l.user_id
    left join team_users as tu on u.id = tu.user_id
    left join teams as t on t.id = tu.team_id
    WHERE t.id = ? AND l.status != 2 AND YEAR(l.leave_date) = ? AND MONTH(l.leave_date) = ?
    `, [selectedTeam, selectedYear, selectedMonth]);

    if(teamLeavesFromDB && teamLeavesFromDB.length > 0)
    {
        for(let leave of teamLeavesFromDB)
        {
            const leaveInfo: any = {
                date: new Date(leave.leave_date).getDate(),
                status: leave.status === 0 ? 'APPLIED' : 'APPROVED'
            };
            let userLeaveInfo = teamLeaves.find(x => x.user_id === leave.user_id);
            if(userLeaveInfo)
            {
                userLeaveInfo.leaves.push(leaveInfo);
            }
            else
            {
                teamLeaves.push({
                    user_id: leave.user_id,
                    name: leave.name,
                    signum: leave.signum,
                    leaves: [leaveInfo]
                })
            }
        }
        return Result.OK(res, teamLeaves);
    }
    return Result.OK(res, []);
});

leaveController.get('/download/leave-plan/:selectedYear/:selectedMonth', async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const selectedYear = Number(req.params.selectedYear);
    const selectedMonth = Number(req.params.selectedMonth);
    if(user.ur != 1)
    {
        return Result.FORBIDDEN(res, {}, 'You are not authorized to perform this action!');
    }
    const teamLeaves: Array<any> = [];
    let teamLeavesFromDB = await AppDataSource.query(`
    SELECT
    u.id as user_id, u.name, u.signum, l.leave_date, l.status, l.id as leave_id, t.name as team_name
    from leaves as l
    join users as u ON u.id = l.user_id
    left join team_users as tu on u.id = tu.user_id
    left join teams as t on t.id = tu.team_id
    WHERE l.status != 2 AND YEAR(l.leave_date) = ? AND MONTH(l.leave_date) = ?
    ORDER BY t.name ASC, u.name ASC
    `, [selectedYear, selectedMonth]);

    if(teamLeavesFromDB && teamLeavesFromDB.length > 0)
    {
        for(let leave of teamLeavesFromDB)
        {
            teamLeaves.push({
                name: leave.name,
                signum: leave.signum,
                leave_date: Helpers.formatDate(leave.leave_date),
                status: leave.status === 0 ? 'APPLIED' : 'APPROVED',
                team_name: leave.team_name
            })
        }
    }
    else
    {
        return Result.UNPROCESSABLE_ENTITY(res, {}, 'No leaves applied !');
    }
    try
    {
        if (!fs.existsSync(Config.csvPath)) {
            fs.mkdirSync(Config.csvPath);
        }
    }
    catch(e)
    {
        Logger.error(`Unable to create CSV Storage Path at : ${Config.csvPath}`)
    }
    const csvFile = `tl-report-${selectedMonth}-${selectedYear}-${new Date().getTime()}${user.id}.csv`;
    const csvFilePath = `${Config.csvPath}/${csvFile}`;
    const csvWriter = createObjectCsvWriter({
        path: csvFilePath,
        header: [
          { id: 'name', title: 'Name' },
          { id: 'signum', title: 'Signum' },
          { id: 'leave_date', title: 'Leave Date' },
          { id: 'status', title: 'Status' },
          { id: 'team_name', title: 'Team' },
        ]
      });
      
      csvWriter.writeRecords(teamLeaves).then(() => {
        console.log('CSV file written successfully');

        if (fs.existsSync(csvFilePath)) {
            const fileStream = fs.createReadStream(csvFilePath);
            // Set headers for the download
            res.setHeader('Content-disposition', 'attachment; filename=' + path.basename(csvFilePath));
            res.setHeader('Content-type', 'application/octet-stream');
            // Pipe the file stream to the response
            fileStream.pipe(res);
            // Delete the file after it's downloaded
            fileStream.on('end', () => {
              fs.unlinkSync(csvFilePath);
            });
            fileStream.on('error', (err) => {
              console.error('Error streaming file:', err);
              return Result.EXPECTATION_FAILED(res, {}, 'Unable to generate report!');
            });
          } else {
            return Result.EXPECTATION_FAILED(res, {}, 'Unable to generate report file!');
          }
        // return Result.OK(res, {url: csvFile});
        }).catch((error) => {
            console.error('Error writing CSV file:', error)
            return Result.EXPECTATION_FAILED(res, {}, 'Unable to generate report!');
        });
});
