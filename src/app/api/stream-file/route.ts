import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('id');

  if (!fileId) {
    return new NextResponse('Missing id parameter', { status: 400 });
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return new NextResponse('Sistem belum siap. Kredensial OAuth (Client ID, Secret, Refresh Token) belum dimasukkan ke Environment Variables.', { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 1. Get file metadata (mimeType, name)
    const fileMeta = await drive.files.get({
      fileId: fileId,
      fields: 'mimeType, name'
    });

    const mimeType = fileMeta.data.mimeType || 'application/octet-stream';
    const fileName = fileMeta.data.name || 'document';

    // 2. Fetch the file content stream
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    // 3. Convert Node.js readable stream to Web Stream
    const stream = response.data;
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      }
    });

    // 4. Return as inline response so browsers will preview it natively
    return new NextResponse(webStream, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });

  } catch (error: any) {
    console.error('Streaming error:', error);
    return new NextResponse('Error streaming file: ' + error.message, { status: 500 });
  }
}
