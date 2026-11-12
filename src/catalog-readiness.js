const writableCatalogReadSources = new Set(["supabase", "supabase_empty"]);

export function isWritableCatalogReadSource(readSource) {
  return writableCatalogReadSources.has(readSource);
}
