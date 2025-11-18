/*
 * Paper.js - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2020, Jürg Lehni & Jonathan Puckey
 * http://juerglehni.com/ & https://puckey.studio/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

// ESM 版本 - 将 CommonJS 转换为 ESM

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);

// Import local modules
import setupCanvas from './canvas.js';
import setupXML from './xml.js';

// Node.js emulation layer of browser environment, based on jsdom with node-
// canvas integration.

// Determine the name by which name the module was required (either 'paper',
// 'paper-jsdom' or 'paper-jsdom-canvas'), and use this to determine if error
// exceptions should be thrown or if loading should fail silently.
// In ESM, we need to use import.meta.url to get the module path
var requireName = 'paper';
try {
    // Try to determine the require name from the import path
    // This is a best-effort approach in ESM
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFile);
    const parentDir = path.dirname(currentDir);
    const parentDirName = path.basename(parentDir);
    if (/^paper/.test(parentDirName)) {
        requireName = parentDirName;
    }
} catch(e) {
    // Fallback to default
}

var jsdom,
    self;

try {
    jsdom = require('jsdom');
} catch(e) {
    // Check the required module's name to see if it contains jsdom, and only
    // complain about its lack if the module requires it.
    if (/\bjsdom\b/.test(requireName)) {
        throw new Error('Unable to load jsdom module.');
    }
}

if (jsdom) {
    // Create our document and window objects through jsdom.
    /* global document:true, window:true */
    var document = new jsdom.JSDOM('<html><body></body></html>', {
        // Use the current working directory as the document's origin, so
        // requests to local files work correctly with CORS.
        url: 'file://' + process.cwd() + '/',
        resources: 'usable'
    });
    self = document.window;
    setupCanvas(self, requireName);
    setupXML(self);
} else {
    self = {
        navigator: {
            userAgent: 'Node.js (' + process.platform + '; U; rv:' +
                    process.version + ')'
        }
    };
}

export default self;
