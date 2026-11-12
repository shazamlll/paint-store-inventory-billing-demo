export function readEnvValue(env, canonicalName) {
  if (!env || !canonicalName) {
    return "";
  }

  const exact = env[canonicalName];

  if (exact !== undefined) {
    const exactValue = String(exact).trim();

    if (exactValue) {
      return exactValue;
    }
  }

  const lowerName = canonicalName.toLowerCase();
  const matchedName = Object.keys(env).find((name) => {
    if (name.toLowerCase() !== lowerName) {
      return false;
    }

    return Boolean(String(env[name] ?? "").trim());
  });

  return matchedName ? String(env[matchedName] ?? "").trim() : "";
}
