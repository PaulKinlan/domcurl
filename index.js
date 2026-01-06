#!/usr/bin/env node

/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const minimist = require('minimist');
const process = require('process');
const fs = require('fs');
const {URL} = require('url');
const {Logger, ErrorLogger} = require('./libs').output;
const {domcurl} = require('./libs').domcurl;

const args = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    m: 'max-time',
    v: 'verbose',
    A: 'user-agent',
    H: 'header',
    e: 'referer',
    b: 'cookie',
    o: 'output',
    X: 'request',
    d: 'data',
    V: 'viewport'
  },
  default: {
    'waituntil': 'networkidle0',
    'max-time': 30
  }
});

const logger = new Logger();
const errorLogger = new ErrorLogger();
const waitUnitlValues = ['load', 'domcontentloaded', 'networkidle0', 'networkidle1'];
let trace;
let url;
let referer;

if (args['output'] && args['output'].length > 0) {
  logger.stream = fs.createWriteStream(args['output']);
} else if (args['output'] === true) {
  errorLogger.log(`--output must be a filename if argument is present`);
  process.exitCode = 1;
  return;
}

if (args['stderr']) {
  let stderrValue = args['stderr'];

  // If multiple --stderr options are provided, use the last one
  if (Array.isArray(stderrValue)) {
    stderrValue = stderrValue[stderrValue.length - 1];
  }

  if (stderrValue === '-') {
    errorLogger.stream = process.stdout;
  } else if (stderrValue === true) {
    // Check if the last '--stderr' in argv is followed by '-'
    const argv = process.argv;
    let lastStderrIndex = -1;
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '--stderr') {
        lastStderrIndex = i;
      }
    }
    if (lastStderrIndex !== -1 && argv[lastStderrIndex + 1] === '-') {
      errorLogger.stream = process.stdout;
    } else {
      errorLogger.log(`--stderr must be a filename if argument is present`);
      process.exitCode = 1;
      return;
    }
  } else if (typeof stderrValue === 'string' && stderrValue.length > 0) {
    errorLogger.stream = fs.createWriteStream(stderrValue);
  } else {
    errorLogger.log(`--stderr must be a filename if argument is present`);
    process.exitCode = 1;
    return;
  }
}

if (args['h']) {
  logger.log('> domcurl [url]');
  process.exitCode = 0;
  return;
}

if (args['version']) {
  const packageInfo = require('./package.json');
  logger.log(packageInfo.version);
  process.exitCode = 0;
  return;
}

if (waitUnitlValues.indexOf(args['waituntil']) == -1) {
  errorLogger.log(`--waituntil can only be one of: ${waitUnitlValues.join(', ')}`);
  process.exitCode = 1;
  return;
}

if (args['trace'] && typeof(args['trace']) == 'string' && args['trace'].length > 0) {
  trace = args['trace'];
} else if (args['trace'] && typeof(args['trace']) !== 'string' && args['trace'].length == 0) {
  errorLogger.log(`--trace must be a string`);
  process.exitCode = 1;
  return;
}

try {
  if (isFinite(args['max-time']) === false && args['max-time'] > 0) {
    errorLogger.log(`--max-time can only be a number greater than 0`);
    process.exitCode = 1;
    return;
  }
} catch (err) {
  errorLogger.log(`--max-time can only be a number greater than 0`, err);
  process.exitCode = 1;
  return;
}

try {
  url = new URL(args['url'] || args['_'][0]);
} catch (err) {
  errorLogger.log(`--url or default value is not a valid URL`);
  process.exitCode = 1;
  return;
}

try {
  if (args['e']) {
    referer = new URL(args['e']).href;
  }
} catch (err) {
  errorLogger.log(`-e --referer is not a valid URL`);
  process.exitCode = 1;
  return;
}

let viewport;
if (args['viewport']) {
  const viewportPattern = /^(\d+)x(\d+)$/;
  const match = args['viewport'].match(viewportPattern);

  if (match) {
    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);

    // Validate reasonable viewport dimensions
    if (width < 1 || height < 1 || width > 7680 || height > 4320) {
      errorLogger.log(
        `-V --viewport dimensions must be between 1-7680 (width) and 1-4320 (height)`
      );
      process.exitCode = 1;
      return;
    }

    viewport = {
      width,
      height
    };
  } else {
    errorLogger.log(`-V --viewport must be in format WIDTHxHEIGHT (e.g., 1920x1080)`);
    process.exitCode = 1;
    return;
  }
}

const generateRequestHeaders = (headers) => {
  if (headers) {
    const requestDict = {};
    let headerValue;
    let headerName;

    if (headers instanceof Array) {
      headers.forEach(header => {
        const i = header.indexOf(':');
        headerName = header.substr(0, i);
        headerValue = header.substr(i+1);
        requestDict[headerName] = headerValue;
      });
    } else {
      const i = headers.indexOf(':');
      headerName = headers.substr(0, i);
      headerValue = headers.substr(i+1);
      requestDict[headerName] = headerValue;
    }
    return requestDict;
  }

  return;
};

const generateCookiesHeaders = (cookieStrings, url) => {
  const parseCookieString = cookieString => {
    const core = cookieString.match(/^([^=]+?)=([^;]+)(.*)/);
    const headerName = core[1];
    const headerValue = core[2];
    const rest = core[3];
    const cookie = {
      name: headerName,
      value: headerValue
    };

    if (rest) {
      const path = rest.match(/; Path=([^;]+)[;]*/);
      const domain = rest.match(/; Domain=([^;]+)[;]*/);
      const secure = rest.match(/; Secure[;]*/);
      const httpOnly = rest.match(/; HttpOnly[;]*/);
      const sameSite = rest.match(/; Samesite=(Lax|Strict)[;]*/);
      const expires = rest.match(/; Expires=(\d+)[;]*/);

      if (domain) {
        cookie.domain = domain[1];
      } else {
        cookie.url = url;
      }

      if (expires) {
        cookie.expires = expires[1];
      } else {
        cookie.session = true;
      }

      cookie.httpOnly = (!!httpOnly);
      cookie.secure = (!!secure);

      if (path) cookie.path = path[1];
      if (sameSite) cookie.sameSite = sameSite[1];
    }

    return cookie;
  };

  if (cookieStrings) {
    if (cookieStrings instanceof Array) {
      return cookieStrings.map(cookieString => {
        parseCookieString(cookieString);
      });
    } else {
      return [parseCookieString(cookieStrings)];
    }
  }

  return;
};

const headers = generateRequestHeaders(args['H']);
const cookies = generateCookiesHeaders(args['b'], url.href);

const options = {
  requestHeader: (!!args['v']),
  responseHeader: (!!args['v']),
  waitUntil: args['waituntil'],
  maxTime: parseInt(args['max-time']) * 1000,
  userAgent: args['user-agent'],
  logger: logger,
  errorLogger: errorLogger,
  referer: referer,
  headers: headers,
  cookies: cookies,
  trace: trace,
  method: args['X'] || args['request'],
  data: args['d'] || args['data'],
  viewport: viewport
};

if (!!url == false) {
  console.log('URL must be specificed');
  process.exitCode = 1;
  return;
}

domcurl(url, options);
