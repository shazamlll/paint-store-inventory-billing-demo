# 系统架构

## 架构概览

工程是一个 Next.js App Router 应用，部署目标是 Cloudflare Workers，数据和认证依赖 Supabase。

```text
Browser
  |
  | Supabase Auth session
  v
Next.js App Router pages
  |
  | read: browser Supabase client
  | write: Next API route + Bearer token
  v
Business modules in src/
  |
  | validation, store gate, payload mapping
  v
Supabase tables / RPC / RLS
```

### 主要分层

- 页面层：`app/**/page.js` 和各 Client component。
- 应用壳：`app/AppShell.js`，负责登录 gate、门店权限 gate、侧边栏导航。
- API 层：`app/api/**/route.js`，负责认证、读取门店上下文、调用持久化模块。
- 业务层：`src/*.js`，负责业务校验、金额/库存计算、持久化 payload、文案和状态转换。
- 数据层：`supabase/migrations/*.sql`，包含表结构、RLS、事务 RPC、审计触发器和门店 onboarding RPC。
- 测试层：`test/*.test.js`，覆盖业务函数、页面源码约束、迁移文本和部署配置。

## 业务页面地图

当前业务页面都在 `app/` 下：

| 路由 | 页面 | 目的 |
| --- | --- | --- |
| `/login` | `app/login/page.js` | Supabase Auth 登录/登出 |
| `/` | `app/page.js` | 登录后的工作台入口 |
| `/dashboard` | `app/dashboard/page.js` | 今日经营看板 |
| `/products` | `app/products/page.js` | 商品列表和库存概览 |
| `/products/editor` | `app/products/editor/page.js` | 商品新增/编辑 |
| `/customers` | `app/customers/page.js` | 客户列表、应收扫描 |
| `/sales` | `app/sales/page.js` | 销售开单、已保存销售单、销售单明细 |
| `/sales/print` | `app/sales/print/page.js` | 当前销售单浏览器打印页 |
| `/purchases` | `app/purchases/page.js` | 采购入库 |
| `/inventory` | `app/inventory/page.js` | 库存流水 |
| `/inventory/low-stock` | `app/inventory/low-stock/page.js` | 低库存提醒 |
| `/inventory/adjustments` | `app/inventory/adjustments/page.js` | 手工库存调整 |
| `/reports/daily` | `app/reports/daily/page.js` | 每日报表和打印 |
| `/search` | `app/search/page.js` | 全局搜索 |

导航文案和分组在 `src/ux-copy.js`，权限过滤由 `src/store-context.js` 控制。

## 认证和门店上下文

`src/auth.js` 定义两类路由：

- public route：当前只有 `/login`。
- operational routes：商品、客户、销售、采购、库存、报表、搜索、看板。

`app/AppShell.js` 在浏览器端：

1. 创建 Supabase browser client。
2. 读取当前 Supabase Auth session。
3. 对非登录页执行 auth gate。
4. 登录后调用 `loadStoreContext()` 读取 `store_members`。
5. 根据角色过滤导航，并阻止不允许访问的页面。

`src/store-context.js` 目前支持的角色：

- `owner`: 可访问全部业务页面。
- `clerk`: 可访问看板、销售、采购、库存、商品、客户、搜索；不可访问库存调整和报表。
- `accountant`: 可访问看板和报表；不可访问销售、采购、库存、商品、客户、搜索。

注意：前端导航过滤只是体验层。写入接口仍必须在服务端重新读取用户和门店上下文。

## 数据读取

业务页面通过 `app/useDatabasePageData.js` 读取数据库数据。它使用浏览器 Supabase client 调用 `src/development-page-reads.js`。

读取覆盖：

- `stores`
- `products`
- `customers`
- `suppliers`
- `sales_orders`
- `sales_order_items`
- `purchase_orders`
- `purchase_order_items`
- `inventory_movements`

读取层保留了「配置缺失」「读取失败」「空数据」状态。接手时要注意：这个模块名称仍带 `development`，反映它最早用于开发/试点读取；如果进入正式生产阶段，可以考虑重命名或拆分为生产数据读取层。

## 写入流程

写入统一走 Next API route，不允许浏览器直接写 Supabase 表。

通用模式：

1. 页面通过 Supabase Auth session 取 access token。
2. 页面 `fetch("/api/...")`，带 `Authorization: Bearer <token>`。
3. API route 用 `createServerSupabaseClient({ authorization })` 创建服务端 client。
4. API route 调 `client.auth.getUser()` 校验会话。
5. API route 调 `loadStoreContext()` 得到 active store 和 role。
6. API route 调用对应 `src/*-persistence.js`。
7. 业务模块校验 role、store、payload，再写表或调用 RPC。

主要写入模块：

- `src/catalog-persistence.js`: 商品、客户、供应商写入。
- `src/sales-persistence.js`: 销售单事务，调用 Supabase RPC `save_sales_order_transaction`。
- `src/purchase-persistence.js`: 采购入库事务，调用 Supabase RPC `save_purchase_order_transaction`。
- `src/inventory-adjustment-persistence.js`: 手工库存调整，更新商品库存并新增库存流水。

## 数据库迁移

迁移文件按能力递进：

| 文件 | 内容 |
| --- | --- |
| `0001_initial_schema.sql` | MVP 基础表 |
| `0002_multi_tenant_rls.sql` | 门店隔离、`store_id`、RLS |
| `0003_sales_order_transaction.sql` | 销售单事务 RPC |
| `0004_purchase_order_transaction.sql` | 采购入库事务 RPC |
| `0005_audit_correction_foundation.sql` | 审计日志、纠正规则、销售单冲销基础 |
| `0006_store_onboarding.sql` | 门店和 owner membership provisioning |

RLS 和 store context 是本项目能走向多门店复用的核心。任何新增写入都应优先确认：是否由服务端控制 `store_id`，是否经过 RLS，是否有测试覆盖跨店隔离。

## 部署结构

部署目标是 Cloudflare Workers + OpenNext：

- `package.json`
  - `npm run build`: Next.js build
  - `npm run cloudflare:build`: OpenNext Cloudflare build
  - `npm run preview`: Cloudflare 本地预览
  - `npm run deploy`: Wrangler deploy
- `wrangler.jsonc`
  - Worker main: `.open-next/worker.js`
  - assets: `.open-next/assets`
  - custom domain: `app.example.com`
- `open-next.config.ts`
  - OpenNext Cloudflare adapter 配置入口

Supabase 仍负责数据库、Auth、RLS 和 RPC。不要把 Supabase service-role key、数据库直连串或迁移管理员凭证放进 Cloudflare public env。

## 当前边界

已实现：

- 真实 Supabase Auth 登录路径。
- 门店上下文和角色导航。
- 商品/客户/供应商服务端写入。
- 销售、采购、库存调整服务端写入。
- 审计迁移和纠正规则基础。
- Cloudflare 部署配置。

仍待实现或硬化：

- 32 开预印双联销售单打印模板。
- 独立客户收款、付款分配、收款冲销/退款。
- 采购单冲销事务。
- owner/admin 审计日志查看页。
- 备份、恢复、监控、错误上报和商业 go/no-go。
- 可视化 onboarding/admin console。
