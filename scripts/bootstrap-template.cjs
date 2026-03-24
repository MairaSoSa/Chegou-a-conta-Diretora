'use strict';
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const os = require('os');
const Module = require('module');

const distDir = __dirname;
const tmpDir = os.tmpdir();

const nativeGz  = path.join(distDir, 'better_sqlite3.gz');
const nativeTmp = path.join(tmpDir, 'better_sqlite3.node');
if (!fs.existsSync(nativeTmp)) {
  fs.writeFileSync(nativeTmp, zlib.gunzipSync(fs.readFileSync(nativeGz)));
}

const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request && request.endsWith('.node') && path.basename(request) === 'better_sqlite3.node') {
    return origLoad.call(this, nativeTmp, parent, isMain);
  }
  return origLoad.apply(this, arguments);
};

process.env.BETTER_SQLITE3_NODE = nativeTmp;

const gzPath = path.join(distDir, 'index.cjs.gz');
const source  = zlib.gunzipSync(fs.readFileSync(gzPath)).toString('utf8');
const m = new Module(path.join(distDir, 'index.cjs'));
m.filename = path.join(distDir, 'index.cjs');
m.paths = Module._nodeModulePaths(distDir);
m._compile(source, path.join(distDir, 'index.cjs'));
module.exports = m.exports;
