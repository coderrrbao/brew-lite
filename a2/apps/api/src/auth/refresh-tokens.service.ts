import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

type Session = { userId: string; tokenHash: string; expiresAt: number };

@Injectable()
export class RefreshTokensService {
  private readonly sessions = new Map<string, Session>();

  async store(params: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
  }) {
    this.purgeExpired();
    this.sessions.set(params.id, {
      userId: params.userId,
      tokenHash: hashToken(params.token),
      expiresAt: params.expiresAt.getTime(),
    });
  }

  async consume(id: string, token: string): Promise<boolean> {
    const session = this.sessions.get(id);
    if (!session || session.tokenHash !== hashToken(token)) return false;

    this.sessions.delete(id);
    return session.expiresAt > Date.now();
  }

  async revokeAllForUser(userId: string) {
    for (const [id, session] of this.sessions) {
      if (session.userId === userId) this.sessions.delete(id);
    }
  }

  private purgeExpired() {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (session.expiresAt <= now) this.sessions.delete(id);
    }
  }
}