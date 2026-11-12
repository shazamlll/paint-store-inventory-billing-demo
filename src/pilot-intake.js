export const pilotIntakeSections = [
  section("store_profile", "门店基本信息", "确认试点门店是谁、谁负责使用、每天什么时候结账。", [
    "门店名称和所在城市是什么？",
    "店主、店员、记账人员分别是谁？",
    "每天大概几点开门、几点关门、几点做日结？",
    "第一周只允许谁录入真实数据？"
  ]),
  section("products", "商品和库存起点", "商品字段决定后续导入、开单和库存流水是否能顺利落地。", [
    "现有商品清单在哪：表格、纸本、收银系统，还是只有货架？",
    "每个商品最少需要哪些字段：名称、规格、单位、进价、售价、库存、低库存线？",
    "是否存在同名不同规格、同规格不同品牌、散装或按公斤销售的商品？",
    "第一周需要先导入全部商品，还是只导入高频商品？"
  ]),
  section("customers", "客户和期初应收", "客户与应收是小店最容易出错也最能体现价值的起点。", [
    "需要先导入哪些客户：施工队、物业、老客户，还是只导入有欠款客户？",
    "客户是否必须有手机号？没有手机号时用什么识别？",
    "期初应收从哪里来，能不能按客户给出金额和备注？",
    "第一周是否允许新增客户，还是只从导入客户里选择？"
  ]),
  section("suppliers", "供应商和期初应付", "采购入库要能追踪来源，但第一版不能被复杂供应链拖慢。", [
    "常用供应商有几家？",
    "供应商是否需要手机号、联系人、账期或备注？",
    "是否有需要记录的期初应付？",
    "第一周采购入库是否只记录数量和金额，不处理复杂对账？"
  ]),
  section("sales_bill", "销售单格式", "销售单字段决定店员是否能真实开单，也决定打印单据是否能给客户。", [
    "销售单必须打印哪些字段：客户、电话、商品、规格、数量、单价、折扣、收款、欠款？",
    "常用付款方式有哪些：现金、微信、支付宝、银行转账、挂账？",
    "折扣是整单折扣、单行折扣，还是两者都要？",
    "客户拿到的单据需要门店电话、地址或备注吗？"
  ]),
  section("daily_closeout", "每日结账", "日结格式要贴近店主每天关门前真正看的数字。", [
    "关门前最先看销售额、收款额、应收新增，还是低库存？",
    "是否需要按付款方式拆分收款？",
    "是否需要列出当天未收清订单？",
    "日结结果是打印、截图、导出，还是只在页面查看？"
  ]),
  section("first_week_boundary", "第一周试点边界", "试点必须限制范围，避免还没接安全能力就承载生产风险。", [
    "第一周预计每天录入多少张销售单？",
    "是否允许多人同时操作？如果允许，需要先做账号和权限。",
    "谁负责每天核对库存和备份数据？",
    "如果系统不可用，门店如何回退到纸本或表格？"
  ])
];

export const pilotImportTemplates = [
  template("products", "products.csv", [
    "name",
    "spec",
    "unit",
    "cost_price",
    "sale_price",
    "current_stock",
    "low_stock_threshold",
    "category",
    "notes"
  ]),
  template("customers", "customers.csv", [
    "name",
    "phone",
    "notes",
    "opening_receivable_balance"
  ]),
  template("suppliers", "suppliers.csv", [
    "name",
    "phone",
    "notes",
    "opening_payable_balance"
  ]),
  template("opening_stock", "opening_stock.csv", [
    "product_name",
    "spec",
    "unit",
    "quantity",
    "source_note"
  ]),
  template("opening_receivables", "opening_receivables.csv", [
    "customer_name",
    "phone",
    "amount",
    "reason",
    "due_note"
  ])
];

export const pilotDeliveryGates = [
  gate(
    "confirm_import_shape",
    "required",
    "先确认真实门店能提供哪些字段，再决定数据库和导入脚本的最终形状。"
  ),
  gate(
    "choose_import_method",
    "required",
    "先决定首店数据是手工录入还是 CSV 导入，避免为不存在的批量流程过度开发。"
  ),
  gate(
    "defer_persistence_until_fields_confirmed",
    "blocked",
    "真实字段未确认前，不接生产 Supabase 写入，避免迁移和数据清洗反复返工。"
  ),
  gate(
    "require_security_before_live_use",
    "blocked",
    "真实多人使用前必须补认证、RLS、备份和审计日志，否则不能承载生产数据。"
  )
];

function section(id, title, why, questions) {
  return {
    id,
    title,
    why,
    questions
  };
}

function template(id, fileName, headers) {
  return {
    id,
    fileName,
    headers
  };
}

function gate(id, status, reason) {
  return {
    id,
    status,
    reason
  };
}
