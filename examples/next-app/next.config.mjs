import { fileURLToPath } from "node:url";

// The example installs the package from ../.. (file: link), so Turbopack's root
// must include the repository root.
export default {
  turbopack: { root: fileURLToPath(new URL("../..", import.meta.url)) },
};
