# 项目交接参考

本目录用于让新接手的人快速理解当前工程。建议先读本文件，再按职责阅读其它文档。

## 项目一句话

这是一个面向小型涂料/建材门店的进销存开单系统。业务主线是：商品和往来方资料进入系统后，销售开单、采购入库、库存调整会驱动库存流水、应收应付和每日报表。

## 当前状态

项目已经从本地演示 MVP 演进到 owner-production 准备阶段：

- Next.js App Router 前端已经按真实门店操作页面组织。
- Supabase Auth 已接入，除 `/login` 外的业务页面需要登录。
- 门店上下文和角色导航已接入，写接口通过服务端读取 `store_members`。
- 商品、客户、供应商可以通过服务端 API 写入 Supabase。
- 销售单、采购入库、库存调整已有服务端写入路径。
- Cloudflare Workers + OpenNext 部署配置已经在仓库中。

但项目仍不能被描述为完整商业 SaaS：

- 独立客户收款、收款分配、收款冲销还没有实现。
- 销售单 32 开预印双联打印模板还没有实现。
- 备份、监控、错误上报、恢复演练和商业 go/no-go 仍需要硬化。
- 多客户 onboarding 有后端流程和文档，但没有完整管理后台。

## 文档索引

- [系统架构](./architecture.md)
  说明目录结构、页面层、业务层、Supabase 数据层、权限和部署边界。
- [接口文档](./api.md)
  说明当前 Next API routes、认证方式、请求/响应约定和错误边界。
- [客户操作 SOP](./customer-sop.md)
  说明门店老板/店员日常操作顺序，以及试点前后的建议流程。
- [技术设计理念和亮点](./technical-design.md)
  说明为什么这样设计、哪些约束被刻意保留、哪些点是项目亮点。
- [交接清单](./handoff-checklist.md)
  给接手开发者、部署维护者、业务实施人员的检查列表。

## 推荐阅读路径

开发者：

1. [系统架构](./architecture.md)
2. [接口文档](./api.md)
3. [技术设计理念和亮点](./technical-design.md)
4. [交接清单](./handoff-checklist.md)

业务实施或客户成功：

1. [客户操作 SOP](./customer-sop.md)
2. [交接清单](./handoff-checklist.md)
3. [系统架构](./architecture.md) 中的「业务页面地图」

部署维护：

1. [系统架构](./architecture.md) 中的「部署结构」
2. [接口文档](./api.md) 中的「认证与环境变量」
3. [交接清单](./handoff-checklist.md) 中的「上线前检查」

## 关键源码入口

- `app/`: Next.js 页面、API route、应用壳。
- `src/`: 业务逻辑、校验、持久化、权限、文案。
- `lib/supabase.js`: 浏览器端和服务端 Supabase client 工厂。
- `supabase/migrations/`: 数据库 schema、RLS、事务 RPC、审计和 onboarding 迁移。
- `test/`: Node test runner 测试，覆盖业务逻辑、页面源码约束、数据库迁移文本和部署配置。
- `docs/sprints/`: 按天记录的功能边界、完成状态和后续事项。

## 当前最重要的后续事项

1. 实现销售单 32 开、预印单、双联打印模板。
2. 实现独立客户收款、收款分配和收款冲销。
3. 完成 owner-production 的备份、监控、错误上报、恢复和 smoke test。
4. 把 onboarding 从流程/RPC 推进到可操作后台或明确的运维脚本。
5. 在真实门店数据和真实打印设备上做一轮端到端验收。
