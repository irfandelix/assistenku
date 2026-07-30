'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface Transaction {
  amount: number;
  type: string;
  createdAt: any;
}

interface FinanceChartProps {
  transactions: Transaction[];
  height?: number;
}

export default function FinanceChart({ transactions, height = 200 }: FinanceChartProps) {
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dayTransactions = transactions.filter(t => t.createdAt?.toDate && isSameDay(t.createdAt.toDate(), d));
      
      const income = dayTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
      const expense = dayTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
      
      return {
        day: format(d, 'EE', { locale: localeId }),
        fullDate: format(d, 'dd MMM yyyy', { locale: localeId }),
        income,
        expense
      };
    });
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#050608] border border-gray-800 p-3 rounded-xl shadow-2xl">
          <p className="text-gray-400 text-xs font-bold mb-2 uppercase">{payload[0].payload.fullDate}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <p className="text-sm font-medium text-gray-200">
                  {entry.name === 'income' ? 'Pemasukan: ' : 'Pengeluaran: '}
                  <span style={{ color: entry.color }}>
                    Rp {entry.value.toLocaleString('id-ID')}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00E676" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00E676" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF9100" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#FF9100" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis 
            dataKey="day" 
            stroke="#6b7280" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#6b7280" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Area 
            type="monotone" 
            dataKey="income" 
            name="income"
            stroke="#00E676" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorIncome)" 
          />
          <Area 
            type="monotone" 
            dataKey="expense" 
            name="expense"
            stroke="#FF9100" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorExpense)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
