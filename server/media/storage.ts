import 'server-only';

import { mkdir, open, readFile, stat, writeFile } from 'node:fs/promises';
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

function optimizeHeroSvg(bytes: Buffer) {
  let source = bytes.toString('utf8');

  // Animated SVGs often promote every moving fragment to its own compositor
  // layer. That makes large hero animations stutter, so keep the SVG animation
  // intact while removing the blanket hint from the uploaded asset.
  source = source.replace(/\s*will-change\s*:\s*[^;{}]+;?/gi, '');

  // Keep a subtle stable wordmark behind the shatter pieces when the asset
  // exposes the same reusable word group. The original animation remains
  // untouched in the media library; this is only the homepage presentation.
  if (source.includes('id="word3d"') && source.includes('<!-- the word, split into pieces -->') && !source.includes('data-hero-static-base')) {
    source = source.replace(
      '<!-- the word, split into pieces -->',
      '<!-- data-hero-static-base --><use href="#word3d" opacity=".22"/>\n<!-- the word, split into pieces -->',
    );
  }

  return Buffer.from(source, 'utf8');
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

/** Parses a single "bytes=a-b" range; null when absent or not satisfiable as one range. */
export function parseByteRange(header: string | null | undefined, size: number): { start: number; end: number } | 'invalid' | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return 'invalid';
  let start: number;
  let end: number;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (suffix === 0) return 'invalid';
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  if (start > end || start >= size) return 'invalid';
  return { start, end };
}

export async function mediaResponse(id: string, presentation?: string | null, range?: string | null) {
  const asset = await db.mediaAsset.findUnique({ where: { id } });
  if (!asset || asset.deletedAt) throw notFound('Media asset not found.');
  if (asset.storageDriver === 'S3') return Response.redirect(asset.publicUrl, 302);

  const { candidate } = localPath(asset.storageKey);
  const headers = {
    'Content-Type': asset.mimeType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Disposition': `inline; filename="${safeName(asset.storageKey.split('/').pop() ?? 'media')}"`,
    'Accept-Ranges': 'bytes',
  };
  try {
    if (presentation === 'hero' && asset.mimeType === 'image/svg+xml') {
      const responseBytes = optimizeHeroSvg(await readFile(candidate));
      return new Response(responseBytes, { headers: { ...headers, 'Content-Length': String(responseBytes.byteLength) } });
    }
    const { size } = await stat(candidate);
    // Video players (Safari/iOS in particular) only play files served in byte ranges.
    const requested = parseByteRange(range, size);
    if (requested === 'invalid') return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${size}` } });
    const { start, end } = requested ?? { start: 0, end: size - 1 };
    const length = Math.max(end - start + 1, 0);
    const bytes = new Uint8Array(length);
    const file = await open(candidate, 'r');
    try {
      await file.read(bytes, 0, length, start);
    } finally {
      await file.close();
    }
    return new Response(bytes, {
      status: requested ? 206 : 200,
      headers: { ...headers, 'Content-Length': String(length), ...(requested ? { 'Content-Range': `bytes ${start}-${end}/${size}` } : {}) },
    });
  } catch {
    throw notFound('Media file not found.');
  }
}
