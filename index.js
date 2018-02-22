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

const args = minimist(process.argv.slice(2), {
  alias: {
    h: 'help'
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

const url = args['_'][0];

if (!!url == false) {
  console.log('URL must be specificed');
  process.exit(1);
}

const run = async (url, options) => {
  const browser = await puppeteer.launch({
    // dumpio: true,
    // headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const res = await page.goto(url, {waitUntil: 'networkidle0'});

  const html = await page.content();

  console.log(html);

  process.exit(0);
};

run(url);
