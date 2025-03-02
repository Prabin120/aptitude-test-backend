import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, json } = format;

// Define a consistent format for all transports
const logFormat = combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
);

// Custom format for console only
const consoleFormat = combine(
    format.colorize(),
    printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level}]: ${message}`;
    })
);

const logger = createLogger({
    exitOnError: false,
    level: 'info',
    transports: [
        // Daily rotated files (replaces regular File transport)
        new DailyRotateFile({
            filename: 'logs/app-%DATE%.log', // Added logs directory
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true, // Optional: compress old logs
            maxSize: '5m',
            maxFiles: '7d',
            format: logFormat, // Use the shared format
        }),
        new transports.Console({
            format: consoleFormat // Special format for console
        })
    ],
    exceptionHandlers: [
        // Rotate exception logs too
        new DailyRotateFile({
            filename: 'logs/exceptions-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '5m',
            maxFiles: '7d',
            format: logFormat
        })
    ]
});

process.on('unhandledRejection', (error: Error) => {
    logger.error(`Unhandled Rejection: ${error.message}`, {
        stack: error.stack
    });
});

export default logger;