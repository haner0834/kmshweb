import { trace } from "console";
import { getTraceId } from "./traceid.utils";
import { winstonLogger } from "./winston.utils";

interface ErrorLogParams {
    traceId: string;
    service: string;
    action: string;
    error: Error;
    context?: Record<string, any>;
}

interface LogParams {
    traceId: string;
    service: string;
    action: string;
    context?: Record<string, any>;
    callerInfo?: string;
}

interface LogMessage {
    message: string,
    meta?: Record<string, any>
}

function formatDevError(
    params: Omit<ErrorLogParams, 'error'> & { reason: string }
): LogMessage {
    const { traceId, service, action, reason, context } = params;
    const message = `[${service}] ${action} failed. | Reason: ${reason} | Trace ID: ${traceId}`.trim();
    return { message, meta: context }
}

function formatLogMessage(
    level: 'info' | 'warn' | 'debug',
    message: string,
    params: LogParams
): LogMessage {
    const { traceId, service, action, context, callerInfo } = params
    const base = `[${service}] ${action} ${level.toUpperCase()}: ${message} | Trace ID: ${traceId}`;
    const fullMessage = callerInfo ? `${base} | at ${callerInfo}` : base;
    return { message: fullMessage, meta: context };
}

interface CallerMeta {
    functionName: string;
    serviceName: string;
    filePath?: string;
    line?: number;
    column?: number;
}

import * as path from 'path';

/**
 * 定義呼叫者元數據的結構
 */
interface CallerMeta {
    functionName: string;
    serviceName: string;
    filePath?: string;
    line?: number;
    column?: number;
}

// 取得此日誌工具檔案的絕對路徑，用於在堆疊中過濾掉自身
const LOGGER_FILE_PATH = path.resolve(__filename);

// 已知的、需要被過濾掉的異步機制相關的堆疊關鍵字
const ASYNC_FRAMES_TO_IGNORE = [
    'Generator.next',
    'Generator.throw',
    'fulfilled',
    'rejected',
    'processTicksAndRejections',
    'new Promise (<anonymous>)',
];

/**
 * 動態掃描堆疊追蹤，以獲取日誌呼叫者的元數據。
 * 此版本移除了 `depth` 參數，能更可靠地處理異步錯誤。
 */
export function getCallerMeta(): CallerMeta {
    const stack = new Error().stack;
    if (!stack) {
        return { functionName: "unknown", serviceName: "unknown" };
    }

    const stackLines = stack.split('\n').slice(1); // 移除第一行 "Error"

    for (const stackLine of stackLines) {
        const trimmedLine = stackLine.trim();

        // 策略 1: 過濾掉日誌函式庫本身的堆疊幀
        if (trimmedLine.includes(LOGGER_FILE_PATH)) {
            continue;
        }

        // 策略 2: 過濾掉已知的異步處理機制相關的堆疊幀
        if (ASYNC_FRAMES_TO_IGNORE.some(keyword => trimmedLine.includes(keyword))) {
            continue;
        }

        // 策略 3: 確保是有效的堆疊行
        if (!trimmedLine.startsWith('at ')) {
            continue;
        }

        // --- 以下是您的解析邏輯，在找到第一個有效目標行後執行 ---

        const match = trimmedLine.match(/\s+at\s+(.*?)\s+\((.*?):(\d+):(\d+)\)/) ||
            trimmedLine.match(/\s+at\s+(.*?):(\d+):(\d+)/);

        if (!match) {
            continue;
        }

        // 成功匹配，開始解析並返回結果
        let functionName = "unknown";
        let filePath = "";
        let line = 0;
        let column = 0;

        // 處理有函式名的情況: at functionName (filePath:line:column)
        if (match.length === 5) {
            functionName = match[1] || '<anonymous>'; // 如果匹配到但名稱為空，設為匿名
            filePath = match[2];
            line = parseInt(match[3], 10);
            column = parseInt(match[4], 10);
        }
        // 處理匿名函式的情況: at filePath:line:column
        else if (match.length === 4) {
            functionName = '<anonymous>';
            filePath = match[1];
            line = parseInt(match[2], 10);
            column = parseInt(match[3], 10);
        }

        // --- 保留您提取 serviceName 的邏輯 ---
        let serviceName = "unknown";
        if (filePath) {
            const fileName = filePath.split('/').pop() ?? '';
            // 正則表達式稍微優化，處理 .js 檔案結尾的情況
            const serviceMatch = fileName.match(/^(.+?)\.(service|controller|middleware|utils|repository|route)(\.[tj]s)?$/);
            if (serviceMatch) {
                serviceName = serviceMatch[1];
            }
        }

        return {
            functionName,
            serviceName,
            filePath,
            line,
            column,
        };
    }

    // 如果遍歷完所有堆疊行都沒找到，返回預設值
    return {
        functionName: "unknown",
        serviceName: "unknown"
    };
}

class Logger {
    public error(params: Omit<ErrorLogParams, 'traceId' | 'service' | 'action'> & Partial<Pick<ErrorLogParams, 'service' | 'action'>>): void {
        const { error, context } = params;

        const traceId = getTraceId() ?? "no-trace";
        const { functionName, serviceName, filePath, line, column } = getCallerMeta();

        const action = params.action ?? functionName;
        const service = params.service ?? serviceName;

        const callerInfo = filePath ? `${filePath}:${line}:${column}` : '';

        const { message } = formatDevError({
            traceId,
            service,
            action,
            reason: error.message + (callerInfo ? ` | at ${callerInfo}` : ''),
            context,
        });

        winstonLogger.error(message, {
            service,
            action,
            traceId,
            context,
        });

        if (process.env.NODE_ENV !== 'production' && error.stack) {
            winstonLogger.error(error.stack);
        }
    }

    public info(message: string, context?: Record<string, any>): void {
        const traceId = getTraceId() ?? "no-trace";
        const { functionName, serviceName, filePath, line, column } = getCallerMeta();

        const action = functionName;
        const service = serviceName;
        const callerInfo = filePath ? `${filePath}:${line}:${column}` : '';

        const { message: formattedMessage, meta } = formatLogMessage("info", message, {
            traceId,
            service,
            action,
            context,
            callerInfo,
        });

        winstonLogger.info(formattedMessage, {
            traceId,
            service,
            action,
            context,
            callerInfo,
        });
    }

    public warn(message: string, context?: Record<string, any>): void {
        const traceId = getTraceId() ?? "no-trace";
        const { functionName, serviceName, filePath, line, column } = getCallerMeta();

        const action = functionName;
        const service = serviceName;
        const callerInfo = filePath ? `${filePath}:${line}:${column}` : '';

        const { message: formattedMessage, meta } = formatLogMessage("warn", message, {
            traceId,
            service,
            action,
            context,
            callerInfo,
        });

        winstonLogger.warn(formattedMessage, {
            traceId,
            service,
            action,
            context,
            callerInfo,
        });
    }

    public debug(message: string, context?: Record<string, any>): void {
        const traceId = getTraceId() ?? "no-trace";
        const { functionName, serviceName, filePath, line, column } = getCallerMeta();

        const action = functionName;
        const service = serviceName;
        const callerInfo = filePath ? `${filePath}:${line}:${column}` : '';

        const { message: formattedMessage, meta } = formatLogMessage("debug", message, {
            traceId,
            service,
            action,
            context,
            callerInfo,
        });

        winstonLogger.debug(formattedMessage, {
            traceId,
            service,
            action,
            context,
            callerInfo,
        });
    }
}

export const logger = new Logger();
