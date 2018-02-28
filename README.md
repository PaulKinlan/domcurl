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


```
<!DOCTYPE html><html><head>
    <title>Example Domain</title>

    <meta charset="utf-8">
    <meta http-equiv="Content-type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style type="text/css">
    body {
        background-color: #f0f0f2;
        margin: 0;
        padding: 0;
        font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
        
    }
    div {
        width: 600px;
        margin: 5em auto;
        padding: 50px;
        background-color: #fff;
        border-radius: 1em;
    }
    a:link, a:visited {
        color: #38488f;
        text-decoration: none;
    }
    @media (max-width: 700px) {
        body {
            background-color: #fff;
        }
        div {
            width: auto;
            margin: 0 auto;
            border-radius: 0;
            padding: 1em;
        }
    }
    </style>    
</head>

<body>
<div>
    <h1>Example Domain</h1>
    <p>This domain is established to be used for illustrative examples in documents. You may use this
    domain in examples without prior coordination or asking for permission.</p>
    <p><a href="http://www.iana.org/domains/example">More information...</a></p>
</div>


</body></html>
```

### Verbose output

Renders more details about the request and the response.

`domcurl -v [url]`

```
> GET / 
> Host: example.com
> upgrade-insecure-requests: 1
> user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/66.0.3347.0 Safari/537.36
< date: Wed, 28 Feb 2018 03:04:47 GMT
< content-encoding: gzip
< last-modified: Fri, 09 Aug 2013 23:54:35 GMT
< server: ECS (oxr/837E)
< etag: "1541025663+gzip"
< vary: Accept-Encoding
< x-cache: HIT
< content-type: text/html
< status: 200
< cache-control: max-age=604800
< content-length: 606
< expires: Wed, 07 Mar 2018 03:04:47 GMT
<!DOCTYPE html><html><head>
    <title>Example Domain</title>

    <meta charset="utf-8">
    <meta http-equiv="Content-type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style type="text/css">
    body {
        background-color: #f0f0f2;
        margin: 0;
        padding: 0;
        font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
        
    }
    div {
        width: 600px;
        margin: 5em auto;
        padding: 50px;
        background-color: #fff;
        border-radius: 1em;
    }
    a:link, a:visited {
        color: #38488f;
        text-decoration: none;
    }
    @media (max-width: 700px) {
        body {
            background-color: #fff;
        }
        div {
            width: auto;
            margin: 0 auto;
            border-radius: 0;
            padding: 1em;
        }
    }
    </style>    
</head>

<body>
<div>
    <h1>Example Domain</h1>
    <p>This domain is established to be used for illustrative examples in documents. You may use this
    domain in examples without prior coordination or asking for permission.</p>
    <p><a href="http://www.iana.org/domains/example">More information...</a></p>
</div>


</body></html>
```

### Send output to a file

`domcurl --url https://example.com -o test.txt`

or

`domcurl --url https://example.com --output test.txt`

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

### Specify a trace file

Output a Chrome DevTools trace file (including screenshots.)

`domcurl --url https://example.com --trace test.json`
