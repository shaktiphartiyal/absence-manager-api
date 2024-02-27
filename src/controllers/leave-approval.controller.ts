import { Request, Response, Router } from 'express';
import {STATUS} from '../utils/http.status';
import { AppDataSource } from '../data-source';
import { Result } from '../utils/result';
import { Helpers } from '../utils/helpers';
import { DBHelpers } from '../utils/db-helpers';
import { Brackets } from 'typeorm';
export const leaveApprovalController = Router();

/**
 * @TODO add validation that the user cannot approve/reject his/her own leaves
 */

leaveApprovalController.get('/', async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const page = req.query.page ? Number(req.query.page) : 1;
    const rows = req.query.rows ? Number(req.query.rows) : 10;
    let countResult = await AppDataSource.query(`
    SELECT
    COUNT(l.id) as count
    FROM leaves as l
    WHERE l.status = ? AND l.user_id != ?
    `, [0, user.id]);
    let leaveRequests = await AppDataSource.query(`
    SELECT
    u.id as user_id, u.signum, u.name, l.id as leave_id, l.leave_date, l.reason, l.created_at as applied_on, t.name as team_name
    from leaves as l
    join users as u ON u.id = l.user_id
    left join team_users as tu on u.id = tu.user_id
    left join teams as t on t.id = tu.team_id
    WHERE l.status = ? AND l.user_id != ? AND u.manager = ?
    ORDER BY l.id DESC LIMIT ${rows} OFFSET ${rows*(page-1)}
    `, [0, user.id, user.id]);
    return Result.OK(res, {data: leaveRequests, total: countResult[0].count});
});

// @TODO: ADD CHECK IF THE USER IS APPROVING IS THE MANAGER OF THE LEAVE APPLICANT
leaveApprovalController.post('/approve', async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const leavesToApprove = req.body.leaves;
    const approverReason = req.body.approverReason ? req.body.approverReason.trim() : null;
    const update = await AppDataSource
    .createQueryBuilder()
    .update('leaves')
    .set({
            status: 1,
            approver_reason: approverReason,
            updated_by: user.id
    })
    .where("id IN(:ids)", { ids: leavesToApprove })
    .execute();
    if(!!update.affected)
    {
        return Result.ACCEPTED(res, {}, 'Approval successful.');
    }
    else
    {
        return Result.BAD_REQUEST(res, {}, 'Approval failed');
    }
});

// @TODO: ADD CHECK IF THE USER IS REJECTING IS THE MANAGER OF THE LEAVE APPLICANT
leaveApprovalController.post('/reject', async (req: Request, res: Response) => {
    const user = (req as any).authUser;
    const leavesToReject = req.body.leaves;
    const approverReason = req.body.approverReason ? req.body.approverReason.trim() : null;
    const update = await AppDataSource
    .createQueryBuilder()
    .update('leaves')
    .set({
            status: 2,
            approver_reason: approverReason,
            updated_by: user.id
    })
    .where("id IN(:ids)", { ids: leavesToReject })
    .execute();
    if(!!update.affected)
    {
        return Result.ACCEPTED(res, {}, 'Rejection successful.');
    }
    else
    {
        return Result.BAD_REQUEST(res, {}, 'Rejection failed');
    }
});