# 交接清单

本文用于项目交接、上线前检查和后续开发启动。

## 接手开发者第一小时

- 阅读 `reference/README.md`。
- 阅读 `reference/architecture.md`。
- 运行 `npm test`。
- 运行 `npm run build`。
- 查看 `docs/sprints/day037_to_day046_production_roadmap.md`。
- 查看 `graphify-out/GRAPH_REPORT.md` 和 `graphify-out/graph.html`，了解代码关系图。

## 本地运行

1. 安装 Node.js 20 或更高版本。
2. 安装依赖：

```bash
npm install
```

3. 配置环境变量：

```text
NEXT_PUBLIC_SUPABASE_URL=<Supabase project root URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon public key>
```

4. 启动开发服务器：

```bash
npm run dev
```

5. 打开 `/login`，使用 Supabase Auth 账号登录。

## 数据库检查

确认 Supabase 已应用这些迁移：

- `0001_initial_schema.sql`
- `0002_multi_tenant_rls.sql`
- `0003_sales_order_transaction.sql`
- `0004_purchase_order_transaction.sql`
- `0005_audit_correction_foundation.sql`
- `0006_store_onboarding.sql`

确认基础数据：

- 至少一个 `stores` 记录。
- 登录用户在 `store_members` 中有 active membership。
- 商品、客户、供应商有可用于开单的记录。
- RLS 能阻止跨店读取和写入。

## 部署检查

Cloudflare Workers 部署相关文件：

- `package.json`
- `wrangler.jsonc`
- `open-next.config.ts`

部署命令：

```bash
npm run cloudflare:build
npm run deploy
```

部署环境变量：

```text
NEXT_PUBLIC_SUPABASE_URL=<Supabase project root URL, no /rest/v1/>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon public key>
```

禁止配置：

- Supabase service-role key
- direct database URL
- migration/admin secret

## 上线前 smoke test

至少执行以下检查：

- 未登录访问 `/products` 会进入登录 gate。
- `/login` 能正常登录和登出。
- 登录后侧边栏显示当前门店和角色。
- 商品新增成功，并且只属于当前门店。
- 客户新增成功。
- 销售开单成功，库存减少，销售单能在列表中看到。
- 采购入库成功，库存增加。
- 库存调整成功，库存流水增加。
- 每日报表能读取当天销售和库存数据。
- Cloudflare Worker 自定义域名 `app.example.com` 可访问。
- 浏览器控制台没有明显运行时错误。

## 仍需补齐的关键功能

### 打印模板

目标：

- 32 开纸张。
- OKI MICROLINE 5200F 实机打印。
- 预印单据字段定位。
- 客户联/存根联双联输出。

需要资料：

- 纸张实际宽高，单位 mm。
- 预印单扫描件或平铺照片。
- 字段位置。
- 两联方式：同页两份，还是无碳复写。
- 实机打印偏移量。

### 独立收款

目标：

- 按客户录入收款。
- 分配到一张或多张销售单。
- 更新客户应收。
- 支持冲销、退款、作废。
- 写入审计日志。

### 备份和恢复

目标：

- 明确 Supabase 备份策略。
- 定期恢复演练。
- 记录恢复步骤和责任人。
- 明确误操作后的恢复边界。

### 监控和错误上报

目标：

- Worker 部署健康检查。
- 前端运行时错误捕捉。
- API/RPC 错误可追踪。
- 关键写入失败能被发现。

### Onboarding/admin tooling

目标：

- 创建新门店。
- 创建或邀请 owner。
- 绑定 owner membership。
- 导入初始商品、客户、供应商、库存、应收。
- 验证门店隔离。

## 变更原则

新增能力时保持这些原则：

- 业务规则先放 `src/`，不要散在页面组件里。
- 写入必须通过 API route 或服务端动作。
- `store_id` 由服务端确定。
- 多表写入尽量放在 Supabase RPC 事务中。
- 每个新增功能都要有测试和 sprint 文档。
- 不要在 public env 中放 secret。
- 不要把开发 fallback 包装成生产能力。

## 推荐下一步

如果目标是让店主先真实使用，优先级建议：

1. 销售单 32 开双联打印模板。
2. owner-production smoke test 和备份方案。
3. 独立客户收款。
4. 审计日志查看页。
5. Onboarding/admin 最小操作台。
