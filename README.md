# domcurl

cUrl-like utility for fetching a resource (in this case we will run JS and
return after network is idle) - great for JS heavy apps.

## Installation

`npm i domcurl`

## Usage

### Basic usage

`domcurl [url]`

or

`domcurl --url https://example.com`

### Verbose output

Renders more details about the request and the response.

`domcurl -v [url]`

### Set a custom header

`domcurl --url https://example.com -H 'x-test:test1' -H  'x-test2:http://test.com'`

### Set a cookie

Sets a cookie on the request. It must be a valid Cookie string.

`domcurl [url] -b "test=hello; Domain=airhorner.com; HttpOnly;"`

Unlike cUrl you can multiple cookies by appending more `-b` arguments

`domcurl [url] -b "test=hello; Domain=airhorner.com; HttpOnly;" -b "hello=world; Domain=airhorner.com; HttpOnly;"`

### Specify a request timeout

By default the command will timeout after 30 seconds. You can specify how long
the command will wait before it errors.

`domcurl --url https://example.com -m 60`

or

`domcurl --url https://example.com --max-time 60`

### Set a wait selector

Set a selector to make domcurl wait before response (wait order is rely on agrument order.)

`domcurl --url https://example.com --wait-selector "#feed-list > li:nth-child(2)"`

or

`domcurl --url https://example.com --wait-selector "#feed-list > li:nth-child(2)" --wait-selector "#feed-list > li:nth-child(1)"`
