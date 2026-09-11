import { createHmac, randomBytes, timingSafeEqual, createCipheriv } from 'crypto';

const VIDEO_TOKEN_TTL_MS = 1000 * 60 * 15; // 15 minutes
const WATERMARK_SECRET = process.env.WATERMARK_SECRET || 'dmo-watermark-v1';

function getVideoSecret(): string {
  return process.env.VIDEO_TOKEN_SECRET || 'dmo-video-token-v1';
}

export interface VideoPlayToken {
  lessonId: string;
  userId: string;
  issuedAt: number;
  expiresAt: number;
  ip?: string;
  ua?: string;
}

export function issueVideoToken(payload: Omit<VideoPlayToken, 'issuedAt' | 'expiresAt'>): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + VIDEO_TOKEN_TTL_MS;
  const fullPayload = { ...payload, issuedAt, expiresAt };
  const payloadStr = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const sig = createHmac('sha256', getVideoSecret()).update(payloadStr).digest('hex');
  return `${payloadStr}.${sig}`;
}

export function verifyVideoToken(token: string): VideoPlayToken | null {
  if (!token) return null;
  const idx = token.lastIndexOf('.');
  if (idx === -1) return null;
  
  const payloadStr = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  
  const expected = createHmac('sha256', getVideoSecret()).update(payloadStr).digest('hex');
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  
  let payload: VideoPlayToken;
  try {
    payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString());
  } catch {
    return null;
  }
  
  if (payload.expiresAt < Date.now()) return null;
  
  return payload;
}

export function generateWatermarkToken(userId: string, lessonId: string): string {
  const payload = `${userId}:${lessonId}:${Date.now()}:${randomBytes(8).toString('hex')}`;
  const sig = createHmac('sha256', WATERMARK_SECRET).update(payload).digest('hex').slice(0, 16);
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyWatermarkToken(token: string): { userId: string; lessonId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const idx = decoded.lastIndexOf('.');
    if (idx === -1) return null;
    
    const payload = decoded.slice(0, idx);
    const sig = decoded.slice(idx + 1);
    
    const expected = createHmac('sha256', WATERMARK_SECRET).update(payload).digest('hex').slice(0, 16);
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    
    const [userId, lessonId] = payload.split(':');
    if (!userId || !lessonId) return null;
    
    return { userId, lessonId };
  } catch {
    return null;
  }
}

export interface HLSConfig {
  masterPlaylist: string;
  segmentDuration: number;
  keyRotationInterval: number;
}

export function generateAESKey(): Buffer {
  return randomBytes(16);
}

export function generateIV(): Buffer {
  return randomBytes(16);
}

export function encryptSegment(data: Buffer, key: Buffer, iv: Buffer): Buffer {
  const cipher = createCipheriv('aes-128-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return encrypted;
}

export function generateKeyUri(keyId: string, lessonId: string): string {
  return `/api/videos/key/${lessonId}/${keyId}`;
}

export const VIDEO_SECURITY_CONFIG = {
  signedUrlTtlSeconds: 900, // 15 minutes
  hlsSegmentDuration: 6, // seconds
  hlsKeyRotationSegments: 10, // rotate key every 10 segments
  maxConcurrentStreams: 2,
  watermarkOpacity: 0.15,
  allowedOrigins: [
    'http://localhost:3001',
    'https://yourdomain.com',
  ],
  maxConcurrentPerUser: 1,
  tokenTtlMinutes: 15,
  keyRotationSegments: 10,
  segmentDuration: 6,
  maxBitrate: 5000000, // 5 Mbps
  allowedCodecs: ['h264', 'vp9', 'av1'],
} as const;