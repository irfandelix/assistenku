import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const { fileName, fileType, fileSize, folderName } = await request.json();
    const parentFolderId = '1ar9w-DtnSP8u8xP1dvzFhASSczCrWf5d'; 

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json({ error: 'OAuth credentials missing' }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    let targetFolderId = parentFolderId;
    if (folderName) {
      try {
        const query = \mimeType='application/vnd.google-apps.folder' and name='\' and '\' in parents and trashed=false\;
        const searchRes = await drive.files.list({ q: query, fields: 'files(id)', spaces: 'drive' });
        if (searchRes.data.files && searchRes.data.files.length > 0) {
          targetFolderId = searchRes.data.files[0].id!;
        } else {
          const folderRes = await drive.files.create({
            requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] },
            fields: 'id'
          });
          if (folderRes.data.id) targetFolderId = folderRes.data.id;
        }
      } catch (err) {
        console.warn('Folder error, fallback to root', err);
      }
    }

    const tokenResponse = await oauth2Client.getAccessToken();
    if (!tokenResponse.token) {
        throw new Error('Failed to generate Google API token');
    }

    const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        'Authorization': \Bearer \\,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': fileType || 'application/octet-stream',
        'X-Upload-Content-Length': fileSize.toString()
      },
      body: JSON.stringify({
        name: \\_\\,
        parents: [targetFolderId]
      })
    });

    if (!initRes.ok) {
        const err = await initRes.text();
        throw new Error('Google Drive init error: ' + err);
    }

    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('No resumable upload URL returned by Google Drive');
    }

    return NextResponse.json({ success: true, uploadUrl });
  } catch (err: any) {
    console.error('Init Upload Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
