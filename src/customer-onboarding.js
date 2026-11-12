const onboardingTemplateSteps = [
  {
    id: "create_owner_auth_user",
    label: "Create or invite owner auth user",
    operator: "support_admin",
    target: "supabase_auth",
    blocksDeployment: true
  },
  {
    id: "provision_store_owner_membership",
    label: "Provision store and owner membership",
    operator: "owner_user",
    target: "provision_store_owner",
    blocksDeployment: true
  },
  {
    id: "import_products",
    label: "Import approved products",
    operator: "support_admin",
    target: "products",
    blocksDeployment: true
  },
  {
    id: "import_customers",
    label: "Import approved customers",
    operator: "support_admin",
    target: "customers",
    blocksDeployment: true
  },
  {
    id: "import_suppliers",
    label: "Import approved suppliers",
    operator: "support_admin",
    target: "suppliers",
    blocksDeployment: true
  },
  {
    id: "import_opening_stock",
    label: "Import opening stock movements",
    operator: "support_admin",
    target: "inventory_movements",
    blocksDeployment: true
  },
  {
    id: "import_opening_receivables",
    label: "Import opening receivables",
    operator: "support_admin",
    target: "customers",
    blocksDeployment: true
  },
  {
    id: "verify_store_isolation",
    label: "Verify store isolation",
    operator: "support_admin",
    target: "rls_evidence",
    blocksDeployment: true
  },
  {
    id: "handoff_owner_login",
    label: "Handoff owner login and first-day checklist",
    operator: "support_admin",
    target: "customer_handoff",
    blocksDeployment: false
  }
];

export function buildStoreOnboardingPlan({ store = {}, owner = {} } = {}) {
  const errors = {
    ...validateStoreProfile(store),
    ...validateOwnerProfile(owner)
  };

  return {
    ready: Object.keys(errors).length === 0,
    errors,
    store: normalizeStoreProfile(store),
    owner: normalizeOwnerProfile(owner),
    steps: onboardingTemplateSteps.map((step) => ({ ...step })),
    productionWritesAllowed: false,
    notes: [
      "Owner auth user creation happens before store provisioning.",
      "The authenticated owner user is the only source for owner_user_id.",
      "CSV imports reuse the Day 031 templates and must remain store-scoped.",
      "Deployment remains Day 045 after repeatable onboarding is defined."
    ]
  };
}

export function prepareStoreProvisioningTransaction({ store = {}, session } = {}) {
  const errors = validateStoreProfile(store);
  const ownerUserId = session?.user?.id;

  if (!ownerUserId) {
    errors.owner = "missing_authenticated_owner";
  }

  if (Object.keys(errors).length > 0) {
    return {
      allowed: false,
      reason: "validation_failed",
      errors,
      payload: null
    };
  }

  return {
    allowed: true,
    reason: "ready",
    errors: {},
    payload: {
      ...normalizeStoreProfile(store),
      owner_user_id: ownerUserId
    }
  };
}

export async function provisionStoreOwner({ client, session, store } = {}) {
  const preparation = prepareStoreProvisioningTransaction({ store, session });

  if (!preparation.allowed) {
    return {
      errors: preparation.errors,
      saved: null
    };
  }

  if (!client?.rpc) {
    return {
      errors: {
        onboarding: "onboarding_client_unavailable"
      },
      saved: null
    };
  }

  const { data, error } = await client.rpc("provision_store_owner", {
    p_payload: preparation.payload
  });

  if (error) {
    return {
      errors: {
        onboarding: error.message ?? "store_onboarding_failed"
      },
      saved: null
    };
  }

  return {
    errors: {},
    saved: data
  };
}

function validateStoreProfile(store) {
  const errors = {};

  if (!String(store.name ?? "").trim()) {
    errors.storeName = "store_name_required";
  }

  return errors;
}

function validateOwnerProfile(owner) {
  const errors = {};
  const email = String(owner.email ?? "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.ownerEmail = "owner_email_invalid";
  }

  return errors;
}

function normalizeStoreProfile(store) {
  return {
    name: String(store.name ?? "").trim(),
    phone: String(store.phone ?? "").trim(),
    address: String(store.address ?? "").trim(),
    notes: String(store.notes ?? "").trim()
  };
}

function normalizeOwnerProfile(owner) {
  return {
    name: String(owner.name ?? "").trim(),
    email: String(owner.email ?? "").trim().toLowerCase()
  };
}
