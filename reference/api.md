# 接口文档

## 总体约定

当前 API 都是 Next.js App Router route handler，路径位于 `app/api/**/route.js`。

所有写入接口都使用相同认证模式：

```http
Authorization: Bearer <Supabase access token>
Content-Type: application/json
```

API route 会：

1. 创建服务端 Supabase client。
2. 调用 `client.auth.getUser()` 校验 token。
3. 调用 `loadStoreContext()` 读取当前用户 active store 和 role。
4. 调用业务持久化模块。

通用响应：

```json
{
  "errors": {},
  "saved": {}
}
```

失败时：

```json
{
  "errors": {
    "sales": "missing_session"
  },
  "saved": null
}
```

通用状态码：

- `201`: 写入成功，`errors` 为空。
- `400`: 业务校验失败、权限 gate 失败、RPC/table write 失败。
- `401`: 缺少或无效 Supabase session。
- `503`: Supabase public config 不完整，无法创建 client。

## 认证与环境变量

前端和 API 都依赖：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

这两个值是 public key 配置，不是 service-role secret。不要在浏览器或 Cloudflare public env 中配置：

- Supabase service-role key
- 直连数据库 URL
- 迁移管理员凭证

## 接口清单

### POST `/api/catalog/products`

保存商品。新增商品时不带 `id`；更新商品时带 `id`。

调用链：

```text
app/api/catalog/products/route.js
  -> src/catalog-persistence.js/saveCatalogProduct()
  -> products table insert/update
```

请求体核心字段：

```json
{
  "id": "optional-product-id",
  "name": "立邦净味乳胶漆",
  "spec": "18L",
  "unit": "桶",
  "costPrice": 180,
  "salePrice": 238,
  "currentStock": 12,
  "lowStockThreshold": 3
}
```

成功响应：

```json
{
  "errors": {},
  "saved": {
    "id": "product-id"
  }
}
```

典型错误：

- `catalog: supabase_config_missing`
- `catalog: missing_session`
- `catalog: loading_store_context`
- `catalog: missing_store_context`
- `catalog: catalog_client_unavailable`
- `catalog: catalog_write_failed`
- `catalog: catalog_update_failed`

### POST `/api/catalog/customers`

新增客户。

调用链：

```text
app/api/catalog/customers/route.js
  -> src/catalog-persistence.js/saveCatalogCustomer()
  -> customers table insert
```

请求体核心字段：

```json
{
  "name": "张三",
  "phone": "13800000000",
  "notes": "油工客户",
  "receivableBalance": 0
}
```

成功响应：

```json
{
  "errors": {},
  "saved": {
    "id": "customer-id"
  }
}
```

### POST `/api/catalog/suppliers`

新增供应商。

调用链：

```text
app/api/catalog/suppliers/route.js
  -> src/catalog-persistence.js/saveCatalogSupplier()
  -> suppliers table insert
```

请求体核心字段：

```json
{
  "name": "都会涂料供应",
  "phone": "021-00000000",
  "notes": "主要涂料供应商",
  "payableBalance": 0
}
```

成功响应：

```json
{
  "errors": {},
  "saved": {
    "id": "supplier-id"
  }
}
```

## 销售接口

### POST `/api/sales/orders`

保存销售单。该接口不直接操作多张表，而是调用 Supabase RPC `save_sales_order_transaction`，保证销售单、明细、付款状态、应收、库存扣减和库存流水在一个服务端事务中处理。

调用链：

```text
app/api/sales/orders/route.js
  -> src/sales-persistence.js/saveSalesOrderTransaction()
  -> Supabase RPC save_sales_order_transaction
```

允许角色：

- `owner`
- `clerk`

请求体核心字段：

```json
{
  "customer": {
    "id": "customer-id",
    "name": "张三"
  },
  "lines": [
    {
      "productId": "product-id",
      "productNameSnapshot": "立邦净味乳胶漆",
      "specSnapshot": "18L",
      "quantity": 2,
      "unit": "桶",
      "unitPrice": 238,
      "discountAmount": 0,
      "lineTotal": 476,
      "currentStock": 12
    }
  ],
  "paymentAmount": 200,
  "notes": "客户下次补款"
}
```

