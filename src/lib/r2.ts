import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return { client: null as S3Client | null, bucket: '' as string };
  }

  return {
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
  };
}

export function isR2Key(url?: string | null): boolean {
  if (!url) return false;
  return url.startsWith('r2:') || (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/'));
}

export async function getR2SignedUrl(key: string, expiresInSeconds = 3600): Promise<string | null> {
  const { client, bucket } = getR2Client();
  if (!client) return null;
  const objectKey = key.startsWith('r2:') ? key.slice(3) : key;
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: objectKey }),
    { expiresIn: expiresInSeconds },
  ).catch(() => null);
}

export async function getR2PresignedPut(key: string, contentType: string): Promise<string | null> {
  const { client, bucket } = getR2Client();
  if (!client) return null;
  return getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: 600 },
  ).catch(() => null);
}