const paymentStatusLabels = {
  paid: "已收清",
  partial: "部分收款",
  unpaid: "未收款"
};

const verificationStatusLabels = {
  ok: "已核对",
  review: "需复核"
};

export const homeCopy = {
  title: "门店进销存开单系统",
  intro:
    "登录后进入经营工作台，处理销售开单、采购入库、库存流水、客户资料、应收款和每日报表。",
  navItems: [
    { href: "/dashboard", label: "经营看板", primary: true },
    { href: "/search", label: "全局搜索" },
    { href: "/products", label: "商品列表" },
    { href: "/customers", label: "客户列表" },
    { href: "/sales", label: "开销售单" },
    { href: "/sales/print", label: "打印销售单" },
    { href: "/reports/daily", label: "每日结账" },
    { href: "/purchases", label: "采购入库" },
    { href: "/inventory", label: "库存流水" },
    { href: "/inventory/low-stock", label: "低库存提醒" },
    { href: "/inventory/adjustments", label: "库存调整" }
  ],
  entrySummary: "左侧导航已经按门店日常经营、资料库存分组。"
};

export const appNavigation = {
  title: homeCopy.title,
  subtitle: "经营工作台",
  status: "请登录后选择门店和角色，再进入业务页面。",
  groups: [
    navigationGroup("daily-operations", "日常经营", [
      "/dashboard",
      "/sales",
      "/sales/print",
      "/purchases",
      "/reports/daily",
      "/search"
    ]),
    navigationGroup("catalog-inventory", "资料与库存", [
      "/products",
      "/customers",
      "/inventory",
      "/inventory/low-stock",
      "/inventory/adjustments"
    ])
  ]
};

function navigationGroup(id, label, hrefs) {
  return {
    id,
    label,
    items: hrefs.map((href) => navigationItem(href))
  };
}

function navigationItem(href) {
  const item = homeCopy.navItems.find((navItem) => navItem.href === href);

  if (!item) {
    throw new Error(`Missing navigation item for ${href}`);
  }

  return {
    href: item.href,
    label: item.label,
    exact: href === "/" || href === "/sales" || href === "/sales/print"
  };
}

export function formatPaymentStatusLabel(status) {
  return paymentStatusLabels[status] ?? "待确认";
}

export function formatVerificationStatusLabel(status) {
  return verificationStatusLabels[status] ?? "待核对";
}
