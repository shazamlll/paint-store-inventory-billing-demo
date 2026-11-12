import { createServerSupabaseClient } from "../../../../lib/supabase.js";
import { saveSalesOrderTransaction } from "../../../../src/sales-persistence.js";
import { loadStoreContext } from "../../../../src/store-context.js";

export async function POST(request) {
  const client = createServerSupabaseClient({
    authorization: request.headers.get("authorization")
  });

  if (!client) {
    return Response.json({ errors: { sales: "supabase_config_missing" } }, { status: 503 });
  }

  const { data, error } = await client.auth.getUser();

  if (error || !data?.user) {
    return Response.json({ errors: { sales: "missing_session" } }, { status: 401 });
  }

  const storeContext = await loadStoreContext({
    client,
    session: {
      user: data.user
    }
  });
  const draft = await request.json();
  const result = await saveSalesOrderTransaction({ client, storeContext, draft });
  const status = Object.keys(result.errors).length > 0 ? 400 : 201;

  return Response.json(result, { status });
}
