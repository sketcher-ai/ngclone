import { NextRequest, NextResponse } from 'next/server';
import { createProxyMiddleware } from 'http-proxy-middleware';

// This will store active tunnels
const tunnels = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const { localUrl, tunnelId } = await req.json();
    
    if (!localUrl || !tunnelId) {
      return NextResponse.json(
        { error: 'Missing localUrl or tunnelId' },
        { status: 400 }
      );
    }

    // Store the tunnel mapping
    tunnels.set(tunnelId, localUrl);

    return NextResponse.json({
      success: true,
      tunnelUrl: `${req.headers.get('host')}/api/tunnel/${tunnelId}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create tunnel' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { tunnelId: string } }
) {
  const tunnelId = params.tunnelId;
  const localUrl = tunnels.get(tunnelId);

  if (!localUrl) {
    return NextResponse.json(
      { error: 'Tunnel not found' },
      { status: 404 }
    );
  }

  // Create proxy
  const proxy = createProxyMiddleware({
    target: localUrl,
    changeOrigin: true,
    ws: true, // Enable WebSocket proxy
  });

  // Forward the request
  return new Promise((resolve, reject) => {
    proxy(req, res, (result: any) => {
      if (result instanceof Error) {
        reject(result);
      }
      resolve(result);
    });
  });
} 