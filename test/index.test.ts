import {describe, expect, it, vi} from 'vitest';
import {AbortError, captureUid, registerUidCapture} from '../src/index.js';

const startEvent = new KeyboardEvent('keydown', {altKey: true, shiftKey: true, ctrlKey: true, key: 'U'});
const endEvent = new KeyboardEvent('keydown', {altKey: true, shiftKey: true, ctrlKey: true, key: 'D'});

const sendUid = (uid : string) => {
    window.dispatchEvent(startEvent);

    for (const char of uid) {
        window.dispatchEvent(new KeyboardEvent('keydown', {key: char}));
    }

    window.dispatchEvent(endEvent);
};

describe('register', () => {
    it('should register handler', () => {
        let capturedUid;
        const unregister = registerUidCapture(uid => {
            capturedUid = uid;
        });

        sendUid('aabbccdd');
        unregister();
        expect(capturedUid).to.equal('aabbccdd');
    });

    it('should stop events from propagating', () => {
        const unregister = registerUidCapture(() => {
            // Noop
        });

        const events = [];
        window.addEventListener('keydown', event => {
            events.push(event);
        });

        sendUid('aabbccdd');
        unregister();
        expect(events).to.have.length(0);
    });

    it('should skip invalid keys', () => {
        let capturedUid;
        const unregister = registerUidCapture(uid => {
            capturedUid = uid;
        });

        sendUid('aalkbbccdd');
        unregister();
        expect(capturedUid).to.equal('aabbccdd');
    });

    it('should unregister after last handler', () => {
        const capturedUids = [];
        const firstUnregister = registerUidCapture(uid => {
            capturedUids.push(uid);
        });
        const secondUnregister = registerUidCapture(uid => {
            capturedUids.push(uid);
        });

        sendUid('aabbccdd');
        firstUnregister();
        sendUid('bbccddee');
        secondUnregister();
        sendUid('ccddeeff');
        expect(capturedUids).to.eql(['aabbccdd', 'aabbccdd', 'bbccddee']);

        const events = [];
        window.addEventListener('keydown', event => {
            events.push(event);
        });

        sendUid('aabbccdd');
        expect(events).to.have.length(10);
    });

    it('should emit error on invalid UID', () => {
        let capturedError;

        const unregister = registerUidCapture(
            () => {
                // Noop
            },
            error => {
                capturedError = error;
            }
        );

        sendUid('aabbccd');
        unregister();
        expect(capturedError).to.eql(new Error('Received UID has invalid length'));
    });

    it('should time out after a second', () => {
        vi.useFakeTimers();

        const capturedUids = [];
        const unregister = registerUidCapture(uid => {
            capturedUids.push(uid);
        });

        window.dispatchEvent(startEvent);
        vi.advanceTimersByTime(1000);

        for (const char of 'aabbccdd') {
            window.dispatchEvent(new KeyboardEvent('keydown', {key: char}));
        }

        window.dispatchEvent(endEvent);
        sendUid('bbccddee');
        expect(capturedUids).to.eql(['bbccddee']);
        unregister();
        vi.useRealTimers();
    });
});

describe('capture', () => {
    it('should return UID', async () => {
        const promise = captureUid();
        sendUid('aabbccdd');
        await expect(promise).resolves.toEqual('aabbccdd');
    });

    it('should abort on request', async () => {
        const abortController = new AbortController();
        const promise = captureUid(abortController.signal);
        abortController.abort();
        await expect(promise).rejects.toEqual(new AbortError('UID capture was aborted'));
    });

    it('should reject on error', async () => {
        const promise = captureUid();
        sendUid('aabbccd');
        await expect(promise).rejects.toEqual(new Error('Received UID has invalid length'));
    });
});
