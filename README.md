# virtue

*Module for digesting hashes of local and remote resources in order to provide element integrity.*

```
$ npm install -g virtue
```

Originally conceptualized to generate hashes for the HTML `integrity` attribute (following the W3C Candidate Recommendation [12 November 2015](http://www.w3.org/TR/2015/CR-SRI-20151112/)) `virtue` remains available to generate the hashes of both local and remote resources, in-batch, with the command line or within your Node.js applications.

## Usage

Node.js `>=4.0.0` is required as `Promise`s, `let`s, and `const`s are incorporated, legacy support for Node `<4.0.0` is in the works. The default hash used in digestion is `sha256`, but can include any other hash available to Node.js' `Crypto` library. Current remote protocols include `HTTP` and `HTTPS` and remote resources must specify their protocol (`http://` or `https://`.)

### Command Line Interface

Installing `virtue` globally will allow you to digest resources on the command line (the order of arguments **does** matter.)

```
$ virtue [--json] [--help] [--hashes] [[--hash] ..] <resource [[--hash] ..]>
```

* `--json` will force all output (help, errors, results, etc.) to be formatted in JSON. Not for human-readability, but could be useful to your other non-Node.js applications.
* `--help` will generate some general system information to diagnose any possible conflicts while also providing some directions, similar to what you're reading now.
* `--hashes` will return the same list of available hashes as `require('crypto').getHashes()`, possibly useful again to your other non-Node.js applications.
* `[[--hash] ..]` can be one or multiple hashes from `--hashes`. These together will be the default set of hashes `virtue` will use. If a `--hash` is invalid or not available, then an error will be returned before any digesting is done. These specifications are not required but can be useful to you when you have multiple resources and a specified list of `--hash`(s).
* `resource [[--hash] ..]` represents a file `resource` either locally or remotely. Any `--hash`(s) after the `resource` will tell `virtue` to apply those to that `resource` instead of the defaults. At least one `resource` is required, trailing hashes are not. If any specified hash is invalid or unavailable, then `virtue` returns an error specifying so.

Below is a command line example of:
* Setting a default hash of `sha512`.
* Including a remote file with a specific hash of `sha256`
* Including a local file that will default to `sha512`.

```
$ virtue --sha512 https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js --sha256 jquery.min.js
Starting...
Printing digests...

  https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js
    sha256 === GeBl6q3yb1jA4QgaLg5kRQ7sKYPuuwj5mOyqyshkKkc=

  jquery.min.js
    sha512 === MkM2us1noHhdh0LTfWnwckBSRMLMVY0+KxF76Zq3EbIvreEAgYFH8q3G73YJwKYwfSBuoIbEUmFm/4Omv8iP3w==

Done!
$
```

Here is something similar to the above, but with the `--json` flag prepended.

```
$ virtue --json --sha512 jquery.min.js
{"error":false,"result":[{"src":"jquery.min.js","digests":{"sha512":"MkM2us1noHhdh0LTfWnwckBSRMLMVY0+KxF76Zq3EbIvreEAgYFH8q3G73YJwKYwfSBuoIbEUmFm/4Omv8iP3w=="}}]}
$
```

### Programmatically

When using `virtue` programmatically, your application will receive a `new Promise` to work with.

```javascript
require("virtue")(
  "/downloaded/locally/jquery/3.0.0-alpha1/jquery.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js"
)
.then(
  (results) => console.log(JSON.stringify(results,null,"  ")),
  (error) => console.log("Uh-oh!",error)
)
```

The above `results` will contain an object structured like below, ordered according to the arguments originally provided.

```
[
  {
    "src": "/downloaded/locally/jquery/3.0.0-alpha1/jquery.min.js",
    "digests": {
      "sha256": "GeBl6q3yb1jA4QgaLg5kRQ7sKYPuuwj5mOyqyshkKkc="
    }
  },
  {
    "src": "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js",
    "digests": {
      "sha256": "GeBl6q3yb1jA4QgaLg5kRQ7sKYPuuwj5mOyqyshkKkc="
    }
  }
]
```

## Programmatic API

#### virtue(resource[, ...])

Every `resource` argument provided, as either a string or an array, will be used in digestion.

**Default Hash Digestion**

The below will result with `sha256` digests of both resources. Because no hashes are specified, the default hash is assumed.

```javascript
require("virtue")(
  "/downloaded/locally/jquery/3.0.0-alpha1/jquery.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js"
)
.then(...)
```

**Specified Hash Digestion**

The below, because a hash is specified, will override the default hash with the specified and will, in this case, result with `sha512` digests.

```javascript
require("virtue")(
  ["sha512","/downloaded/locally/jquery/3.0.0-alpha1/jquery.min.js"],
  ["sha512","https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js"]
)
.then(...)
```

**Specified Multiple Hashes Digestion**

Finally, should your application want to include multiple digests, specify what you would want digested and returned, using an array of hashes (an array of one hash is the same as just a hash string, like in the example before.)

```javascript
require("virtue")(
  [["sha224","sha256"],"/downloaded/locally/jquery/3.0.0-alpha1/jquery.min.js"],
  [["sha384","sha512"],"https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js"]
)
.then(...)
```

### virtue#defaultHashes(hashes)

The `hashes` provided, as either a string or an array, will be set as the default to be used in digestion and will return `true`. If a hash provided in `hashes` is not valid, then this will return `false` and will not change the default.

```javascript
console.log(
  // these will return true
  virtue.defaultHashes("sha256")),
  virtue.defaultHashes(["sha256"])),
  virtue.defaultHashes(["sha256","sha512"])),
  // these will return false
  virtue.defaultHashes()),                    // empty
  virtue.defaultHashes([])),                  // empty
  virtue.defaultHashes(true)),                // invalid hash
  virtue.defaultHashes("invalid")),           // invalid hash
  virtue.defaultHashes(["sha256",true])),     // array w/invalid hash
  virtue.defaultHashes(["sha256","invalid"])) // array w/invalid hash
);
```
