'use strict';

function failTest(error){
  
  console.log(error);
  
  process.exit(1);
  
}

const Virtue = require('./');
const srcs = [
  'https://raw.githubusercontent.com/METACEO/nodejs.virtue/master/LICENSE',
  'LICENSE'
];
const digests = [
  'wJV66LZ8OOkA1uskP4HL9OGO8zBOsYCHXcazw/vk+u4=',
  'TMIgQy7Xfhw0JDp2G1TvSPqqAoAe1Qhp13WduMm6uM9l3baZg1LyiShD+fbS9np8NjAZiG7RTS0TDUB/5ZVuQQ=='
];

function testShas(
  results,
  test
){
  
  function testShas(src){
    
    return (
      (results[src].digests.sha256 !== digests[0])
      ||
      (results[src].digests.sha512 !== digests[1])
    );
    
  }
  
  if(testShas(0)) failTest('Mismatching ' + test + ' remote digests.');
  if(testShas(1)) failTest('Mismatching ' + test + ' local digests.');
  
}

if(Virtue.name !== 'Virtue') throw new Error('Inclusion of Virtue.');

/* Try throwing different object types
// at Virtue.defaultHashes.
*/
function TestDefaultHashes(
){
  
  const No = (item) => (Virtue.defaultHashes(item)) ? item : false;
  const Yes = (item) => (No(item)) ? false : item;
  
  [
    No(null),
    No([]),
    No([true]),
    Yes('sha256'),
    Yes(['sha256']),
    Yes(['sha256','sha512'])
  ].forEach(
    (item) => (item) ? failTest('defaultHashes: '+JSON.stringify(item)) : null
  );
  
  TestProgrammaticResources();
  
}

/* Try resources via programmatically.
*/
function TestProgrammaticResources(
){
  
  Virtue.apply(null,srcs)
  .then(
    (results) => {
      
      testShas(results,'programmatic');
      
      TestCommandLineResources();
      
    }
  )
  .catch(failTest)
  
}

/* Try resources via command line.
*/
function TestCommandLineResources(
){
  
  const command = "node cli.js --json --sha256 --sha512 " + srcs[0] + " " +srcs[1];
  const options = {'cwd':__dirname};
  
  require('child_process').exec(
    command,
    options,
    (error,stdout,stderr) => {
      
      stdout = JSON.parse(stdout);
      
      if(error !== null) failTest(error);
      
      if(stderr.length > 0) failTest(stderr);
      
      if(stdout.error) failTest(stdout);
      
      testShas(stdout.results,'CLI');
      
    }
    
  );
  
}

TestDefaultHashes();

