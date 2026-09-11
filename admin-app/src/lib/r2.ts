import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || 'omar';

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { client, bucket, accountId };
}


export async function getR2PresignedPut(key: string, contentType: string): Promise<string | null> {
  try {
    const config = getR2Config();
    if (!config) return null;


    const cleanKey = key.replace(/^r2:\/*/, '');
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: cleanKey,
      ContentType: contentType,
    });

    const url = await getSignedUrl(config.client, command, { expiresIn: 3600 });
    return url;
  } catch (err) {
    console.error('Error generating presigned PUT URL:', err);
    return null;
  }
}