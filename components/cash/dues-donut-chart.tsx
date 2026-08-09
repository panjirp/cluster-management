"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLOR_LUNAS = "#0ca30c";
const COLOR_MENUNGGAK = "#d03b3b";

export function DuesDonutChart({ paid, unpaid }: { paid: number; unpaid: number }) {
  const total = paid + unpaid;
  if (total === 0) return null;

  const data = [
    { name: "Lunas", value: paid, color: COLOR_LUNAS },
    { name: "Menunggak", value: unpaid, color: COLOR_MENUNGGAK },
  ];

  return (
    <div className="h-44 w-full max-w-sm rounded-lg border bg-card p-3 sm:h-48 sm:p-4 lg:h-64">
      <p className="mb-1 text-sm font-medium text-muted-foreground sm:mb-2">Kepatuhan Uang Kas Bulan Ini</p>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="82%" paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} rumah`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
