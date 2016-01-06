#!/usr/bin/env node

'use strict';

const VIRTUE  = require("./");
const OS      = require("os");
const PACKAGE = require("./package.json");
const PRO     = process;
const report  = {error:false};
let arg  = 0;
let args = PRO.argv.slice(2);
let json = false;
let src  = [];
let srcs = [];

/* If the user wants a JSON
// response, for use in another
// application or whatever, then
// raise the flag.
*/
if(args[0] === "--json"){
  
  json = true;
  
  arg++;
  
}

/* Print out the available help
// if requested and finish.
*/
if(args[arg] === "--help"){
  
  Message("HELP");
  
  Finish();
  
}

/* If there are no longer any
// arguments then tell the user.
*/
if(args.length === arg) EndWith("NO-ARGUMENTS");

/* If the available hashes are
// requested then return them
// back to the user and finish.
*/
if(args[arg] === "--hashes"){
  
  Message("HASHES",require("crypto").getHashes());
  
  Finish();
  
}

Message("STARTING");

/* Start looking through the
// first of the arguments for
// any valid hashes to use as
// the defaults. Once no more
// are found, then apply and
// continue to the resources.
*/
for(; arg < args.length; arg++){
  
  if(args[arg].substr(0,2) !== "--") break;
  
  src.push(args[arg].substr(2));
  
  /* We keep applying a new
  // array to Virtue until
  // we get caught, if false
  // then we know the latest
  // src is invalid.
  */
  if(VIRTUE.defaultHashes(src)) continue;
  
  EndWith("INVALID-HASH",src.pop());
  
}

/* If there are no more arguments
// supplied then there is nothing
// more to process.
*/
if(args.length === arg) EndWith("NO-RESOURCES");

/* Start going down the line of
// arguments to collect resources.
// Any identified hash is applied
// directly to the resource before
// it. We know args[arg] going into
// the while is a resource, so the
// if statement will only be caught
// after srcs is prepared and ready.
*/
while(args[arg]){
  
  if(args[arg].substr(0,2) === "--"){
    
    srcs[srcs.length-1][0].push(args[arg].substr(2));
    
  }
  else{
    
    srcs.push([[],args[arg]]);
    
  }
  
  arg++;
  
}

/* After we have built the collection
// of resources, we simply the build
// to something Virtue can use.
*/
srcs = srcs.map((src) => (src[0].length === 0) ? src[1] : src );

/* Finally call Virtue with the
// resources and their hashes we've
// collected and respond to the
// user appropriately.
*/
VIRTUE.apply(null,srcs)
.then(
  (results) => {
    
    Message("RESULTS",results);
    
    Finish();
    
  },
  (error) => {
    
    switch(error.code){
      
      case "INVALID-RESOURCE": EndWith(error.code,JSON.stringify(srcs[error.arg-1]));
      
      case "INVALIDHASH": EndWith(error.code,error.hash);
      
      default: EndWith("UNKNOWN",error);
      
    }
    
  }
);

/* Output the message, and its data.
*/
function Message(
  message,
  data
){
  
  switch(message){
    
    case "HELP":{
      
      report.platform = PRO.platform;
      report.release  = OS.release();
      report.arch     = OS.arch();
      report.openssl  = PRO.versions.openssl;
      report.node     = PRO.versions.node;
      report.version  = PACKAGE.version;
      report.message  = "Submit arguments below in order from top-down:\n" +
        "\n" +
        "$ virtue\n" +
        "  [--json] Will print output in JSON only.\n" +
        "  [--help] Display this.\n" +
        "  [--hashes] List out the available hashes from Node's crypto module.\n" +
        "  [[--hash] ..] Override the default hash with these.\n" +
        "  <resource [[--hash] ..]> Adds a resource using any provided hashes.\n" +
        "\n" +
        "Find more information at " + PACKAGE.homepage;
      
      if(!(json)){
        
        console.log(" ");
        console.log("Platform: " + report.platform);
        console.log("Release: " + report.release);
        console.log("Arch: " + report.arch);
        console.log("OpenSSL: " + report.openssl);
        console.log("Node: " + report.node);
        console.log("Virtue: " + report.version);
        console.log(report.message);
        
      }
      
      break;
      
    }
    
    case "STARTING":{
      
      if(!(json)) console.log('Starting...');
      
      break;
      
    }
    
    case "HASHES":{
      
      report.hashes = data;
      
      if(!(json)) console.log(data);
      
      break;
      
    }
    
    case "RESULTS":{
      
      report.results = data;
      
      if(!(json)){
        
        console.log("Printing digests...\n");
        
        for(let resource of data){
          
          console.log("  " + resource.src);
          
          for(let digest in resource.digests){
            
            console.log("    " + digest + " === " + resource.digests[digest]);
            
          }
          
          console.log("  ");
          
        }
        
      }
      
      break;
      
    }
    
    case "DONE":{
      
      if(json) break;
      
      console.log('Done!');
      
    }
    
  }
  
}

/* Output the appropriate error
// response with the any available
// information, close and finish.
*/
function EndWith(
  error,
  data
){
  
  let message;
  
  switch(error){
    
    case "NO-ARGUMENTS":{
      
      message = "No arguments were provided.";
      
      break;
      
    }
    
    case "NO-RESOURCES":{
      
      message = "No resources were provided.";
      
      break;
      
    }
    
    case "INVALID-RESOURCE":{
      
      message = "An invalid resource was provided => " + data;
      
      break;
      
    }
    
    case "INVALID-HASH":{
      
      message = "An invalid hash was provided => " + data;
      
      if(json) report.hash = data;
      
      break;
      
    }
    
    case "UNKNOWN":{
      
      message = data;
      
      if(json) break;
      
      console.log(message);
      
      message = "The above is all what we know!";
      
    }
    
  }
  
  report.error   = error;
  report.message = message;
  
  if(!(json)) console.log("Error'd:",message,"\nUse virtue --help for additional information.");
  
  Finish();
  
}

/* Close and finish up the process.
*/
function Finish(
){
  
  Message("DONE");
  
  if(json) console.log(JSON.stringify(report));
  
  PRO.exit(0);
  
}

