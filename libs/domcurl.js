const {Logger, ErrorLogger} = require('./output.js');
const puppeteer = require('puppeteer');

const printHeaders = (headers, preamble, logger) => {
  const headersEntries = Object.entries(headers);
  for (const header of headersEntries) {
    logger.log(`${preamble} ${header[0]}: ${header[1]}`);
  }
};

const domcurl = async (url, options) => {
  const logger = options.logger || new Logger();
  const errorLogger = options.errorLogger || new ErrorLogger();

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
        logger.log(`> ${request.method()} ${url.pathname} `);
        logger.log(`> Host: ${url.host}`);
        printHeaders(request.headers(), '>', logger);
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
      waitUntil: options.waitUntil
    });

    if (options.trace) {
      await page.tracing.stop();
    }

    if (options.responseHeader) {
      printHeaders(response.headers(), '<');
    }

    const html = await page.content();
    logger.log(html);

    process.exit(0);
  } catch (err) {
    errorLogger.error(err);
    process.exit(1);
  }
};

module.exports = {
  domcurl: domcurl
};
