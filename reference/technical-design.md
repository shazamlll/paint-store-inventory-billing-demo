# 技术设计理念和亮点

## 设计目标

项目的目标不是做一个泛用 ERP，而是先服务小型涂料门店最核心的经营闭环：

```text
商品资料 + 往来方资料
  -> 销售开单 / 采购入库 / 库存调整
  -> 库存流水 / 应收应付 / 每日报表
```

因此代码里大量设计选择都围绕三个原则：

1. 开单驱动库存和应收，不让库存成为孤立表格。
2. 服务端控制门店和权限，不信任浏览器传来的 `store_id`。
3. 每个阶段都保留清晰边界，避免把 demo 能力误当成生产完成。

## 亮点一：业务函数和 UI 分离

核心计算大多放在 `src/`：

- `src/sales-form.js`: 销售单草稿、行项目、合计、付款状态。
- `src/purchase-form.js`: 采购单草稿、行项目、合计、付款状态。
- `src/inventory.js`: 销售扣库存、采购加库存、库存流水汇总。
- `src/payment-status.js`: 收款状态汇总。
- `src/daily-report.js`: 每日报表数据和 Markdown 格式化。
- `src/search.js`: 全局搜索。

页面组件主要负责展示、输入和调用 API。这种分离让 Node tests 可以直接覆盖业务规则，不依赖浏览器。

## 亮点二：服务端事务边界清楚

销售和采购不是在浏览器里逐表写入，而是：

- 浏览器提交 draft。
- API route 校验 session 和 store context。
- `src/*-persistence.js` 生成受控 payload。
- Supabase RPC 在数据库侧完成多表一致写入。

销售事务覆盖：

- sales order header
- sales order items
- payment state
- receivable delta
- stock deduction
- inventory movements

采购事务覆盖：

- purchase order header
- purchase order items
- payment state
- payable delta
- stock increase
- inventory movements

这样可以避免半张单据写入成功、库存流水失败等不一致状态。

## 亮点三：门店隔离前置

`store_id` 不是由浏览器自由传入。写入前会读取当前用户的 `store_members`，然后由服务端把 active store 注入 payload。

相关模块：

- `src/store-context.js`
- `src/catalog-persistence.js`
- `src/sales-persistence.js`
- `src/purchase-persistence.js`
- `src/inventory-adjustment-persistence.js`

这个设计让项目未来可以扩展多门店/多客户 SaaS，而不是后期再补隔离。

## 亮点四：权限既有 UI 层，也有写入层

UI 层：

- `AppShell` 根据角色过滤导航。
- 未登录用户被导向 `/login`。
- 没有门店或角色不允许时显示 gate panel。

写入层：

- 销售、采购、库存调整会检查 role。
- 目录写入会检查 store context。
- 数据库 RLS 仍是最后一道边界。

这种多层防线避免只靠前端隐藏按钮。

## 亮点五：文档和测试记录边界

项目不是只看代码。`docs/sprints/` 记录了每个阶段的完成范围和未完成事项。很多测试会检查文档存在和关键边界文本，防止后续开发不小心把生产声明说过头。

典型边界：

- 当前不是完整商业 SaaS。
- 独立客户收款仍延期。
- 打印模板仍未适配 32 开预印双联。
- 备份、监控、恢复和商业 go/no-go 仍待硬化。

## 亮点六：Cloudflare 和 Supabase 职责清晰

当前部署决策：

- Cloudflare Workers: Next.js 应用运行和域名入口。
- Cloudflare DNS: `app.example.com`。
- Supabase: 数据库、Auth、RLS、RPC、迁移。
- GitHub: 源码和部署来源。

没有把数据库迁到 Cloudflare D1/KV，也没有把 Supabase Auth 替换为 Cloudflare Access。这样减少迁移风险，保留已有 RLS/RPC 投入。

## 刻意保留的约束

### 不在浏览器直接写业务表

浏览器直接 Supabase `.insert()` 或 `.update()` 会让权限和 `store_id` 控制散落在 UI 中。当前设计统一通过 API route 和 `src/*-persistence.js` 收敛。

### 不急着实现完整财务系统

当前重点是门店经营闭环，不是总账、发票、税务或完整财务软件。独立收款和冲销是下一阶段关键，但仍应围绕小门店真实收款习惯来设计。

### 不把样例/开发 fallback 当生产能力

项目历史上有本地样例和开发读取路径。当前产品界面已尽量收敛到真实 Supabase 登录和数据库读取，但接手者仍应注意名称和文档里的 `development` 边界。

### 不把打印先做成复杂 PDF 系统

当前打印从浏览器打印开始。对于 OKI MICROLINE 5200F 这类针式打印机和预印单，第一优先级是 mm 尺寸、字段定位、双联/复写方式和实机偏移校准。PDF 可以后续再评估。

## 新功能开发建议

新增功能时建议按这个顺序：

1. 先写 `docs/superpowers/specs/` 设计，明确范围和非目标。
2. 再写 `docs/superpowers/plans/` 实施计划。
3. 先加测试，覆盖业务规则、页面约束、接口边界或迁移文本。
4. 业务规则放在 `src/`，页面只做交互。
5. API route 只做认证、上下文装配和调用业务模块。
6. `store_id` 一律服务端控制。
7. 跨多表一致写入优先使用 Supabase RPC。
8. 更新 `docs/sprints/`，记录完成范围和剩余边界。

## 当前最容易踩的坑

- 误以为 `/sales/print` 已经支持真实 32 开套打。它还没有。
- 误以为销售单已收款等同完整收款系统。独立收款和分配还没有。
- 在前端新增 Supabase 直写，绕过服务端 store gate。
- 在文案里宣称可商业化，但备份、监控、恢复、打印和收款仍未完成。
- 使用 Cloudflare public env 保存 service-role key 或数据库密码。
- 新增跨店数据读写时只靠前端过滤，没有 RLS/服务端校验。
