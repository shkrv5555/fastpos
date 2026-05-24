import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, Dimensions,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { ownerAPI } from '../../api/endpoints';

const { width } = Dimensions.get('window');
const CHART_W   = width - 48;

const CHART_CONFIG = {
  backgroundColor:     '#fff',
  backgroundGradientFrom: '#fff',
  backgroundGradientTo:   '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
  labelColor:  (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#FF6B35' },
  propsForBackgroundLines: { stroke: '#F1F3F5' },
};

export default function AnalyticsScreen() {
  const [weekData,   setWeekData]   = useState([]);
  const [topProds,   setTopProds]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [monthStats, setMonthStats] = useState(null);

  useEffect(() => {
    const now = new Date();
    Promise.all([
      ownerAPI.getStats({ period: 'week' }),
      ownerAPI.getStats({ period: 'month', year: now.getFullYear(), month: now.getMonth() + 1 }),
      ownerAPI.getTopProducts({ limit: 10 }),
    ]).then(([week, month, top]) => {
      setWeekData(week.data || []);
      // Aylıq toplam hesabla
      const monthly = (month.data || []).reduce(
        (acc, d) => ({
          orders:  acc.orders  + parseInt(d.order_count || 0),
          revenue: acc.revenue + parseFloat(d.revenue   || 0),
        }),
        { orders: 0, revenue: 0 }
      );
      setMonthStats(monthly);
      setTopProds(top.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#FF6B35" /></View>
  );

  // Həftəlik qrafik data
  const hasWeekData = weekData.length > 0;
  const weekChart   = hasWeekData ? {
    labels:   weekData.map(d => d.day?.slice(5) || ''),
    datasets: [{ data: weekData.map(d => parseFloat(d.revenue) || 0) }],
  } : null;

  // Ən çox satılan — bar chart üçün (max 6)
  const top6     = topProds.slice(0, 6);
  const barChart = top6.length > 0 ? {
    labels:   top6.map(p => p.product_name.slice(0, 8)),
    datasets: [{ data: top6.map(p => parseInt(p.total_sold) || 0) }],
  } : null;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Aylıq xülasə */}
      {monthStats && (
        <View style={s.summaryRow}>
          <StatCard title="Bu ay sifarişlər" value={monthStats.orders}                       color="#4361EE" />
          <StatCard title="Bu ay gəlir"       value={`${monthStats.revenue.toFixed(2)} ₼`}   color="#FF6B35" />
        </View>
      )}

      {/* Həftəlik gəlir xətti */}
      {weekChart && (
        <Section title="Son 7 günün gəliri (₼)">
          <LineChart
            data={weekChart}
            width={CHART_W}
            height={200}
            chartConfig={CHART_CONFIG}
            bezier
            style={{ borderRadius: 12 }}
            withInnerLines={false}
          />
        </Section>
      )}

      {/* Ən çox satılanlar — bar chart */}
      {barChart && (
        <Section title="Ən çox satılan məhsullar (ədəd)">
          <BarChart
            data={barChart}
            width={CHART_W}
            height={200}
            chartConfig={{
              ...CHART_CONFIG,
              color: (opacity = 1) => `rgba(67, 97, 238, ${opacity})`,
            }}
            style={{ borderRadius: 12 }}
            showValuesOnTopOfBars
            withInnerLines={false}
          />
        </Section>
      )}

      {/* Tam siyahı */}
      {topProds.length > 0 && (
        <Section title="Bütün məhsulların satış reyinqi">
          {topProds.map((p, i) => (
            <View key={i} style={s.rankRow}>
              <Text style={[s.rank, i < 3 && s.rankTop]}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.rankName}>{p.product_name}</Text>
                <View style={s.rankBar}>
                  <View style={[s.rankBarFill, {
                    width: `${Math.min(100, (parseInt(p.total_sold) / (parseInt(topProds[0]?.total_sold) || 1)) * 100)}%`,
                  }]} />
                </View>
              </View>
              <View style={s.rankStats}>
                <Text style={s.rankSold}>{p.total_sold} ədəd</Text>
                <Text style={s.rankRevenue}>{parseFloat(p.total_revenue).toFixed(0)} ₼</Text>
              </View>
            </View>
          ))}
        </Section>
      )}
    </ScrollView>
  );
}

function StatCard({ title, value, color }) {
  return (
    <View style={[s.statCard, { borderTopColor: color }]}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statTitle}>{title}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F8F9FA', padding: 16 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryRow:  { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard:    { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderTopWidth: 3, elevation: 2 },
  statValue:   { fontSize: 20, fontWeight: '800', color: '#212529' },
  statTitle:   { fontSize: 11, color: '#6C757D', marginTop: 4 },
  section:     { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle:{ fontSize: 15, fontWeight: '700', marginBottom: 12, color: '#212529' },
  rankRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  rank:        { fontSize: 15, fontWeight: '800', color: '#ADB5BD', width: 24 },
  rankTop:     { color: '#FF6B35' },
  rankName:    { fontSize: 13, fontWeight: '600', color: '#212529', marginBottom: 4 },
  rankBar:     { height: 6, backgroundColor: '#F1F3F5', borderRadius: 3, overflow: 'hidden' },
  rankBarFill: { height: '100%', backgroundColor: '#FF6B35', borderRadius: 3 },
  rankStats:   { alignItems: 'flex-end' },
  rankSold:    { fontSize: 12, fontWeight: '700', color: '#212529' },
  rankRevenue: { fontSize: 11, color: '#6C757D' },
});
