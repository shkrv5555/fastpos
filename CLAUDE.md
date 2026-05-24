# FastPOS — Claude Code Layihə Sənədi

> Bu fayl Claude Code üçün yazılıb — layihənin tam istinad mənbəyidir.

---

## 📋 Layihə Xülasəsi

**FastPOS** — Restoran / fast-food müəssisəsi üçün tam idarəetmə sistemi.
Üç hissəli: Müştəri interfeysi, İşçi dashboardı, Sahibin mobil tətbiqi.

---

## 🏗️ Ümumi Memarlıq

```
┌─────────────────────────────────────────────────────────┐
│  MÜŞTƏRI WEB (React + Vite)                             │
│  → Menyü görüntüsü, Səbət, Sifariş statusu             │
│  → /customer/* route-ları                               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌─────────────────────────────────────────────────────────┐
│  İŞÇİ WEB DASHBOARD (React + Vite) — eyni app           │
│  → HR kodu ilə giriş                                    │
│  → Sifarişlər, Stok, Redaktə icazəsi                    │
│  → /employee/* route-ları                               │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS + WSS (Socket.io)
                       ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND (Node.js + Express + Socket.io)                │
│  → REST API + real-time events                          │
│  → JWT auth (owner + employee)                          │
└──────────────────────┬──────────────────────────────────┘
                       │ PostgreSQL TLS
                       ▼
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL (Neon serverless)                           │
│  → 12 cədvəl + views                                    │
└─────────────────────────────────────────────────────────┘
                       ▲
┌─────────────────────────────────────────────────────────┐
│  SAHİBİN MOBİL TƏTBİQİ (React Native + Expo)           │
│  → Qrafiklər, Məhsullar, Endirimlər, HR                 │
│  → Claude AI chatbot                                    │
│  → Xüsusi username + şifrə ilə giriş                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Layihə Strukturu

```
fastpos/
├── CLAUDE.md
├── .gitignore
│
├── backend/                      Node.js + Express + Socket.io
│   ├── server.js                 Entry point
│   ├── package.json
│   ├── .env.example
│   ├── database/
│   │   ├── schema.sql            Tam DB sxemi
│   │   ├── seed.js               Demo məlumatlar
│   │   └── migrations/           İnkremental dəyişikliklər
│   └── src/
│       ├── config/
│       │   ├── database.js       pg Pool + transaction()
│       │   └── socket.js         Socket.io init + auth
│       ├── middleware/
│       │   ├── auth.js           authenticate, requireRole
│       │   └── errorHandler.js   Global error handler
│       ├── models/               DB sorğu qatları
│       │   ├── Product.js
│       │   ├── Order.js
│       │   ├── User.js
│       │   ├── Discount.js
│       │   ├── Stock.js
│       │   └── EditRequest.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── products.controller.js
│       │   ├── orders.controller.js
│       │   ├── employee.controller.js
│       │   ├── owner.controller.js
│       │   └── ai.controller.js      Claude API chatbot
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── products.routes.js
│       │   ├── orders.routes.js
│       │   ├── employee.routes.js    /api/employee/*
│       │   ├── owner.routes.js       /api/owner/*
│       │   └── ai.routes.js          /api/ai/*
│       └── sockets/
│           └── orders.handler.js     Real-time sifariş event-ləri
│
├── web/                          Müştəri + İşçi (React 18 + Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               BrowserRouter + Redux + AppRouter
│       ├── api/
│       │   ├── client.js         Axios + interceptors
│       │   └── endpoints.js      Bütün API çağırışları
│       ├── store/
│       │   ├── index.js
│       │   └── slices/
│       │       ├── authSlice.js
│       │       ├── cartSlice.js          Səbət + qiymət hesabı
│       │       ├── ordersSlice.js
│       │       └── uiSlice.js
│       ├── hooks/
│       │   └── useSocket.js      Socket.io + Redux
│       ├── routes/
│       │   └── AppRouter.jsx     Role-based lazy routing
│       ├── pages/
│       │   ├── customer/
│       │   │   ├── Menu.jsx          Menyü (3 seqment: Sadə/Fast/Premium)
│       │   │   ├── OrderStatus.jsx   Real-time status izlə
│       │   │   └── Menu.css
│       │   ├── employee/
│       │   │   ├── EmployeeLogin.jsx
│       │   │   ├── Orders.jsx        Sifarişlər + Ödəniş tipini seç
│       │   │   ├── StockIntake.jsx   Stok daxil et
│       │   │   └── EditRequest.jsx   Məhsul redaktə icazəsi
│       │   └── auth/
│       │       └── Login.jsx
│       ├── components/
│       │   ├── customer/
│       │   │   ├── ProductCard.jsx   Şəkil + qiymət + endirim + inqredientlər
│       │   │   ├── CartPanel.jsx     Sliding cart + avtomatik qiymət
│       │   │   ├── SegmentTabs.jsx   Sadə / Fast / Premium tablar
│       │   │   └── OrderStatusBadge.jsx
│       │   ├── employee/
│       │   │   ├── OrderCard.jsx     Sifariş kartı + aksiyalar
│       │   │   └── PaymentModal.jsx  Nağd / Nağdsız seçim
│       │   └── ui/
│       │       ├── Button.jsx
│       │       ├── Modal.jsx
│       │       └── Badge.jsx
│       └── styles/
│           └── global.css
│
└── mobile/                       Sahibin tətbiqi (React Native + Expo)
    ├── package.json
    ├── app.json
    ├── App.jsx                   Navigation container
    └── src/
        ├── api/
        │   ├── client.js
        │   └── endpoints.js
        ├── store/
        │   ├── index.js
        │   └── slices/
        │       ├── authSlice.js
        │       └── uiSlice.js
        ├── navigation/
        │   ├── AppNavigator.jsx      Stack + Tab navigasiya
        │   └── TabNavigator.jsx
        ├── screens/
        │   ├── auth/
        │   │   └── LoginScreen.jsx   Owner username+şifrə
        │   ├── dashboard/
        │   │   └── DashboardScreen.jsx  Günlük/həftəlik/aylıq qrafiklər
        │   ├── products/
        │   │   ├── ProductsScreen.jsx
        │   │   └── ProductEditScreen.jsx
        │   ├── discounts/
        │   │   └── DiscountsScreen.jsx
        │   ├── employees/
        │   │   └── EmployeesScreen.jsx  HR kodlar
        │   ├── analytics/
        │   │   └── AnalyticsScreen.jsx  Ən çox satılanlar + AI tövsiyə
        │   ├── editRequests/
        │   │   └── EditRequestsScreen.jsx  İşçi icazə sorğuları
        │   └── chatbot/
        │       └── ChatbotScreen.jsx    Claude AI chatbot
        ├── components/
        │   ├── charts/
        │   │   └── SalesChart.jsx
        │   └── ui/
        └── hooks/
            └── useSocket.js
```

---

## 🗄️ Database Schema

### Cədvəllər

| Cədvəl | Açıqlama |
|---|---|
| `users` | owner + employee (rol enum) |
| `categories` | Məhsul kateqoriyaları |
| `products` | Məhsullar (seqment: simple/fast/premium) |
| `ingredients` | İnqredientlər master siyahısı |
| `product_ingredients` | Məhsul ↔ inqredient (many-to-many) |
| `discounts` | Endirimler (percentage/fixed, tarix aralığı) |
| `orders` | Sifarişlər (status: pending→confirmed→preparing→ready→completed) |
| `order_items` | Sifariş məhsulları (snapshot qiymətlər) |
| `stock_intakes` | İşçi stok daxiletmə qeydləri |
| `edit_requests` | Məhsul redaktə icazəsi (işçi → sahib) |
| `notifications` | Push bildirişlər |
| `sessions` | Müştəri sesiya ID-ləri (anonim sifariş üçün) |

### Views
| View | Açıqlama |
|---|---|
| `products_with_discount` | Aktiv endirim qiymətini avtomatik hesabla |
| `order_stats` | Günlük/aylıq satış statistikası |
| `top_selling_products` | Ən çox satılan məhsullar |

---

## 🔌 Əsas API Endpoint-ləri

### Public (Müştəri)
```
GET  /api/products              Menyü (seqment, kateqoriya, endirim ilə)
GET  /api/products/:id          Məhsul detalı + inqredientlər
POST /api/orders                Yeni sifariş yarat
GET  /api/orders/:id/status     Sifariş statusu izlə
```

### Employee (HR kodu ilə)
```
POST /api/auth/employee-login   HR kodu ilə giriş
GET  /api/employee/orders       Aktiv sifarişlər
PATCH /api/employee/orders/:id/confirm    Sifarişi təsdiqlə + ödəniş tipi
PATCH /api/employee/orders/:id/status    Status yenilə
POST /api/employee/stock        Stok daxil et
POST /api/employee/edit-requests  Redaktə icazəsi sorğusu
```

### Owner (Username+şifrə)
```
POST /api/auth/owner-login
GET  /api/owner/stats           Günlük/həftəlik/aylıq statistika
GET  /api/owner/products        Bütün məhsullar
POST /api/owner/products        Yeni məhsul
PUT  /api/owner/products/:id    Məhsulu redaktə et
DELETE /api/owner/products/:id  Məhsulu sil
GET  /api/owner/discounts       Endirimlər
POST /api/owner/discounts       Yeni endirim
PUT  /api/owner/discounts/:id   Endirimi dəyiş
GET  /api/owner/employees       İşçilər (HR kodlar)
POST /api/owner/employees       Yeni işçi
PUT  /api/owner/employees/:id   İşçi məlumatı dəyiş
PATCH /api/owner/employees/:id/block  Blokla/aç
DELETE /api/owner/employees/:id
GET  /api/owner/edit-requests   Redaktə icazəsi sorğuları
PATCH /api/owner/edit-requests/:id/approve  Təsdiqlə
PATCH /api/owner/edit-requests/:id/reject   Rədd et
GET  /api/owner/top-products    Ən çox satılanlar
POST /api/ai/chat               Claude AI chatbot
```

---

## ⚡ Real-time Socket.io Events

### Server → Müştəri
- `order:status-changed { orderId, status }` — sifariş statusu dəyişdi

### Server → İşçi
- `order:new { order }` — yeni sifariş gəldi

### Server → Owner (mobil)
- `notification:edit-request { request }` — işçi redaktə icazəsi istədi
- `order:stats-update { stats }` — canlı satış statistikası

---

## 🎨 Seqmentlər

| Seqment | Müştəriyə göstərilən | Xüsusiyyət |
|---|---|---|
| `simple` | Sadə görünüş — bütün məhsullar | Standart menyü |
| `fast` | Ən çox satılan məhsullar önündə | Populyarlığa görə sıralanır |
| `premium` | AI analitika + tövsiyələr | Data-driven sıralama |

---

## 🤖 AI Chatbot (Claude API)

- **Model:** claude-sonnet-4-6
- **Kontekst:** Biznes məlumatları (satış, stok, məhsullar)
- **Nümunə suallar:**
  - "Bu həftə ən çox nə satılıb?"
  - "Hansı məhsulun stoku az qalıb?"
  - "Bu ayın ümumi gəliri nədir?"
  - "Cümə axşamlarında hansı məhsullar daha çox satılır?"

---

## 🔐 Auth Arxitekturası

| Rol | Giriş | Token |
|---|---|---|
| Owner | username + password | JWT (24h) + refresh (7d) |
| Employee | HR kod | JWT (8h — iş günü) |
| Customer | Sessiya ID (anonim) | Cookie/localStorage session |

---

## ⚠️ Önəmli Qaydalar

- **Kommentlər Azərbaycan dilində**
- **ES Modules** (`import/export`)
- **Path aliases** frontend-də: `@api`, `@store`, `@pages`, `@components`
- **CSS faylları git-ə mütləq əlavə et** (Vercel build issue)
- **İşçi stoku artıra bilər** — azalda bilməz (owner razılığı lazım)
- **Sifariş qiymətləri snapshot** — dəyişsə də köhnə qiymətlə qalır
- **edit_requests tablosunda JSONB** — nə dəyişdirildiyini saxla

---

**Yaradılma tarixi:** 2026-05-24
**Status:** 🔨 Arxitektura mərhələsi
