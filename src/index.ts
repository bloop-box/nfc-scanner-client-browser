export type UidCaptureCallback = (uid : string) => void;
export type UidCaptureErrorHandler = (error : Error) => void;
export type UnregisterUidCapture = () => void;

type Handler = [callback : UidCaptureCallback, errorHandler ?: UidCaptureErrorHandler];

const allowedKeys = /^[a-fA-F0-9]$/;
const registeredHandlers = new Set<Handler>();
let keydownHandler : (event : KeyboardEvent) => void;

/**
 * Register a UID callback which fires for every received UID.
 *
 * Returns a function to unregister the capture.
 */
export const registerUidCapture = (
    callback : UidCaptureCallback,
    errorHandler ?: UidCaptureErrorHandler
) : UnregisterUidCapture => {
    const handler : Handler = [callback, errorHandler];
    registeredHandlers.add(handler);

    const unregister = () => {
        registeredHandlers.delete(handler);

        if (registeredHandlers.size === 0) {
            window.removeEventListener('keydown', keydownHandler, {capture: true});
        }
    };

    if (registeredHandlers.size > 1) {
        return unregister;
    }

    let capturing = false;
    let uid = '';
    let timeout : number;

    keydownHandler = (event : KeyboardEvent) => {
        if (event.altKey && event.ctrlKey && event.shiftKey && event.key === 'U') {
            capturing = true;
            uid = '';
            event.preventDefault();
            event.stopPropagation();

            timeout = window.setTimeout(() => {
                capturing = false;
            }, 1000);
            return;
        }

        if (!capturing) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (event.altKey && event.ctrlKey && event.shiftKey && event.key === 'D') {
            capturing = false;
            window.clearTimeout(timeout);

            if (uid.length === 8 || uid.length === 14 || uid.length === 20) {
                registeredHandlers.forEach(([callback]) => {
                    callback(uid.toLowerCase());
                });
                return;
            }

            registeredHandlers.forEach(([, errorHandler]) => {
                if (errorHandler) {
                    errorHandler(new Error('Received UID has invalid length'));
                }
            });

            return;
        }

        if (!allowedKeys.test(event.key)) {
            return;
        }

        uid += event.key;
    };

    window.addEventListener('keydown', keydownHandler, {capture: true});
    return unregister;
};

export class AbortError extends Error {}

export const captureUid = async (signal ?: AbortSignal) : Promise<string> => {
    let unregisterCapture : UnregisterUidCapture;

    return await new Promise((resolve, reject) => {
        const handleAbort = () => {
            unregisterCapture();
            /* c8 ignore next */
            signal?.removeEventListener('abort', handleAbort);
            reject(new AbortError('UID capture was aborted'));
        };

        signal?.addEventListener('abort', handleAbort);

        unregisterCapture = registerUidCapture(
            uid => {
                unregisterCapture();
                /* c8 ignore next */
                signal?.removeEventListener('abort', handleAbort);
                resolve(uid);
            },
            error => {
                unregisterCapture();
                /* c8 ignore next */
                signal?.removeEventListener('abort', handleAbort);
                reject(error);
            },
        );
    });
};