服务端会计算：

- `subtotal`
- `discount_amount`
- `total_amount`
- `payment_status`
- `receivable_delta`

成功响应：

```json
{
  "errors": {},
  "saved": {
    "order_number": "SO-..."
  }
}
```

典型错误：

- `sales: missing_session`
- `sales: loading_store_context`
- `sales: missing_store_context`
- `sales: role_forbidden`
- `customer: sales_customer_id_required`
- `lines: sales_product_id_required`
- `inventory: sales_stock_insufficient`
- `paymentAmount: sales_payment_exceeds_total`
- `sales: sales_transaction_failed`

## 采购接口

### POST `/api/purchases/orders`

保存采购入库单。该接口调用 Supabase RPC `save_purchase_order_transaction`，保证采购单、明细、应付、库存增加和库存流水一致写入。

调用链：

```text
app/api/purchases/orders/route.js
  -> src/purchase-persistence.js/savePurchaseOrderTransaction()
  -> Supabase RPC save_purchase_order_transaction
```

允许角色：

- `owner`
- `clerk`

请求体核心字段：

```json
{
  "supplier": {
    "id": "supplier-id",
    "name": "都会涂料供应"
  },
  "lines": [
    {
      "productId": "product-id",
      "productNameSnapshot": "立邦净味乳胶漆",
      "specSnapshot": "18L",
      "quantity": 10,
      "unit": "桶",
      "unitCost": 180,
      "lineTotal": 1800
    }
  ],
  "paymentAmount": 1000,
  "notes": "月底结余款"
}
```

成功响应：

```json
{
  "errors": {},
  "saved": {
    "order_number": "PO-..."
  }
}
```

典型错误：

- `purchase: missing_session`
- `purchase: loading_store_context`
- `purchase: missing_store_context`
- `purchase: role_forbidden`
- `supplier: purchase_supplier_id_required`
- `lines: purchase_product_id_required`
- `lines: purchase_unit_cost_invalid`
- `paymentAmount: purchase_payment_exceeds_total`
- `purchase: purchase_transaction_failed`

## 库存接口

### POST `/api/inventory/adjustments`

手工调整库存。该接口先读取目标商品，再更新 `products.current_stock`，最后新增一条 `inventory_movements`。

调用链：

```text
app/api/inventory/adjustments/route.js
  -> src/inventory-adjustment-persistence.js/saveInventoryAdjustment()
  -> products update + inventory_movements insert
```

允许角色：

- `owner`
- `clerk`

请求体：

```json
{
  "productId": "product-id",
  "quantityDelta": -1,
  "reason": "破损报损"
}
```

成功响应：

```json
{
  "errors": {},
  "saved": {
    "product": {
      "id": "product-id",
      "storeId": "store-id",
      "name": "立邦净味乳胶漆",
      "spec": "18L",
      "unit": "桶",
      "currentStock": 11
    },
    "movement": {
      "id": "movement-id",
      "movementType": "adjustment",
      "quantityDelta": -1,
      "stockAfter": 11,
      "sourceTable": "inventory_movements",
      "sourceOrderNumber": "movement-id",
      "notes": "手动调整：破损报损"
    }
  }
}
```

典型错误：

- `inventory: missing_session`
- `inventory: loading_store_context`
- `inventory: missing_store_context`
- `inventory: role_forbidden`
- `product: inventory_product_id_required`
- `product: inventory_product_not_found`
- `quantityDelta: inventory_quantity_delta_invalid`
- `quantityDelta: inventory_quantity_delta_zero`
- `quantityDelta: inventory_stock_after_negative`
- `reason: inventory_adjustment_reason_required`

## 当前没有 API 的事项

以下能力目前没有对应正式 API：

- 独立客户收款。
- 收款分配到多张销售单。
- 收款冲销、退款、作废。
- 采购单冲销。
- 审计日志查询页面/API。
- 打印模板保存、打印偏移配置保存。
- 完整 admin/onboarding console。

如果新增这些接口，应沿用当前模式：API route 只做认证和上下文装配，业务规则放在 `src/`，`store_id` 由服务端控制，数据库一致性尽量放到 RPC 或单一服务端事务中。
