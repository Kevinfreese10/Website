const fs = require('fs');

function findIdNumber() {
  ['id', 'cipc', 'saps'].forEach(k => {
    const buf = fs.readFileSync(`c:/myacc/scratch/10036_${k}.pdf`);
    // Search for 13-digit SA ID number patterns (YYMMDDSSSSCAZ)
    const str = buf.toString('latin1');
    const regex = /\b\d{6}\d{4}\d{3}\b/g;
    const matches = str.match(regex);
    console.log(`Matches in ${k}:`, matches);
  });
}

findIdNumber();
