export function createCustomerDraft(customerItem = {}) {
  return {
    name: stringify(customerItem.name),
    phone: stringify(customerItem.phone),
    notes: stringify(customerItem.notes),
    receivableBalance: stringify(customerItem.receivableBalance ?? 0)
  };
}

export function validateCustomerDraft(draft) {
  const errors = {};
  const receivableBalance = Number(draft.receivableBalance);

  if (!draft.name?.trim()) {
    errors.name = "客户名称不能为空。";
  }

  if (draft.receivableBalance === "" || Number.isNaN(receivableBalance)) {
    errors.receivableBalance = "应收余额必须是数字。";
  } else if (receivableBalance < 0) {
    errors.receivableBalance = "应收余额不能小于 0。";
  }

  return errors;
}

export function normalizeCustomerDraft(draft) {
  return {
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    notes: draft.notes.trim(),
    receivableBalance: Number(draft.receivableBalance)
  };
}

export function appendCustomer(customers, customerItem) {
  return [...customers, { ...customerItem }];
}

export function getCustomerSummary(customers) {
  return customers.reduce(
    (summary, customerItem) => {
      summary.totalCustomers += 1;
      summary.totalReceivableBalance += customerItem.receivableBalance;

      if (customerItem.receivableBalance > 0) {
        summary.receivableCustomerCount += 1;
      }

      if (customerItem.name === "散客") {
        summary.walkInCustomerName = customerItem.name;
      }

      return summary;
    },
    {
      totalCustomers: 0,
      receivableCustomerCount: 0,
      totalReceivableBalance: 0,
      walkInCustomerName: ""
    }
  );
}

function stringify(value) {
  return value === undefined || value === null ? "" : String(value);
}
