import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// Only truly un-bundleable packages (optional native addons where the
// consumer gracefully falls back when absent).
// better-sqlite3's JS wrapper IS bundled; its .node binary is embedded in
// dist/better_sqlite3.gz and extracted to /tmp by the bootstrap at startup.
const SKIP_EXTERNAL = new Set([
  "bufferutil", // optional ws perf addon — ws falls back to pure-JS silently
]);

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];

  // Mark only truly un-bundleable packages as external.
  const externals = allDeps.filter((dep) => SKIP_EXTERNAL.has(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    // Silence the "Cannot bundle .node files" warning — the bootstrap handles
    // native addon loading via Module._load patching + /tmp extraction.
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
