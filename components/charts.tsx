"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyPoint } from "@/lib/types";

export function ActivityChart({ title, data, dataKey }: { title: string; data: DailyPoint[]; dataKey: "txCount" | "activeWallets" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id={`${dataKey}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2F795A" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#2F795A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #DDD3C4" }} />
              <Area type="monotone" dataKey={dataKey} stroke="#2F795A" strokeWidth={2} fill={`url(#${dataKey}-fill)`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
