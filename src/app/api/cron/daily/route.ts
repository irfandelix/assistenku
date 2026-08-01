import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 1. Fetch pending Todos
    const qTodos = query(collection(db, 'todos'), where('done', '==', false));
    const todosSnap = await getDocs(qTodos);
    const todos = todosSnap.docs.map(doc => doc.data());

    // 2. Fetch tomorrow's subscriptions
    // In UTC, we need to adjust to local time roughly. Let's just use a simple JS Date and add 1 day.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Since Firebase doesn't support complex querying easily on day of month without specific indexes, 
    // we'll just fetch all subscriptions and filter in memory since the list is small.
    const subsSnap = await getDocs(collection(db, 'subscriptions'));
    const tomorrowDay = tomorrow.getDate();
    
    const upcomingSubs = subsSnap.docs
      .map(doc => doc.data())
      .filter(sub => parseInt(sub.billingDay) === tomorrowDay);

    // 3. Construct Message
    let message = '🌅 <b>MORNING BRIEFING</b>\n\n';

    if (todos.length > 0) {
      message += `📝 <b>Ada ${todos.length} Tugas Menunggu:</b>\n`;
      todos.forEach((t: any, idx: number) => {
        message += `${idx + 1}. ${t.title} <i>(${t.time || 'Kapan saja'})</i>\n`;
      });
      message += '\n';
    } else {
      message += `✨ <b>Bebas Tugas!</b> Tidak ada to-do list yang belum selesai.\n\n`;
    }

    if (upcomingSubs.length > 0) {
      message += `🚨 <b>PERHATIAN: Tagihan Besok!</b>\n`;
      upcomingSubs.forEach((s: any) => {
        message += `💸 ${s.name} - Rp ${parseFloat(s.price).toLocaleString('id-ID')}\n`;
      });
      message += `<i>Siapkan saldomu ya!</i>\n\n`;
    }

    message += `Semangat menjalani hari ini! 🔥`;

    // 4. Send via Notify API logic (reuse logic)
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (BOT_TOKEN && CHAT_ID) {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      });
    }

    return NextResponse.json({ success: true, message: "Morning briefing sent!" });
  } catch (error: any) {
    console.error('Error daily cron:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
