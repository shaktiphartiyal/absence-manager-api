import { Request, Response, Router } from 'express';
import {STATUS} from '../utils/http.status';
import { AppDataSource } from '../data-source';
import { Result } from '../utils/result';
import { Helpers } from '../utils/helpers';
import { DBHelpers } from '../utils/db-helpers';
import { Brackets } from 'typeorm';
import adminMiddleware from '../middlewares/admin.middleware';
export const userController = Router();



export async function checkIfActiveUserExists(username: string, signum: string, except?: number) :Promise<boolean>
{
    const existingActiveUser = await AppDataSource
    .createQueryBuilder()
    .select()
    .from('users', '')
    .where("users.active = 1")
    .andWhere(new Brackets(qb => {
        qb.where("users.username = :username", { username: username })
        .orWhere("users.signum = :signum", { signum: signum })
      }))
    .getRawOne();
    if(existingActiveUser)
    {
        if(existingActiveUser.id == except)
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

export async function addUserToTeam(userId: number, teamId: number): Promise<boolean>
{
    if(teamId !== 0)
    {
        const teamExists = await AppDataSource
                            .createQueryBuilder()
                            .select("name")
                            .from('teams', '')
                            .where('id=:id', {id: teamId})
                            .getRawOne();
        if(!teamExists)
        {
        return false;
        }
    }
    const removeExistingRecord = await AppDataSource
                                .createQueryBuilder()
                                .delete()
                                .from('team_users', '')
                                .where("user_id = :userId", { userId: userId })
                                .execute();
    if(teamId === 0)
    {
        return true;
    }
    const newTeamUser = await AppDataSource
                        .createQueryBuilder()
                        .insert()
                        .into('team_users')
                        .values([
                            {
                                user_id: userId,
                                team_id: teamId,
                            }
                        ])
                        .execute();
    if(!newTeamUser)
    {
        return false;
    }
    return true;
}


userController.get('/', adminMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const page = req.query.page ? Number(req.query.page) : 1;
    const rows = req.query.rows ? Number(req.query.rows) : 10;
    let total: any = 0;
    let records: Array<any> = [];
    total = await AppDataSource
            .createQueryBuilder()
            .select("COUNT(*)", "count")
            .from('users', '')
            .getRawOne();
    records = await AppDataSource.query(`SELECT u.id, u.name, u.is_admin, um.name as manager_name, um.id as manager_id, u.signum, u.username as email, tu.team_id, u.active, t.name as team_name FROM users as u
                                        LEFT JOIN team_users as tu
                                        ON tu.user_id = u.id
                                        LEFT JOIN users as um ON u.manager = um.id
                                        LEFT JOIN teams t ON t.id = tu.team_id
                                        ORDER BY u.name ASC LIMIT ${rows} OFFSET ${rows*(page-1)}`);
    return Result.OK(res, {data: records, total: total.count});
});

userController.post('/', adminMiddleware, async (req: Request, res: Response) => {
    const name = req.body.name.trim();
    const username = req.body.email.trim();
    const signum = req.body.signum.trim();
    const active = Number(req.body.active);
    const teamId = req.body.team_id ? Number(req.body.team_id) : 0;
    const isAdmin = req.body.is_admin ? Number(req.body.is_admin) : 0;
    const managerId = req.body.manager_id ? Number(req.body.manager_id) : null;
    if(!name || !signum || !username || isNaN(teamId) || !managerId)
    {
        return Result.BAD_REQUEST(res);
    }
    const user = (req as any).authUser;
    const userExists = await checkIfActiveUserExists(username, signum);
    if(userExists)
    {
        return Result.CONFLICT(res, {}, 'An active user with this email/username/signum exists!');
    }

    if(managerId)
    {
        const managerDetails = await AppDataSource
        .createQueryBuilder()
        .select()
        .from('users', '')
        .where("users.id = :id", { id: managerId })
        .andWhere('users.is_admin = 1')
        .andWhere('users.active = 1')
        .getRawOne();
        if(!managerDetails)
        {
            return Result.BAD_REQUEST(res, {}, 'Invalid manager selected !');
        }
    }

    const newUser = await AppDataSource
    .createQueryBuilder()
    .insert()
    .into('users')
    .values([
        {
            name: name,
            username: username,
            signum: signum,
            password: await Helpers.hash('password'),
            active: active,
            is_admin: isAdmin,
            manager: managerId
        }
    ])
    .execute();
    if(!newUser)
    {
        return Result.EXPECTATION_FAILED(res);
    }
    const createdUserId = newUser.raw.insertId;
    const addedToTeam = await addUserToTeam(createdUserId, teamId);
    if(addedToTeam)
    {
        return Result.CREATED(res, {id: newUser.raw.insertId});
    }
    else
    {
        return Result.CREATED(res, {id: newUser.raw.insertId}, 'User created but not added to team');
    }
});


userController.patch('/:userId', adminMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const userId = Number(req.params.userId);
    const name = req.body.name.trim();
    const username = req.body.email.trim();
    const signum = req.body.signum.trim();
    const active = Number(req.body.active);
    const teamId = req.body.team_id ? Number(req.body.team_id) : 0;
    const isAdmin = req.body.is_admin ? Number(req.body.is_admin) : 0;
    const managerId = req.body.manager_id ? Number(req.body.manager_id) : null;
    if(!name || !signum || !username || !userId || isNaN(teamId) || !managerId)
    {
        return Result.BAD_REQUEST(res);
    }
    const userDetails = await AppDataSource
    .createQueryBuilder()
    .select()
    .from('users', '')
    .where("users.id = :id", { id: userId })
    .getRawOne();
    if(!userDetails)
    {
        return Result.NOT_FOUND(res);
    }

    if(managerId)
    {
        const managerDetails = await AppDataSource
        .createQueryBuilder()
        .select()
        .from('users', '')
        .where("users.id = :id", { id: managerId })
        .andWhere('users.is_admin = 1')
        .andWhere('users.active = 1')
        .getRawOne();
        if(!managerDetails)
        {
            return Result.BAD_REQUEST(res, {}, 'Invalid manager selected !');
        }
    }

    if(active === 1)
    {
        const userExists = await checkIfActiveUserExists(username, signum, userId);
        if(userExists)
        {
            return Result.CONFLICT(res, {}, 'An active user with this email/username/signum exists!');
        }
    }
    const update = await AppDataSource
    .createQueryBuilder()
    .update('users')
    .set({
        name: name,
        username: username,
        signum: signum,
        active: active,
        is_admin: isAdmin,
        manager: managerId
    })
    .where("users.id = :id", { id: userId })
    .execute();
    if(!!update.affected)
    {
        const addedToTeam = await addUserToTeam(userId, teamId);
        if(addedToTeam)
        {
            return Result.ACCEPTED(res, {}, 'User updated.');
        }
        else
        {
            return Result.ACCEPTED(res, {}, 'User updated, team not updated');
        }
    }
    else
    {
        return Result.BAD_REQUEST(res, {}, 'User not updated.');
    }
});

