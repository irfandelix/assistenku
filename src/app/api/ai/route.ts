import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini AI SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum di-set di environment variables.' },
        { status: 500 }
      );
    }

    const { transactions } = await request.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Data transaksi tidak valid.' },
        { status: 400 }
      );
    }

    // Format the transactions into a readable string for the AI
    let transactionText = 'Berikut adalah data transaksi keuangan saya:\n\n';
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      const type = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      if (t.type === 'income') totalIncome += t.amount;
      if (t.type === 'expense') totalExpense += t.amount;
      
      const date = t.createdAt?.seconds 
        ? new Date(t.createdAt.seconds * 1000).toLocaleDateString('id-ID')
        : 'Baru saja';
        
      transactionText += `- ${date}: ${type} Rp ${t.amount.toLocaleString('id-ID')} (${t.title})\n`;
    });

    transactionText += `\nTotal Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}`;
    transactionText += `\nTotal Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}`;
    transactionText += `\nSisa Saldo: Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}\n`;

    const prompt = `Anda adalah seorang penasihat keuangan pribadi (AI) bernama "Delix's Assistant".
Gunakan bahasa Indonesia yang santai, gaul, namun tetap profesional dan suportif.

Berdasarkan data transaksi berikut:
${transactionText}

Tolong berikan:
1. Ringkasan singkat tentang kebiasaan keuangan (apakah sehat, boros, dsb).
2. Tiga (3) insight atau saran praktis yang dapat ditindaklanjuti untuk berhemat atau mengoptimalkan uang.
3. Kata-kata motivasi singkat di akhir.

Jawab dengan format Markdown yang rapi, gunakan emoji, dan jangan terlalu panjang (maksimal 3-4 paragraf).`;

    // We use gemini-3.1-pro-preview which is available in the API
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-pro-preview' });
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ success: true, data: responseText });
  } catch (error: any) {
    console.error('AI Error:', error);
    return NextResponse.json(
      { error: 'Gagal menganalisis data. ' + (error.message || '') },
      { status: 500 }
    );
  }
}
