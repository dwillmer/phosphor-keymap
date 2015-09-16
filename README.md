phosphor-keymap
================

[![Build Status](https://travis-ci.org/phosphorjs/phosphor-keymap.svg)](https://travis-ci.org/phosphorjs/phosphor-keymap?branch=master)
[![Coverage Status](https://coveralls.io/repos/phosphorjs/phosphor-keymap/badge.svg?branch=master&service=github)](https://coveralls.io/github/phosphorjs/phosphor-keymap?branch=master)

A module for cross-browser keyboard support.

[API Docs](http://phosphorjs.github.io/phosphor-keymap/api)

Package Install
---------------

**Prerequisites**
- [node](https://nodejs.org)

```bash
npm install --save phosphor-command
```

Source Build
------------

**Prerequisites**
- [git](http://git-scm.com/)
- [node](http://nodejs.org)

```bash
git clone https://github.com/phosphorjs/phosphor-command.git
cd phosphor-command
npm install
```

Run Tests
---------

Follow the source build instructions first.

```bash
npm test
```

Build Docs
----------

Follow the source build instructions first.

```bash
npm run docs
```

Navigate to `docs/index.html`

Supported Runtimes
------------------

The runtime versions which are currently *known to work* are listed below.
Earlier versions may also work, but come with no guarantees.

- Node 0.12.7+
- IE 11+
- Firefox 32+
- Chrome 38+

Bundle for the Browser
----------------------

Follow the package install instructions first.

```bash
npm install --save-dev browserify
browserify myapp.js -o mybundle.js
```

Usage Examples
--------------

**Note:** This module is fully compatible with Node/Babel/ES6/ES5. Simple omit the type declarations when using a language other than TypeScript.

