import { Response } from 'express';
import {STATUS} from '../utils/http.status'
export class Result
{
    public static async OK(res: Response, data: any = {}, message: string = 'OK')
    {
        return res.status(STATUS.OK).json({
            data: data,
            message: message
        })
    }
    public static async IMATP(res: Response, data: any = {}, message: string = "I'M A TEAPOT")
    {
        return res.status(STATUS.IM_A_TEAPOT).json({
            data: data,
            message: message
        })
    }
    public static async CREATED(res: Response, data: any = {}, message: string = 'CREATED')
    {
        return res.status(STATUS.CREATED).json({
            data: data,
            message: message
        })
    }
    public static async ACCEPTED(res: Response, data: any = {}, message: string = 'ACCEPTED')
    {
        return res.status(STATUS.ACCEPTED).json({
            data: data,
            message: message
        })
    }
    public static async BAD_REQUEST(res: Response, data: any = {}, message: string = 'BAD REQUEST')
    {
        return res.status(STATUS.BAD_REQUEST).json({
            data: data,
            message: message
        })
    }
    public static async UNAUTHORIZED(res: Response, data: any = {}, message: string = 'UNAUTHORIZED')
    {
        return res.status(STATUS.UNAUTHORIZED).json({
            data: data,
            message: message
        })
    }
    public static async FORBIDDEN(res: Response, data: any = {}, message: string = 'FORBIDDEN')
    {
        return res.status(STATUS.FORBIDDEN).json({
            data: data,
            message: message
        })
    }
    public static async NOT_FOUND(res: Response, data: any = {}, message: string = 'NOT FOUND')
    {
        return res.status(STATUS.NOT_FOUND).json({
            data: data,
            message: message
        })
    }
    public static async NOT_ACCEPTABLE(res: Response, data: any = {}, message: string = 'NOT ACCEPTABLE')
    {
        return res.status(STATUS.NOT_ACCEPTABLE).json({
            data: data,
            message: message
        })
    }
    public static async CONFLICT(res: Response, data: any = {}, message: string = 'CONFLICT')
    {
        return res.status(STATUS.CONFLICT).json({
            data: data,
            message: message
        })
    }
    public static async PRECONDITION_FAILED(res: Response, data: any = {}, message: string = 'PRECONDITION FAILED')
    {
        return res.status(STATUS.PRECONDITION_FAILED).json({
            data: data,
            message: message
        })
    }
    public static async EXPECTATION_FAILED(res: Response, data: any = {}, message: string = 'EXPECTATION FAILED')
    {
        return res.status(STATUS.EXPECTATION_FAILED).json({
            data: data,
            message: message
        })
    }
    public static async UNPROCESSABLE_ENTITY(res: Response, data: any = {}, message: string = 'UNPROCESSABLE ENTITY')
    {
        return res.status(STATUS.UNPROCESSABLE_ENTITY).json({
            data: data,
            message: message
        })
    }
}