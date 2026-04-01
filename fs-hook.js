const fs = require('fs'); const orig = fs.readFileSync; fs.readFileSync = function(path, opts) { console.log('[FS]', path); return orig.apply(this, arguments); };
