import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// IMPORTANT: Never hard-code credentials here. Use environment variables only.
function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || 'omar';

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials are not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in environment variables.');
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return { client, bucket };
}

export function isR2Key(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.startsWith('r2:') ||
    (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/'))
  );
}

export function cleanR2Key(raw: string): string {
  return raw.replace(/^r2:\/*/, '').replace(/\.\./g, '');
}

export async function fetchR2Object(key: string, requestHeaders?: Record<string, string>): Promise<Response> {
  try {
    const { client, bucket } = getR2Config();
    const cleanKey = cleanR2Key(key);

    // Build command with optional Range header for video seeking
    const commandInput: {
      Bucket: string;
      Key: string;
      Range?: string;
    } = { Bucket: bucket, Key: cleanKey };

    if (requestHeaders?.Range) {
      commandInput.Range = requestHeaders.Range;
    }

    const command = new GetObjectCommand(commandInput);
    const response = await client.send(command);

    // Build a web Response from the S3 response
    const headers = new Headers();
    if (response.ContentType) headers.set('Content-Type', response.ContentType);
    if (response.ContentLength != null) headers.set('Content-Length', String(response.ContentLength));
    if (response.ContentRange) headers.set('Content-Range', response.ContentRange);
    headers.set('Accept-Ranges', 'bytes');

    const body = response.Body
      ? (response.Body as unknown as ReadableStream)
      : null;

    const status = response.ContentRange ? 206 : 200;
    return new Response(body, { status, headers });
  } catch (err: any) {
    if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
      return new Response(null, { status: 404 });
    }
    throw err;
  }
}


export async function headR2Object(key: string): Promise<Response> {
  try {
    const { client, bucket } = getR2Config();
    const cleanKey = cleanR2Key(key);
    const response = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: cleanKey }));

    const headers = new Headers();
    if (response.ContentType) headers.set('Content-Type', response.ContentType);
    if (response.ContentLength != null) headers.set('Content-Length', String(response.ContentLength));
    headers.set('Accept-Ranges', 'bytes');

    return new Response(null, { status: 200, headers });
  } catch (err: any) {
    if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
      return new Response(null, { status: 404 });
    }
    throw err;
  }
}

/**
 * Generate a presigned GET URL for a private R2 object.
 * Use for short-lived access tokens (video playback, downloads).
 */
export async function getR2SignedUrl(key: string, expiresInSeconds = 3600): Promise<string | null> {
  try {
    const { client, bucket } = getR2Config();
    const cleanKey = cleanR2Key(key);
    const command = new GetObjectCommand({ Bucket: bucket, Key: cleanKey });
    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } catch {
    return null;
  }
}

/**
 * Generate a presigned PUT URL for uploading to R2.
 */
export async function getR2PresignedPut(key: string, contentType: string): Promise<string | null> {
  try {
    const { S3Client: _S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl: _getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const { client, bucket } = getR2Config();
    const cleanKey = cleanR2Key(key);
    const command = new PutObjectCommand({ Bucket: bucket, Key: cleanKey, ContentType: contentType });
    return await _getSignedUrl(client, command, { expiresIn: 3600 });
  } catch {
    return null;
  }
}