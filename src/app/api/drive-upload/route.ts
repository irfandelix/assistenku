import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const foodName = formData.get('foodName') as string || 'Food_Image';
    const parentFolderId = '1ar9w-DtnSP8u8xP1dvzFhASSczCrWf5d';

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json({ 
        error: 'Sistem belum siap. Kredensial OAuth (Client ID, Secret, Refresh Token) belum dimasukkan ke Environment Variables.' 
      }, { status: 500 });
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

    // 1. Convert File to Stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // 2. Upload file to specific folder
    const response = await drive.files.create({
      requestBody: {
        name: `${foodName}_${Date.now()}_${file.name}`,
        parents: [parentFolderId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, webViewLink, webContentLink',
    });

    const fileId = response.data.id;

    if (!fileId) {
      throw new Error('Gagal mendapatkan ID file dari Google Drive.');
    }

    // 3. Make the file public so it can be viewed on the web
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // 4. Return direct image URL
    const directImageUrl = `https://drive.google.com/uc?id=${fileId}`;

    return NextResponse.json({ 
      success: true, 
      url: directImageUrl 
    });

  } catch (error: any) {
    console.error('Error uploading to Drive:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan saat mengunggah' }, { status: 500 });
  }
}
