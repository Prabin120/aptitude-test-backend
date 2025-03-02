import { Response, NextFunction } from 'express';
import ICustomRequest from '../utils/customRequest';
import logger from '../utils/logger';

export const initialLogging = async (req: ICustomRequest, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request', {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            responseTime: `${duration}ms`,
            ip: req.ip
        });
    });
    next();
};

export const errorLogging = async (err: Error, req: ICustomRequest, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    logger.error('Server Error', {
        message: err.message,
        stack: err.stack,
        path: req.originalUrl
    });

    res.status(500).json({
        error: 'Internal Server Error'
    });
};