import { createServerSupabaseClient } from "../../../../lib/supabase.js";
import {
  deleteCatalogCustomer,
  saveCatalogCustomer
} from "../../../../src/catalog-persistence.js";
import { loadStoreContext } from "../../../../src/store-context.js";

export async function POST(request) {
  const context = await loadAuthenticatedCatalogContext(request);

  if (context.response) {
    return context.response;
  }

  const draft = await request.json();
  const result = await saveCatalogCustomer({
    client: context.client,
    storeContext: context.storeContext,
    draft
  });
  const status = Object.keys(result.errors).length > 0 ? 400 : 201;

  return Response.json(result, { status });
}

export async function DELETE(request) {
  const context = await loadAuthenticatedCatalogContext(request);

  if (context.response) {
    return context.response;
  }

  const { id } = await request.json();
  const result = await deleteCatalogCustomer({
    client: context.client,
    storeContext: context.storeContext,
    id
  });
  const status = Object.keys(result.errors).length > 0 ? 400 : 200;

  return Response.json(result, { status });
}

async function loadAuthenticatedCatalogContext(request) {
  const client = createServerSupabaseClient({
    authorization: request.headers.get("authorization")
  });

  if (!client) {
    return {
      response: Response.json({ errors: { catalog: "supabase_config_missing" } }, { status: 503 })
    };
  }

  const { data, error } = await client.auth.getUser();

  if (error || !data?.user) {
    return {
      response: Response.json({ errors: { catalog: "missing_session" } }, { status: 401 })
    };
  }

  const storeContext = await loadStoreContext({
    client,
    session: {
      user: data.user
    }
  });

  return {
    client,
    storeContext
  };
}
