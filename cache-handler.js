// Custom cache handler : réutilise le filesystem par défaut de Next.js
// sans la limite de 2MB appliquée par unstable_cache.
// Référence : https://nextjs.org/docs/app/api-reference/config/next-config-js/incrementalCacheHandlerPath
const FileSystemCache = require("next/dist/server/lib/incremental-cache/file-system-cache.js");

module.exports = FileSystemCache.default ?? FileSystemCache;
