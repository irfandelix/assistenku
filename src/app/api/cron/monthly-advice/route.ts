import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, Timestamp, where } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(request: Request) {
  try {
    // 1. Authorization checks (Optional: Vercel sends a CRON secret header)
    const authHeader = request.headers.get('authorization');
    const isTest = new URL(request.url).searchParams.get('test') === 'true';

    // Ensure only Vercel CRON or test mode can run this
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}` && !isTest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check if today is the last day of the month (WIB time)
    // We add 7 hours to UTC to get WIB
    const nowUtc = new Date();
    const nowWib = new Date(nowUtc.getTime() + (7 * 60 * 60 * 1000));
    
    // Tomorrow in WIB
    const tomorrowWib = new Date(nowWib.getTime() + (24 * 60 * 60 * 1000));
    
    // If tomorrow is not the 1st of the month, today is not the last day
    if (tomorrowWib.getDate() !== 1 && !isTest) {
      return NextResponse.json({ message: 'Bukan hari terakhir bulan ini. Cron diabaikan.' });
    }

    // 3. Fetch data for the current month
    const startOfMonthWib = new Date(nowWib.getFullYear(), nowWib.getMonth(), 1);
    // Convert back to UTC for Firestore query if needed, but Firestore Timestamp uses UTC under the hood.
    // It's safer to just get start of month in UTC relative to WIB's month.
    const startOfMonthUtc = new Date(startOfMonthWib.getTime() - (7 * 60 * 60 * 1000));
    const startTimestamp = Timestamp.fromDate(startOfMonthUtc);

    const financeRef = collection(db, 'finance');
    const q = query(financeRef, where('createdAt', '>=', startTimestamp));
    const snapshot = await getDocs(q);

    let totalIncome = 0;
    let totalExpense = 0;
    let transactionText = 'Berikut adalah data transaksi keuangan saya bulan ini:\n\n';

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const type = data.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      if (data.type === 'income') totalIncome += data.amount;
      if (data.type === 'expense') totalExpense += data.amount;
      
      const date = data.createdAt?.seconds 
        ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('id-ID')
        : 'Bulan ini';
        
      transactionText += `- ${date}: ${type} Rp ${data.amount.toLocaleString('id-ID')} (${data.title})\n`;
    });

    if (snapshot.empty) {
      transactionText += "(Tidak ada transaksi yang tercatat bulan ini)\n";
    }

    transactionText += `\nTotal Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}`;
    transactionText += `\nTotal Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}`;
    transactionText += `\nSisa Saldo Bersih Bulan Ini: Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}\n`;

    // 4. Generate Insights using Gemini AI
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is missing');
    }

    const prompt = `Anda adalah penasihat keuangan pribadi (AI) bernama "Delix's Assistant".
Gunakan bahasa Indonesia yang gaul, suportif, dan profesional.
Ini adalah jadwal laporan akhir bulan. Berdasarkan data bulan ini:
${transactionText}

Tolong berikan pesan Telegram (jangan pakai Markdown terlalu rumit, gunakan <b> </b> untuk tebal atau <i> </i> untuk miring jika perlu, atau cukup teks bersih dengan emoji):
1. Sapa dengan ramah "Halo, ini laporan akhir bulanmu!"
2. Berikan 3 insight atau evaluasi kinerja keuangan bulan ini.
3. Berikan saran berhemat untuk bulan depan.
4. Jangan terlalu panjang, pastikan pas dibaca di Telegram.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const result = await model.generateContent(prompt);
    let aiResponse = result.response.text();
    
    // Clean up Gemini's markdown that Telegram HTML parser doesn't like (like **bold**)
    aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>');

    // 5. Send to Telegram
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      throw new Error('Telegram credentials missing');
    }

    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const tgResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: aiResponse,
        parse_mode: 'HTML',
      }),
    });

    if (!tgResponse.ok) {
      const errorData = await tgResponse.json();
      throw new Error(`Telegram API Error: ${JSON.stringify(errorData)}`);
    }

    return NextResponse.json({ success: true, message: 'Monthly advice sent to Telegram successfully.' });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json(
      { error: 'Failed to process monthly advice. ' + (error.message || '') },
      { status: 500 }
    );
  }
}
