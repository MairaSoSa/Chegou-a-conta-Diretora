import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// Packages with native C/C++ bindings that CANNOT be bundled by esbuild.
// Everything else is inlined into dist/index.cjs so the production container
// only needs these packages in node_modules — keeping the deployed image tiny.
const NATIVE_EXTERNALS = [
  "better-sqlite3", // .node native addon
  "bufferutil",     // optional native addon for ws
];

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

  // Keep only native packages as external — bundle everything else.
  const externals = allDeps.filter((dep) => NATIVE_EXTERNALS.includes(dep));

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
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
