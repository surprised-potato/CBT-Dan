const fs = require('fs');
const js = fs.readFileSync('src/features/assessment/details.page.js', 'utf-8');
// Just checking if there are glaring mistakes in the string HTML
console.log("File read successfully");
