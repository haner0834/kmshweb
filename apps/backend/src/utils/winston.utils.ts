import winston from 'winston'

export const winstonLogger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length > 0
                        ? ` ${JSON.stringify(meta, null, 2)}`
                        : '';
                    return `[${timestamp}] [${level}] ${message}${metaStr}`;
                }),
            ),
        }),

        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
        }),

        new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
        }),
    ]
})
