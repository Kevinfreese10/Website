const fs = require('fs');
const path = require('path');

async function testRender() {
  console.log('Testing image render of Page 1...');
  // Check available rendering tools
  try {
    const sharp = require('c:/myacc/node_modules/sharp');
    console.log('Sharp available');
  } catch (e) {}
}

testRender();
