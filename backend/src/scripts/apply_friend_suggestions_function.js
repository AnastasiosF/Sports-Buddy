const fs = require('fs');
const path = require('path');

// Since we can't execute the function directly, let's just output the SQL
async function printFunctionSQL() {
  try {
    console.log('📝 Friend Suggestions Database Function');
    console.log('=====================================');
    console.log('Please copy and paste this SQL into your Supabase SQL Editor:');
    console.log('');
    
    // Read the SQL function file
    const sqlPath = path.join(__dirname, '../../database/functions/get_friend_suggestions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log(sql);
    console.log('');
    console.log('=====================================');
    console.log('After running this SQL, the friend suggestions API will work!');
    
  } catch (error) {
    console.error('❌ Error reading SQL file:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  printFunctionSQL().then(() => process.exit(0));
}

module.exports = { printFunctionSQL };