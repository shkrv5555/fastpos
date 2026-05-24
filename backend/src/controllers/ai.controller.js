import Anthropic from '@anthropic-ai/sdk';
import pool from '../config/database.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getBusinessContext() {
  const [sales, topProducts, lowStock, recentOrders] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='completed' AND DATE(created_at)=CURRENT_DATE)              AS today_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE status='completed'
          AND DATE(created_at)=CURRENT_DATE), 0)                                                  AS today_revenue,
        COUNT(*) FILTER (WHERE status='completed'
          AND created_at >= NOW()-INTERVAL '7 days')                                              AS week_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE status='completed'
          AND created_at >= NOW()-INTERVAL '7 days'), 0)                                          AS week_revenue,
        COUNT(*) FILTER (WHERE status='completed'
          AND EXTRACT(MONTH FROM created_at)=EXTRACT(MONTH FROM NOW())
          AND EXTRACT(YEAR FROM created_at)=EXTRACT(YEAR FROM NOW()))                             AS month_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE status='completed'
          AND EXTRACT(MONTH FROM created_at)=EXTRACT(MONTH FROM NOW())
          AND EXTRACT(YEAR FROM created_at)=EXTRACT(YEAR FROM NOW())), 0)                         AS month_revenue,
        COUNT(*) FILTER (WHERE status='cancelled' AND DATE(created_at)=CURRENT_DATE)              AS today_cancelled,
        COALESCE(AVG(total_amount) FILTER (WHERE status='completed'
          AND DATE(created_at)=CURRENT_DATE), 0)                                                  AS avg_order_today
      FROM orders
    `),
    pool.query(`SELECT product_name, total_sold, total_revenue, order_count
      FROM top_selling_products LIMIT 10`),
    pool.query(`SELECT name, stock_qty, segment FROM products
      WHERE stock_qty < 10 AND is_available=TRUE ORDER BY stock_qty`),
    pool.query(`SELECT DATE(created_at) AS day,
        COUNT(*) FILTER (WHERE status='completed') AS orders,
        COALESCE(SUM(total_amount) FILTER (WHERE status='completed'), 0) AS revenue
      FROM orders
      WHERE created_at >= NOW()-INTERVAL '14 days'
      GROUP BY DATE(created_at) ORDER BY day`),
  ]);

  const s = sales.rows[0];
  return {
    today: {
      orders:    parseInt(s.today_orders),
      revenue:   parseFloat(s.today_revenue).toFixed(2),
      cancelled: parseInt(s.today_cancelled),
      avgOrder:  parseFloat(s.avg_order_today).toFixed(2),
    },
    week:  { orders: parseInt(s.week_orders),  revenue: parseFloat(s.week_revenue).toFixed(2)  },
    month: { orders: parseInt(s.month_orders), revenue: parseFloat(s.month_revenue).toFixed(2) },
    topProducts: topProducts.rows,
    lowStock: lowStock.rows,
    dailyTrend: recentOrders.rows,
  };
}

export const chat = asyncHandler(async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new HttpError(503, 'AI_NOT_CONFIGURED');
  }

  const { messages } = req.body;
  const ctx = await getBusinessContext();

  const systemPrompt = `Sən FastPOS restoranının AI biznes köməkçisisən. Sahibin suallarını Azərbaycan dilində cavablandır. Yalnız biznes məlumatlarına istinad edərək cavab ver.

## Cari Vəziyyət (${new Date().toLocaleDateString('az-AZ')})

**Bu gün:**
- Tamamlanan sifariş: ${ctx.today.orders}
- Ləğv edilən: ${ctx.today.cancelled}
- Gəlir: ${ctx.today.revenue} ₼
- Orta sifariş dəyəri: ${ctx.today.avgOrder} ₼

**Bu həftə:** ${ctx.week.orders} sifariş · ${ctx.week.revenue} ₼
**Bu ay:** ${ctx.month.orders} sifariş · ${ctx.month.revenue} ₼

**Ən çox satılan 10 məhsul:**
${ctx.topProducts.map((p, i) => `${i + 1}. ${p.product_name} — ${p.total_sold} ədəd, ${parseFloat(p.total_revenue).toFixed(2)} ₼`).join('\n')}

**Stokda az qalan məhsullar (10-dan az):**
${ctx.lowStock.length > 0 ? ctx.lowStock.map(p => `- ${p.name}: ${p.stock_qty} ədəd (${p.segment})`).join('\n') : 'Hamısı kifayətdir'}

**Son 14 günün trendı:**
${ctx.dailyTrend.map(d => `${d.day}: ${d.orders} sifariş, ${parseFloat(d.revenue).toFixed(2)} ₼`).join('\n')}

## Qaydalar
- Həmişə Azərbaycan dilində cavab ver
- Qısa, konkret məlumat ver
- Tövsiyə istəsə, data əsasında izah et
- Biznesin xaricindəki suallara: "Yalnız biznes sualarını cavablandıra bilərəm" de`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
    messages: messages.slice(-10),  // Son 10 mesaj (kontekst limiti üçün)
  });

  res.json({
    reply: response.content[0].text,
    inputTokens:  response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheHit: response.usage.cache_read_input_tokens > 0,
  });
});
