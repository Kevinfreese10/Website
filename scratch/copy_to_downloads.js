const fs = require('fs');

const src = 'c:/myacc/scratch/Slaton_Loans_Form_2_Official.pdf';
const destDownloads = 'C:\\Users\\kev\\Downloads\\Slaton_Loans_Form_2_Completed.pdf';
const destPublic = 'c:/myacc/public/Slaton_Loans_Form_2_Official.pdf';

fs.copyFileSync(src, destDownloads);
fs.copyFileSync(src, destPublic);
console.log('Saved to Downloads:', destDownloads);
console.log('Saved to Public:', destPublic);
