import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { ownerAPI } from '../../api/endpoints';

const { width } = Dimensions.get('window');

const PERIODS = [
  { key: 'today', label: 'Bu gün' },
  { key: 'week',  label: 'Həftə'  },
  { key: 'month', label: 'Bu ay'  },
];

const CHART_CONFIG = {
  backgroundColor: '#fff', backgroundGradientFrom: '#fff', backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#FF6B35' },
  propsForBackgroundLines: { stroke: '#F1F3F5' },
};

export default function DashboardScreen() {
  const [period,      setPeriod]      = useState('today');
  const [todayStats,  setTodayStats]  = useState(null);
  const [chartData,   setChartData]   = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  async function load(isRefresh = false) {
    if (!isRefresh) setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      const [todayRes, periodRes, topRes] = await Promise.all([
        ownerAPI.getStats({ period: 'today' }),
        period !== 'today' ? ownerAPI.getStats({ period }) : Promise.resolve({ data: [] }),
        ownerAPI.getTopProducts({ limit: 5 }),
      ]);

      setTodayStats(todayRes.data);

      if (period !== 'today' && Array.isArray(periodRes.data) && periodRes.data.length) {
        const rows = periodRes.data;
        setChartData({
          labels:   rows.map(r => r.day?.slice(5) || ''),
          datasets: [{ data: rows.map(r => parseFloat(r.revenue) || 0) }],
        });
      } else {
        setChartData(null);
      }

      setTopProducts(topRes.data || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, [period]));

  function onRefresh() {
    setRefreshing(true);
    load(true);
  }

  if (loading && !refreshing) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const st = todayStats;

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />}
    >
      {/* Dövr seçici */}
      <View style={s.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[s.periodBtn, period === p.key && s.periodActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[s.periodText, period === p.key && s.periodActiveText]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bu günün statistikası */}
      {st && (
        <View style={s.statsGrid}>
          <StatCard
            title="Tamamlanan"
            value={st.completed_count || 0}
            sub={`${st.today_cancelled || 0} ləğv`}
            color="#4361EE"
          />
          <StatCard
            title="Ümumi gəlir"
            value={`${parseFloat(st.total_revenue || 0).toFixed(2)} ₼`}
            color="#FF6B35"
          />
          <StatCard
            title="💵 Nağd"
            value={`${parseFloat(st.cash_revenue || 0).toFixed(2)} ₼`}
            color="#2DC653"
          />
          <StatCard
            title="💳 Kart"
            value={`${parseFloat(st.card_revenue || 0).toFixed(2)} ₼`}
            color="#7C3AED"
          />
        </View>
      )}

      {/* Həftəlik/aylıq qrafik */}
      {chartData && (
        <View style={s.chartCard}>
          <Text style={s.sectionTitle}>
            {period === 'week' ? 'Həftəlik' : 'Aylıq'} gəlir qrafiki (₼)
          </Text>
          <LineChart
            data={chartData}
            width={width - 48}
            height={200}
            chartConfig={CHART_CONFIG}
            bezier
            withInnerLines={false}
            style={{ borderRadius: 12 }}
          />
        </View>
      )}

      {/* Ən çox satılanlar */}
      {topProducts.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>🏆 Ən çox satılanlar</Text>
          {topProducts.map((p, i) => (
            <View key={i} style={s.topItem}>
              <Text style={[s.rank, i < 3 && s.rankGold]}>#{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.topName}>{p.product_name}</Text>
                <View style={s.topBar}>
                  <View style={[s.topBarFill, {
                    width: `${(parseInt(p.total_sold) / (parseInt(topProducts[0]?.total_sold) || 1)) * 100}%`,
                  }]} />
                </View>
              </View>
              <Text style={s.topSold}>{p.total_sold} ədəd</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function StatCard({ title, value, sub, color }) {
  return (
    <View style={[s.statCard, { borderTopColor: color }]}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statTitle}>{title}</Text>
      {sub ? <Text style={s.statSub}>{sub}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F8F9FA', padding: 16 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  periodRow:   { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodBtn:   { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#E9ECEF', alignItems: 'center', backgroundColor: '#fff' },
  periodActive:{ borderColor: '#FF6B35', backgroundColor: '#FF6B3511' },
  periodText:  { fontSize: 13, fontWeight: '600', color: '#6C757D' },
  periodActiveText: { color: '#FF6B35' },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard:    { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderTopWidth: 3, elevation: 2 },
  statValue:   { fontSize: 20, fontWeight: '800', color: '#212529' },
  statTitle:   { fontSize: 12, color: '#6C757D', marginTop: 4 },
  statSub:     { fontSize: 11, color: '#ADB5BD', marginTop: 2 },
  chartCard:   { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  section:     { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle:{ fontSize: 15, fontWeight: '700', marginBottom: 12, color: '#212529' },
  topItem:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  rank:        { fontSize: 14, fontWeight: '800', color: '#ADB5BD', width: 28 },
  rankGold:    { color: '#FF6B35' },
  topName:     { fontSize: 13, fontWeight: '600', color: '#212529', marginBottom: 4 },
  topBar:      { height: 5, backgroundColor: '#F1F3F5', borderRadius: 3, overflow: 'hidden' },
  topBarFill:  { height: '100%', backgroundColor: '#FF6B35', borderRadius: 3 },
  topSold:     { fontSize: 12, fontWeight: '700', color: '#FF6B35', minWidth: 55, textAlign: 'right' },
});
