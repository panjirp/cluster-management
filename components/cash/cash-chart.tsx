"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MonthlySummary = {
  month: string;
  income: number;
  expense: number;
  balance: number;
};

const COLOR_INCOME = "#2a78d6";
const COLOR_EXPENSE = "#e34948";
const COLOR_BALANCE = "#4a3aa7";
const COLOR_GRID = "#e1e0d9";
const COLOR_AXIS = "#898781";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CashChart({ data }: { data: MonthlySummary[] }) {
  return (
    <div className="h-80 w-full rounded-lg border bg-card p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={COLOR_GRID} vertical={false} />
          <XAxis dataKey="month" stroke={COLOR_AXIS} tickLine={false} axisLine={{ stroke: COLOR_GRID }} fontSize={12} />
          <YAxis
            stroke={COLOR_AXIS}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(value) => new Intl.NumberFormat("id-ID", { notation: "compact" }).format(value)}
          />
          <Tooltip formatter={(value) => formatRupiah(Number(value))} />
          <Legend />
          <Bar dataKey="income" name="Pemasukan" fill={COLOR_INCOME} radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Pengeluaran" fill={COLOR_EXPENSE} radius={[4, 4, 0, 0]} />
          <Line
            type="monotone"
            dataKey="balance"
            name="Saldo Berjalan"
            stroke={COLOR_BALANCE}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
