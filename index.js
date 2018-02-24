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
const { URL } = require('url');

const args = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    m: 'max-time',
    v: 'verbose',
    A: 'user-agent'
  },
  default: {
    'waituntil': 'networkidle0',
    'max-time': 30
  }
});

if (args['h']) {
  console.log('> domcurl [url]');
  return;
}

if (args['version']) {
  const packageInfo = require('./package.json');
  console.log(packageInfo.version);
  return;
}

const waitUnitlValues = ['load', 'domcontentloaded', 'networkidle0', 'networkidle1'];

if (waitUnitlValues.indexOf(args['waituntil']) == -1) {
  console.log(`--waituntil can only be one of: ${waitUnitlValues.join(', ')}`);
  return;
}

try {
  if (isFinite(args['max-time']) === false && args['max-time'] > 0) {
    console.log(`--max-time can only be a number greater than 0`);
    return;
  }
} catch (err) {
  console.log(`--max-time can only be a number greater than 0`, err);
  return;
}


const url = new URL(args['_'][0]);

const options = {
  requestHeader: (!!args['v']),
  responseHeader: (!!args['v']),
  waitUntil: args['waituntil'],
  maxTime: parseInt(args['max-time']) * 1000,
  userAgent: args['user-agent']
};

if (!!url == false) {
  console.log('URL must be specificed');
  process.exit(1);
}

const printHeaders = (headers, preamble) => {
  const headersEntries = Object.entries(headers);
  for (const header of headersEntries) {
    console.log(`${preamble} ${header[0]}: ${header[1]}`);
  }
}

const run = async (url, options) => {
  try {
    const browser = await puppeteer.launch({
      // dumpio: true,
      // headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    if (options.userAgent) {
      await page.setUserAgent(options.userAgent);
    }

    const response = await page.goto(url, {
      timeout: options.maxTime,
      waitUntil: options.waitUtil
    });

    if (options.responseHeader) {
      const request = response.request();
      console.log(`> ${request.method()} ${url.pathname} `);
      console.log(`> Host: ${url.host}`);
      printHeaders(request.headers(), '>');
      printHeaders(response.headers(), '<');
    }

    const html = await page.content();

    console.log(html);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run(url, options);
