import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    console.log('[Image Proxy] Request received for URL:', imageUrl);

    if (!imageUrl) {
      console.error('[Image Proxy] Missing url parameter');
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 },
      );
    }

    // Validate that the URL is from a trusted source (OpenAI/Azure)
    const url = new URL(imageUrl);
    const allowedHosts = [
      'oaidalleapiprodscus.blob.core.windows.net',
      'dalleprodsec.blob.core.windows.net',
      'cdn.openai.com',
    ];

    if (!allowedHosts.some((host) => url.hostname === host)) {
      console.error('[Image Proxy] Invalid image source:', url.hostname);
      return NextResponse.json(
        { error: 'Invalid image source' },
        { status: 403 },
      );
    }

    console.log('[Image Proxy] Fetching image from:', imageUrl);
    // Fetch the image
    const response = await fetch(imageUrl);

    console.log(
      '[Image Proxy] Response status:',
      response.status,
      'Content-Type:',
      response.headers.get('content-type'),
    );

    if (!response.ok) {
      console.error(
        '[Image Proxy] Failed to fetch image:',
        response.status,
        response.statusText,
      );
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status },
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    console.log(
      '[Image Proxy] Successfully proxied image, size:',
      imageBuffer.byteLength,
      'bytes',
    );

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Image Proxy] Error proxying image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
