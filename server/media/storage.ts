import 'server-only';

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { db } from '@/server/db/client';
import { env, runtimeConfig } from '@/server/config';
import { ApiError, notFound, validationError } from '@/server/errors';

const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME = /^(image|video)\//;
const ALLOWED_DOCUMENTS = new Set(['application/pdf']);

function safeName(value: string) {
  const name = path.basename(value).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return name.slice(0, 120) || 'upload';
}

function localPath(storageKey: string) {
  const root = path.resolve(runtimeConfig().storageLocalDir);
  const candidate = path.resolve(root, storageKey);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) throw new ApiError(500, 'MEDIA_PATH_ERROR', 'Media path is invalid.');
  return { root, candidate };
}

function s3Client() {
  const region = env('S3_REGION') ?? 'auto';
  const endpoint = env('S3_ENDPOINT');
  const accessKeyId = env('S3_ACCESS_KEY_ID');
  const secretAccessKey = env('S3_SECRET_ACCESS_KEY');
  return new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
  });
}

function publicS3Url(storageKey: string) {
  const base = env('MEDIA_PUBLIC_BASE_URL');
  if (!base || !/^https?:\/\//i.test(base)) throw new ApiError(500, 'MEDIA_PUBLIC_URL_MISSING', 'MEDIA_PUBLIC_BASE_URL must be a public URL when MEDIA_DRIVER=s3.');
  return `${base.replace(/\/$/, '')}/${storageKey}`;
}

export async function storeMedia(file: File | null, altText: string, uploadedBy: string) {
  if (!file || typeof file.arrayBuffer !== 'function' || !file.size) throw validationError({ file: 'A file is required.' });
  if (file.size > MAX_MEDIA_BYTES) throw validationError({ file: 'Files must be 20 MB or smaller.' });
  if (!ALLOWED_MIME.test(file.type) && !ALLOWED_DOCUMENTS.has(file.type)) throw validationError({ file: 'Only images, videos and PDF documents are supported.' });

  const config = runtimeConfig();
  const driver = config.mediaDriver === 's3' ? 'S3' : 'LOCAL';
  const storageKey = `uploads/${randomUUID()}-${safeName(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (driver === 'LOCAL') {
    const { root, candidate } = localPath(storageKey);
    await mkdir(root, { recursive: true });
    await mkdir(path.dirname(candidate), { recursive: true });
    await writeFile(candidate, bytes, { flag: 'wx' });
  } else {
    const bucket = env('S3_BUCKET', true)!;
    await s3Client().send(new PutObjectCommand({ Bucket: bucket, Key: storageKey, Body: bytes, ContentType: file.type, CacheControl: 'public, max-age=31536000, immutable' }));
  }

  const id = randomUUID();
  const publicUrl = driver === 'LOCAL' ? `/api/v1/media/${id}` : publicS3Url(storageKey);
  return db.mediaAsset.create({
    data: {
      id,
      storageDriver: driver,
      storageKey,
      publicUrl,
      mimeType: file.type,
      sizeBytes: file.size,
      altText: altText.trim().slice(0, 200),
      uploadedBy,
    },
  });
}

export async function mediaResponse(id: string) {
  const asset = await db.mediaAsset.findUnique({ where: { id } });
  if (!asset || asset.deletedAt) throw notFound('Media asset not found.');
  if (asset.storageDriver === 'S3') return Response.redirect(asset.publicUrl, 302);

  const { candidate } = localPath(asset.storageKey);
  try {
    const bytes = await readFile(candidate);
    return new Response(bytes, {
      headers: {
        'Content-Type': asset.mimeType,
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${safeName(asset.storageKey.split('/').pop() ?? 'media')}"`,
      },
    });
  } catch {
    throw notFound('Media file not found.');
  }
}
