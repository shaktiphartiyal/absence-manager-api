import { Request, Response, Router } from 'express';
import {STATUS} from '../utils/http.status';
import { AppDataSource } from '../data-source';
import { Result } from '../utils/result';
import { Helpers } from '../utils/helpers';
import { DBHelpers } from '../utils/db-helpers';
import { Brackets } from 'typeorm';
import adminMiddleware from '../middlewares/admin.middleware';
export const teamController = Router();



export async function checkIfActiveTeamExists(name: string, except?: number) :Promise<boolean>
{
    const existingActiveTeam = await AppDataSource
    .createQueryBuilder()
    .select()
    .from('teams', '')
    .where("teams.status = 1")
    .andWhere("teams.name = :name", { name: name })
    .getRawOne();
    if(existingActiveTeam)
    {
        if(existingActiveTeam.id == except)
        {
            return false;
        }
        else
        {
            return true;
        }
    }
    return false;
}

export async function membersExistInTeam(teamId:number): Promise<boolean> {
    const usersExistInTeam = await AppDataSource
                                .createQueryBuilder()
                                .select("COUNT(id)", 'count')
                                .from('team_users', '')
                                .where('team_id=:teamId', {teamId: teamId})
                                .getRawOne();
    return usersExistInTeam.count > 0;
}


teamController.get('/', adminMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    let {records, total} = await DBHelpers.paginate(req, AppDataSource, 'teams');
    const teamsUsers = await AppDataSource
                        .createQueryBuilder()
                        .select(['COUNT(user_id) as members', 'team_id'])
                        .from('team_users', '')
                        .groupBy('team_id')
                        .getRawMany();
    if(teamsUsers)
    {
        records = records.map((x:any) => {
            const memberRecord = teamsUsers.find(y => y.team_id === x.id);
            if(memberRecord)
            {
                return {
                    ...x,
                    members_count: memberRecord.members
                }
            }
            else
            {
                return x;
            }
        });
    }
    return Result.OK(res, {data: records, total: total});
});

teamController.post('/', adminMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const name = req.body.name.trim();
    const active = req.body.active;
    if(!name)
    {
        return Result.BAD_REQUEST(res);
    }
    const userExists = await checkIfActiveTeamExists(name);
    if(userExists)
    {
        return Result.CONFLICT(res, {}, 'An active team with the same name exists!');
    }
    const newTeam = await AppDataSource
    .createQueryBuilder()
    .insert()
    .into('teams')
    .values([
        {
            name: name,
            status: active
        }
    ])
    .execute();
    if(!newTeam)
    {
        return Result.EXPECTATION_FAILED(res);
    }
    return Result.CREATED(res, {id: newTeam.raw.insertId});
});

teamController.patch('/:teamId', adminMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const teamId = Number(req.params.teamId);
    const name = req.body.name.trim();
    const status = req.body.status;
    if(!name || !teamId)
    {
        return Result.BAD_REQUEST(res);
    }
    const teamExists = await checkIfActiveTeamExists(name, teamId);
    if(teamExists)
    {
        return Result.CONFLICT(res, {}, 'An active team with the same name exists!');
    }
    const update = await AppDataSource
    .createQueryBuilder()
    .update('teams')
    .set({
            name: name,
            status: status
    })
    .where("teams.id = :id", { id: teamId })
    .execute();
    if(!!update.affected)
    {
        return Result.ACCEPTED(res, {}, 'Team updated.');
    }
    else
    {
        return Result.BAD_REQUEST(res, {}, 'Team not updated.');
    }
});

teamController.delete('/:teamId', adminMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const teamId = Number(req.params.teamId);
    const membersInTeam = await membersExistInTeam(teamId);
    if(isNaN(teamId))
    {
        return Result.NOT_FOUND(res, {})
    }
    if(membersInTeam)
    {
        return Result.PRECONDITION_FAILED(res, {}, 'This team has assigned members!');
    }
    const removeTeam = await AppDataSource
                                .createQueryBuilder()
                                .delete()
                                .from('teams', '')
                                .where("id = :teamId", { teamId: teamId })
                                .execute();
    if(removeTeam.affected)
    {
        return Result.OK(res, {}, 'Team deleted');
    }
    else
    {
        return Result.UNPROCESSABLE_ENTITY(res, {}, 'Unable to delete Team');
    }
});
//------------------CUSTOM CALLS-----------------
teamController.get('/get-all-teams', async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    let teams = [];
    teams = await AppDataSource
        .createQueryBuilder()
        .select(['id as value', 'name'])
        .from('teams', '')
        .orderBy('name', 'ASC')
        .where('status = 1')
        .getRawMany();
    return Result.OK(res, teams);
});