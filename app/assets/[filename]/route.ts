import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  
  // Resolve the base name without extension
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);
  
  // Check if we have a corresponding SVG template
  const svgPath = path.join(process.cwd(), 'public', 'assets', `${baseName}.svg`);
  
  if (fs.existsSync(svgPath)) {
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    return new Response(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }
  
  return new NextResponse('Asset not found', { status: 404 });
}