userController.delete('/:userId', adminMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const userId = Number(req.params.userId);
    const removeUser = await AppDataSource
                                .createQueryBuilder()
                                .delete()
                                .from('users', '')
                                .where("id = :userId", { userId: userId })
                                .execute();
    if(removeUser.affected)
    {
        return Result.OK(res, {}, 'User deleted');
    }
    else
    {
        return Result.UNPROCESSABLE_ENTITY(res, {}, 'Unable to delete user');
    }
});


userController.post('/bulk-add', adminMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const users = req.body.users;
    if(users.length < 0)
    {
        return Result.BAD_REQUEST(res, {}, 'Invalid user data');
    }
    const successfulEntries = [];
    let index = 1;
    for(let user of users)
    {
        const name = user.name.trim();
        const username = user.username.trim();
        const signum = user.signum.trim();
        const password = user.password;
        const status = user.status ? Number(user.status) : 1;
        const team_name = user.team_name ? user.team_name : 0;
        const is_admin = user.is_admin ? Number(user.is_admin) : 0;
        const manager_signum = user.manager_signum ? user.manager_signum : null;
        if(!name || !signum || !username || !manager_signum)
        {
            return Result.BAD_REQUEST(res, {}, `Missing or invalid data. Stopping at erroneous record : ${index}`);
        }
        const userExists = await checkIfActiveUserExists(username, signum);
        if(userExists)
        {
            return Result.CONFLICT(res, {}, `An active user with this email/username/signum exists. Stopping at erroneous record : ${index}`);
        }
        const managerDetails = await AppDataSource
        .createQueryBuilder()
        .select('id')
        .from('users', '')
        .where("users.signum = :signum", { signum: manager_signum })
        .andWhere('users.is_admin = 1')
        .andWhere('users.active = 1')
        .getRawOne();
        if(!managerDetails)
        {
            return Result.BAD_REQUEST(res, {}, `Invalid manager selected. Stopping at erroneous record : ${index}`);
        }
        const newUser = await AppDataSource
        .createQueryBuilder()
        .insert()
        .into('users')
        .values([
            {
                name: name,
                username: username,
                signum: signum,
                password: await Helpers.hash(password),
                active: status,
                is_admin: is_admin,
                manager: managerDetails.id
            }
        ])
        .execute();
        if(!newUser)
        {
            return Result.EXPECTATION_FAILED(res, {}, `Unable to add user. Stopping at erroneous record : ${index}`);
        }
        const teamDetails = await AppDataSource
        .createQueryBuilder()
        .select('id')
        .from('teams', '')
        .where("teams.name = :name", { name: team_name })
        .andWhere('teams.status = 1')
        .getRawOne();
        if(!teamDetails)
        {
            return Result.BAD_REQUEST(res, {}, `User successfully added but unable to add to team (Invalid team provided). Stopping at erroneous record : ${index}`);
        }
        const createdUserId = newUser.raw.insertId;
        const addedToTeam = await addUserToTeam(createdUserId, teamDetails.id);
        if(addedToTeam)
        {
            successfulEntries.push({
                id: newUser.raw.insertId,
                username: username,
                signum: signum
            });
        }
        else
        {
            return Result.CREATED(res, {id: newUser.raw.insertId}, `User created but not added to team. Stopping at erroneous record : ${index}`);
        }
        index++;
    }
    return Result.CREATED(res, {successfulEntries: successfulEntries}, 'Users created successfully');
});

