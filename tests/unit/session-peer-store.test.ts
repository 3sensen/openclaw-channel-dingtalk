import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    clearSessionPeerOverride,
    getSessionPeerOverride,
    setSessionPeerOverride,
} from '../../src/session-peer-store';

const storePath = '/tmp/dingtalk-session-peer-store.json';
const stateDir = path.join(path.dirname(storePath), 'dingtalk-state');

describe('session-peer-store', () => {
    beforeEach(() => {
        fs.rmSync(stateDir, { recursive: true, force: true });
    });

    it('stores and reads per-group peerId override', () => {
        setSessionPeerOverride({
            storePath,
            accountId: 'main',
            conversationId: 'cid_group_1',
            peerId: 'shared-dev',
        });

        expect(
            getSessionPeerOverride({
                storePath,
                accountId: 'main',
                conversationId: 'cid_group_1',
            }),
        ).toBe('shared-dev');
    });

    it('clears override for a group', () => {
        setSessionPeerOverride({
            storePath,
            accountId: 'main',
            conversationId: 'cid_group_1',
            peerId: 'shared-dev',
        });

        expect(
            clearSessionPeerOverride({
                storePath,
                accountId: 'main',
                conversationId: 'cid_group_1',
            }),
        ).toBe(true);
        expect(
            getSessionPeerOverride({
                storePath,
                accountId: 'main',
                conversationId: 'cid_group_1',
            }),
        ).toBeUndefined();
    });
});
