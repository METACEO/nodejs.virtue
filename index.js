'use strict';

const CRYPTO = require("crypto");
const FS     = require("fs");
const HTTP   = require("http");
const HTTPS  = require("https");
const HASHES = CRYPTO.getHashes();
let _default = ["sha256"];

module.exports = exports = Virtue;

/* Accepting lookups from here.
*/
function Virtue(
){
  
  const srcs = [];
  
  /* Start cycling through the provided sub-
  // resources.
  */
  for(let arg = 0; arg < arguments.length; arg++){
    
    let src = arguments[arg];
    
    /* Tests for just a resource and if so
    // then use the `_default` hashes.
    //   example:
    //   "resource.js",
    //   ...
    */
    if(ValidString(src)) src = [_default,src];
    
    /* Otherwise, test for a correct list,
    // something that includes either a
    // single string or an array for hashes
    // and a string resource, if not
    // then return an error.
    //   example:
    //   ["sha256","resource.js"],
    //   [["sha256","sha384"],"resource.js"],
    //   ...
    */
    if(
      (!(Array.isArray(src)))
      ||
      (src.length !== 2)
      ||
      (typeof src !== "string")
      &&
      (!(Array.isArray(src)))
      ||
      (!(ValidString(src[1])))
    ){
      
      return ErrorArgument(arg);
      
    }
    
    /* Do we have a single string for
    // a hash?.. if so then turn it
    // into a one-item array.
    //   example:
    //   ["sha256","subresource.js"] to [["sha256"],"subresource.js"]
    */
    if(Array.isArray(src[0]) !== true) src[0] = [src[0]];
    
    /* We now have an array of hashes...
    // if our array includes an invalid
    // hash, then return an error to our
    // user that'll specify it.
    */
    if(src[0].some(InvalidHash)) return ErrorHash(src[0],arg);
    
    /* Push the resource lookup towards the
    // othes and continue to the next. The
    // arguments are dereferenced and freed
    // in the beginning of the bound `Lookup`
    // method with slices and substrings.
    */
    srcs.push(new Promise(Lookup.bind(null,src[0],src[1])));
    
  }
  
  /* Return the Promise to the user
  // and allow them to do what they
  // want with its results.
  */
  return Promise.all(srcs);
  
}

/* Provide the user the ability to
// specify default hashes to digest
// and return.
*/
Virtue.defaultHashes = function DefaultHashes(
  hashes
){
  
  /* The user can specify multiple
  // hashes, with a string or an
  // array, but turn strings into
  // single-item arrays.
  //   example:
  //   .defaultHashes("sha256");
  //   .defaultHashes(["sha256"]);
  //   .defaultHashes(["sha256","sha512"]);
  */
  if(Array.isArray(hashes) !== true) hashes = [hashes];
  
  /* If any erroneous hashes were
  // provided, or none were provided
  // at all, then return without
  // modifying the default...
  */
  if(hashes.length === 0 || hashes.some(InvalidHash)) return false;
  
  /* ...otherwise overwrite the
  // default hashes and return true.
  // Make sure to dereference the
  // provided argument (slices.)
  */
  _default = hashes.slice(0);
  
  return true;
  
};

/* Prepare the hashes and determine
// the resource's scope, local or
// remote, HTTP or HTTPS.
*/
function Lookup(
  hashes,
  src,
  resolve,
  reject
){
  
  const digests = {};
  let resource;
  
  /* Dereference and free the
  // arguments (slices and
  // substrings.)
  */
  hashes = hashes.slice(0);
  src    = src.substring(0);
  
  /* Create the hash classes
  // according to their value.
  */
  for(let hash in hashes) digests[hashes[hash]] = CRYPTO.createHash(hashes[hash]);
  
  /* Determine the type of
  // lookup, remote or local.
  */
  if(src.substring(0,7) === "http://"){
    
    resource = HTTP.get(src,Hooks.bind(null,digests,src,resolve));
    
  }
  else if(src.substring(0,8) === "https://"){
    
    resource = HTTPS.get(src,Hooks.bind(null,digests,src,resolve));
    
  }
  else{
    
    resource = Hooks.call(null,digests,src,resolve,FS.ReadStream(src));
    
  }
  
  /* Catch any errors the lookup
  // may create.
  */
  resource.on("error",reject);
  
}

/* Attach the handlers and the
// information necessary to the
// connection, local or remote.
*/
function Hooks(
  digests,
  src,
  resolve,
  connection
){
  
  /* This applies to both remote
  // connections, HTTP and HTTPS,
  // and to local read streams.
  // Return them all.
  */
  return connection.setEncoding("utf8")
  .on("data",Data.bind(null,digests))
  .on("end",End.bind(null,digests,src,resolve));
  
}

/* As data comes in, add it to
// each of the hash classes.
*/
function Data(
  digests,
  data
){
  
  for(let digest in digests) digests[digest].update(data);
  
}

/* When all the data is collected,
// replace the hash classes with
// their end result.
*/
function End(
  digests,
  src,
  resolve
){
  
  /* Start the digestion.
  */
  // Developers!.. Developers!.. Developers!..
  for(let digest in digests) digests[digest] = digests[digest].digest("base64");
  // Developers!
  
  /* Return the finished result.
  */
  resolve({src,digests});
  
}

/* This packages up an error for the
// user with a message and a code,
// and if any other information.
*/
function ReturnError(
  message,
  code,
  info
){
  
  const err = new Error(message);
  err.code  = code;
  
  /* Append additional information
  // to the error.
  */
  for(let z in info) err[z] = info[z];
  
  return err;
  
}

/* This replaces a few calls alerting
// the user that some provided argument
// to lookup is invalid.
*/
function ErrorArgument(
  arg
){
  
  const info = {};
  
  /* If we get an `arg` number, then
  // add one to represent the user's
  // actual input.
  */
  if(typeof arg === "number") info.arg = (arg + 1);
  
  return Promise.reject(ReturnError("Invalid resource provided.","INVALID-RESOURCE",info));
  
}

/* This alerts the user that some hash
// is not included in their `CRYPTO`,
// whether by misspelling of lack of
// `CRYPTO` features.
*/
function ErrorHash(
  hashes,
  arg
){
  
  const info = {};
  
  /* If we get an `arg` number, then
  // add one to represent the user's
  // actual input.
  */
  if(typeof arg === "number") info.arg = (arg + 1);
  
  /* Find and return the first
  // erroneous hash.
  */
  if(Array.isArray(hashes)) info.hash = hashes.find(InvalidHash);
  
  /* Catch the Promise and
  // return all available
  // information.
  */
  return Promise.reject(ReturnError("This hash is unavailable.","INVALID-HASH",info));
  
}

/* Check if something is a string
// type and if it has anything.
*/
function ValidString(
  something
){
  
  return (typeof something === "string" && something.length > 0);
  
}

/* First test if it's even a
// string, then if it's included
// in the collected `HASHES`.
*/
function ValidHash(
  something
){
  
  return (ValidString(something) && HASHES.indexOf(something) >= 0);
  
}

/* Turn `ValidHash` around.
*/
function InvalidHash(
  something
){
  
  return (ValidHash(something) !== true);
  
}