// -------------- CUSTOM ROUTES

userController.get('/info', async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const userInfo = await AppDataSource
    .createQueryBuilder()
    .select(['username', 'name', 'signum'])
    .from('users', '')
    .where("id = :id", { id: user.id })
    .getRawOne();
    return Result.OK(res, {...userInfo});
});
userController.get('/get-managers', async (req: Request, res: Response) => {
    const managers = await AppDataSource
    .createQueryBuilder()
    .select(['id as value', 'name'])
    .from('users', '')
    .where('is_admin = 1')
    .andWhere("active = 1")
    .getRawMany();
    return Result.OK(res, {managers: managers});
});
userController.patch('/profile/change-password', async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;
    if(newPassword !== confirmPassword)
    {
        return Result.BAD_REQUEST(res, {}, 'New password and password confirmation do not match !');
    }
    const userInfo = await AppDataSource
    .createQueryBuilder()
    .select(['password'])
    .from('users', '')
    .where("id = :id", { id: user.id })
    .getRawOne();
    if(!userInfo)
    {
        return Result.UNAUTHORIZED(res);
    }
    const passwordMatch = await Helpers.matchHash(currentPassword, userInfo.password);
    if(!passwordMatch)
    {
        return Result.BAD_REQUEST(res, {}, 'Incorrect current password!');
    }
    const update = await AppDataSource
    .createQueryBuilder()
    .update('users')
    .set({
        password: await Helpers.hash(newPassword)
    })
    .where("users.id = :id", { id: user.id })
    .execute();
    if(!!update.affected)
    {
        return Result.OK(res, {}, 'Password changed successfully.');
    }
    else
    {
        return Result.EXPECTATION_FAILED(res, {}, 'Unable to update password!');
    }
});