import { getTraceId } from "./traceid.utils";
import { winstonLogger } from "./winston.utils";

interface LogParams {
    traceId: string;
    service: string;
    action: string;
    error: Error;
    context?: Record<string, any>;
}

function formatDevError(params: Omit<LogParams, 'error'> & { reason: string }): string {
    const { traceId, service, action, reason, context } = params;
    const contextString = context ? `Context: ${JSON.stringify(context)}` : '';
    return `[${service}] ${action} failed. Reason: ${reason}. {Trace ID: ${traceId}} ${contextString}`.trim();
}

class Logger {
    public error(params: Omit<LogParams, 'traceId'>): void {
        const { service, action, error, context } = params;

        const traceId = getTraceId() ?? "no-trace"

        const formattedMessage = formatDevError({
            traceId,
            service,
            action,
            reason: error.message,
            context,
        });

        winstonLogger.error(formattedMessage);

        if (process.env.NODE_ENV !== 'production' && error.stack) {
            winstonLogger.error(error.stack);
        }
    }

    public info(message: string): void {
        const traceId = getTraceId() ?? "no-trace"
        winstonLogger.info(`[INFO] ${message}. {Trace ID: ${traceId}}`);
    }

    public warn(message: string): void {
        winstonLogger.warn(message)
    }

    public debug(message: string): void {
        winstonLogger.debug(message)
    }
}

export const logger = new Logger();