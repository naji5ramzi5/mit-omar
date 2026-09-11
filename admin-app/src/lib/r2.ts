import { AwsClient } from 'aws4fetch';

const R2_DEFAULT_ACCOUNT_ID = '607a1dc482665aa8e967d6e58f506e12';
const R2_DEFAULT_ACCESS_KEY_ID = 'd3c6d68cdcfbf57696b7db5adbc10625';
const R2_DEFAULT_SECRET_ACCESS_KEY = 'f38b9eb72656d535df46ecfbe68ce015de6f0ce94b7a45f74601dad2a62d1fbe';
const R2_DEFAULT_BUCKET = 'omar';

export function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID || R2_DEFAULT_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || R2_DEFAULT_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || R2_DEFAULT_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || R2_DEFAULT_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: 's3',
    region: 'auto',
  });

  return { client, bucket, accountId };
}

export async function getR2PresignedPut(key: string, contentType: string): Promise<string | null> {
  try {
    const cfg = getR2Config();
    if (!cfg) return null;
    const cleanKey = key.replace(/^r2:\/*/, '');
    const url = `https://${cfg.accountId}.r2.cloudflarestorage.com/${cfg.bucket}/${cleanKey}`;
    const signed = await cfg.client.sign(url, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      aws: { signQuery: true },
    });
    return signed.url;
  } catch {
    return null;
  }
}