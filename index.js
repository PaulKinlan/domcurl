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

const puppeteer = require('puppeteer');
const minimist = require('minimist');
const process = require('process');
const fs = require('fs');
const {URL} = require('url');

const args = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    m: 'max-time',
    v: 'verbose',
    A: 'user-agent',
    H: 'header',
    e: 'referer',
    b: 'cookie',
    o: 'output'
  },
  default: {
    'waituntil': 'networkidle0',
    'max-time': 30
  }
});

if (args['h']) {
  console.log('> domcurl [url]');
  process.exitCode = 0;
  return;
}

if (args['version']) {
  const packageInfo = require('./package.json');
  console.log(packageInfo.version);
  process.exitCode = 0;
  return;
}

let outputfile;
if (args['output'] && args['output'].length > 0) {
  outputfile = args['output'];
} else if (args['output'] === true) {
  console.log(`--output must be a filename if argument is present`);
  process.exitCode = 1;
  return;
}

const waitUnitlValues = ['load', 'domcontentloaded', 'networkidle0', 'networkidle1'];

if (waitUnitlValues.indexOf(args['waituntil']) == -1) {
  console.log(`--waituntil can only be one of: ${waitUnitlValues.join(', ')}`);
  process.exitCode = 1;
  return;
}

let trace;

if (args['trace'] && typeof(args['trace']) == 'string' && args['trace'].length > 0) {
  trace = args['trace'];
} else if (args['trace'] && typeof(args['trace']) !== 'string' && args['trace'].length == 0) {
  console.log(`--trace must be a string`);
  process.exitCode = 1;
  return;
}

try {
  if (isFinite(args['max-time']) === false && args['max-time'] > 0) {
    console.log(`--max-time can only be a number greater than 0`);
    process.exitCode = 1;
    return;
  }
} catch (err) {
  console.log(`--max-time can only be a number greater than 0`, err);
  process.exitCode = 1;
  return;
}

let url;
let referer;

try {
  url = new URL(args['url'] || args['_'][0]);
} catch (err) {
  console.log(`--url or default value is not a valid URL`);
  process.exitCode = 1;
  return;
}

try {
  if (args['e']) {
    referer = new URL(args['e']).href;
  }
} catch (err) {
  console.log(`-e --referer is not a valid URL`);
  process.exitCode = 1;
  return;
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
  outputFile: outputfile,
  referer: referer,
  headers: headers,
  cookies: cookies,
  trace: trace
};

if (!!url == false) {
  console.log('URL must be specificed');
  process.exitCode = 1;
  return;
}

const printHeaders = (headers, preamble) => {
  const headersEntries = Object.entries(headers);
  for (const header of headersEntries) {
    console.log(`${preamble} ${header[0]}: ${header[1]}`);
  }
};

const run = async (url, options) => {
  try {
    const browser = await puppeteer.launch({
      // dumpio: true,
      // headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    const headers = {};

    if (options.userAgent) {
      await page.setUserAgent(options.userAgent);
    }

    page.on('request', request => {
      if (request.url() === url.href && options.requestHeader) {
        console.log(`> ${request.method()} ${url.pathname} `);
        console.log(`> Host: ${url.host}`);
        printHeaders(request.headers(), '>');
      }
    });

    if (options.cookies) {
      await page.setCookie(...options.cookies);
    }

    if (options.referer) {
      headers['referer'] = options.referer;
    }

    Object.assign(headers, options.headers);

    await page.setExtraHTTPHeaders(headers);

    if (options.trace) {
      await page.tracing.start({path: options.trace, screenshots: true});
    }

    const response = await page.goto(url, {
      timeout: options.maxTime,
      waitUntil: options.waitUtil
    });

    if (options.trace) {
      await page.tracing.stop();
    }

    if (options.responseHeader) {
      printHeaders(response.headers(), '<');
    }

    const html = await page.content();
    if (options.outputFile) {
      fs.writeFileSync(options.outputFile, html);
    } else {
      console.log(html);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run(url, options);
