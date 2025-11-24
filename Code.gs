// ============================================================================
// GitHub Contribution Tracker for Google Sheets
// ============================================================================
// Setup Instructions:
// 1. Create new Google Sheet
// 2. Extensions > Apps Script
// 3. Paste this entire code
// 4. Update CONFIG section below
// 5. Run: setupSheets() once to create sheets
// 6. Run: fetchContributions() to get data
// ============================================================================

// ============================================================================
// CONFIGURATION - Now reads from "Config" sheet!
// No need to edit code anymore - just edit cells in the sheet
// ============================================================================

function getConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let configSheet = ss.getSheetByName('Config');
  
  if (!configSheet) {
    throw new Error('Config sheet not found. Run setupSheets() first!');
  }
  
  // Read and aggressively clean token
  let token = configSheet.getRange('B2').getValue();
  
  if (!token) {
    throw new Error('Please add your GitHub token to Config sheet cell B2');
  }
  
  // Convert to string and remove ALL whitespace characters
  token = String(token);
  token = token.replace(/\s/g, ''); // Remove all whitespace (spaces, tabs, newlines, etc.)
  token = token.replace(/[\r\n\t]/g, ''); // Extra insurance for carriage returns and line breaks
  token = token.trim(); // Final cleanup
  
  if (token === '' || token === 'YOUR_GITHUB_TOKEN_HERE') {
    throw new Error('Please add your GitHub token to Config sheet cell B2');
  }
  
  // Parse repo owner and name
  // B4 can be either "repo-name" or "owner/repo-name"
  let repoOwner = String(configSheet.getRange('B3').getValue() || '').trim();
  let repoName = String(configSheet.getRange('B4').getValue() || '').trim();
  
  // If B4 contains "owner/repo" format, parse it
  if (repoName.includes('/')) {
    const parts = repoName.split('/');
    if (parts.length === 2) {
      repoOwner = parts[0].trim();  // Override B3 with owner from B4
      repoName = parts[1].trim();   // Extract just the repo name
      Logger.log(`Parsed repo format: ${repoOwner}/${repoName}`);
    }
  }
  
  return {
    githubToken: token,
    repoOwner: repoOwner,
    repoName: repoName,
    analysisDays: Number(configSheet.getRange('B7').getValue() || 0),
    startDate: String(configSheet.getRange('B8').getValue() || ''),
    endDate: String(configSheet.getRange('B9').getValue() || ''),
    
    weights: {
      // New 8-weight feature-first system
      featureCode: Number(configSheet.getRange('B12').getValue() || 3.0),
      bugFix: Number(configSheet.getRange('B13').getValue() || 2.0),
      testing: Number(configSheet.getRange('B14').getValue() || 0.4),
      highRefactoring: Number(configSheet.getRange('B15').getValue() || 0.7),
      mediumRefactoring: Number(configSheet.getRange('B16').getValue() || 0.3),
      lowRefactoring: Number(configSheet.getRange('B17').getValue() || 0.1),
      documentation: Number(configSheet.getRange('B18').getValue() || 0.3),
      supportCode: Number(configSheet.getRange('B19').getValue() || 0.5),
      
      // For backward compatibility with Summary sheet (uses simple code weight)
      code: Number(configSheet.getRange('B12').getValue() || 3.0)  // Uses feature weight as default
    }
  };
}

// ============================================================================
// MAIN FUNCTIONS - Run these from Apps Script menu
// ============================================================================

/**
 * Run this ONCE to set up the sheets
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // Warn user and get confirmation
  const existingSheets = ss.getSheets().map(s => s.getName());
  const trackerSheets = ['Config', 'Raw Data', 'Summary', 'Available Repos', 'Commit History'];
  const sheetsToDelete = existingSheets.filter(name => trackerSheets.includes(name));
  
  if (sheetsToDelete.length > 0) {
    const response = ui.alert(
      'Delete Existing Sheets?',
      `This will delete the following sheets to recreate them:\n\n${sheetsToDelete.join('\n')}\n\n` +
      'Your data will be lost. Continue?',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      ui.alert('Setup Cancelled', 'No sheets were modified.', ui.ButtonSet.OK);
      return;
    }
    
    // Delete existing tracker sheets
    sheetsToDelete.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        ss.deleteSheet(sheet);
        Logger.log(`Deleted sheet: ${sheetName}`);
      }
    });
  }
  
  // Create Config sheet FIRST
  let configSheet = ss.getSheetByName('Config');
  if (!configSheet) {
    configSheet = ss.insertSheet('Config', 0); // Insert as first sheet
  }
  configSheet.clear();
  
  // Make Config sheet pretty and user-friendly
  configSheet.getRange('A1').setValue('CONFIGURATION - Edit the values in column B')
    .setFontSize(14)
    .setFontWeight('bold')
    .setBackground('#4472C4')
    .setFontColor('#FFFFFF');
  configSheet.getRange('A1:B1').merge();
  
  // GitHub Settings
  configSheet.getRange('A2').setValue('GitHub Token:').setFontWeight('bold');
  configSheet.getRange('B2').setValue('');
  configSheet.getRange('B2').setBackground('#FFF2CC');
  configSheet.getRange('D2').setValue('Step 1: Add your GitHub token here')
    .setFontStyle('italic')
    .setFontColor('#0066CC')
    .setFontWeight('bold');
  
  configSheet.getRange('A3').setValue('Repo Owner:').setFontWeight('bold');
  configSheet.getRange('B3').setValue('');
  configSheet.getRange('B3').setBackground('#FFF2CC');
  configSheet.getRange('D3').setValue('Step 2: Select "GitHub Tracker" from top toolbar → "Auto-Fill My Username"')
    .setFontStyle('italic')
    .setFontColor('#0066CC')
    .setFontWeight('bold');
  
  configSheet.getRange('A4').setValue('Repo Name (or owner/repo):').setFontWeight('bold');
  configSheet.getRange('B4').setValue('');
  configSheet.getRange('B4').setBackground('#FFF2CC');
  configSheet.getRange('D4').setValue('Step 3: Select "GitHub Tracker" → "List Available Repos", then select a repo from dropdown')
    .setFontStyle('italic')
    .setFontColor('#0066CC')
    .setFontWeight('bold');
  configSheet.getRange('D5').setValue('Step 4: Select "GitHub Tracker" → "Fetch Contributions"')
    .setFontStyle('italic')
    .setFontColor('#0066CC')
    .setFontWeight('bold')
    .setFontSize(11);
  
  // Widen column D to fit instructions
  configSheet.setColumnWidth(4, 500);
  
  // Date Range
  configSheet.getRange('A6').setValue('Date Range Options:')
    .setFontWeight('bold')
    .setFontSize(12);
  
  configSheet.getRange('A7').setValue('Analysis Days (0 = entire repo history):');
  configSheet.getRange('B7').setValue(0);
  
  configSheet.getRange('A8').setValue('Start Date (YYYY-MM-DD or blank):');
  configSheet.getRange('B8').setValue('');
  
  configSheet.getRange('A9').setValue('End Date (YYYY-MM-DD or blank):');
  configSheet.getRange('B9').setValue('');
  
  // Contribution Weights
  configSheet.getRange('A11').setValue('🏆 CONTRIBUTION WEIGHTS (Feature-First System):')
    .setFontWeight('bold')
    .setFontSize(12)
    .setBackground('#E7E6E6');
  
  configSheet.getRange('A12').setValue('Feature Code Weight:');
  configSheet.getRange('B12').setValue(3.0);
  configSheet.getRange('D12').setValue('New functionality, original design (3x baseline)')
    .setFontStyle('italic')
    .setFontColor('#666666');
  
  configSheet.getRange('A13').setValue('Bug Fix Weight:');
  configSheet.getRange('B13').setValue(2.0);
  configSheet.getRange('D13').setValue('Debugging, fixing errors (2.0x baseline - high value work)')
    .setFontStyle('italic')
    .setFontColor('#666666');
  
  configSheet.getRange('A14').setValue('Testing Weight:');
  configSheet.getRange('B14').setValue(0.4);
  configSheet.getRange('D14').setValue('Test scripts, validation (0.4x - support work)')
    .setFontStyle('italic')
    .setFontColor('#666666');
  
  configSheet.getRange('A15').setValue('High Refactoring Weight:');
  configSheet.getRange('B15').setValue(0.7);
  configSheet.getRange('D15').setValue('Function extraction, algorithm improvements (0.7x)')
    .setFontStyle('italic')
    .setFontColor('#666666');
  
  configSheet.getRange('A16').setValue('Medium Refactoring Weight:');
  configSheet.getRange('B16').setValue(0.3);
  configSheet.getRange('D16').setValue('Variable renaming, reorganization (0.3x)')
    .setFontStyle('italic')
    .setFontColor('#666666');
  
  configSheet.getRange('A17').setValue('Low Refactoring Weight:');
  configSheet.getRange('B17').setValue(0.1);
  configSheet.getRange('D17').setValue('Formatting, whitespace only (0.1x)')
    .setFontStyle('italic')
    .setFontColor('#666666');
  
  configSheet.getRange('A18').setValue('Documentation Weight:');
  configSheet.getRange('B18').setValue(0.3);
  configSheet.getRange('D18').setValue('README, specs, design docs (0.3x)')
    .setFontStyle('italic')
    .setFontColor('#666666');
  
  configSheet.getRange('A19').setValue('Support Code Weight:');
  configSheet.getRange('B19').setValue(0.5);
  configSheet.getRange('D19').setValue('File moves, minor edits (0.5x)')
    .setFontStyle('italic')
    .setFontColor('#666666');
  
  // Instructions
  configSheet.getRange('A21').setValue('Quick Start:')
    .setFontWeight('bold')
    .setFontSize(12)
    .setBackground('#E7E6E6');
  
  configSheet.getRange('A22').setValue('1. Add GitHub token (B2) and repo info (B3-B4)');
  configSheet.getRange('A23').setValue('2. Set B8 start date to exclude instructor-provided code');
  configSheet.getRange('A24').setValue('3. Run "Fetch Contributions" - it does everything automatically!');
  configSheet.getRange('A25').setValue('4. View results in Summary, Raw Data, and Commit History sheets');
  
  configSheet.getRange('A27').setValue('📊 About the Weights:')
    .setFontWeight('bold')
    .setFontSize(11)
    .setBackground('#E7E6E6');
  configSheet.getRange('A27:B27').merge();
  
  configSheet.getRange('A28').setValue('Files are automatically categorized as Code or Documentation.')
    .setFontStyle('italic')
    .setFontColor('#666666')
    .setWrap(true);
  configSheet.getRange('A28:B28').merge();
  
  configSheet.getRange('A29').setValue('The Summary uses Feature Code weight (3.0x) for all code files.')
    .setFontStyle('italic')
    .setFontColor('#666666')
    .setWrap(true);
  configSheet.getRange('A29:B29').merge();
  
  
  // Instructions
  configSheet.getRange('A21').setValue('Quick Start:')
    .setFontWeight('bold')
    .setFontSize(12)
    .setBackground('#E7E6E6');
  
  configSheet.getRange('A22').setValue('1. Add GitHub token (B2) and repo info (B3-B4)');
  configSheet.getRange('A23').setValue('2. Set B8 start date to exclude instructor-provided code');
  configSheet.getRange('A24').setValue('3. Run "Fetch Contributions" - it does everything automatically!');
  configSheet.getRange('A25').setValue('4. View results in Summary, Raw Data, and Commit History sheets');
  
  configSheet.getRange('A27').setValue('📊 About the Weights:')
    .setFontWeight('bold')
    .setFontSize(11)
    .setBackground('#E7E6E6');
  configSheet.getRange('A27:B27').merge();
  
  configSheet.getRange('A28').setValue('Commits are automatically categorized into 8 work types based on content and keywords.')
    .setFontStyle('italic')
    .setFontColor('#666666')
    .setWrap(true);
  configSheet.getRange('A28:B28').merge();
  
  configSheet.getRange('A29').setValue('Each work type has a point multiplier shown above. Change them to match your team\'s priorities!')
    .setFontStyle('italic')
    .setFontColor('#666666')
    .setWrap(true);
  configSheet.getRange('A29:B29').merge();
  
  configSheet.getRange('A30').setValue('💡 After changing weights, run "GitHub Tracker → Recalculate Scores" to update points instantly.')
    .setFontStyle('italic')
    .setFontColor('#0066CC')
    .setFontWeight('bold')
    .setWrap(true);
  configSheet.getRange('A30:B30').merge();
  
  // Auto-resize columns
  configSheet.autoResizeColumns(1, 2);
  configSheet.setColumnWidth(1, 300);
  configSheet.setColumnWidth(2, 200);
  
  // === INSTRUCTIONS SECTION ===
  configSheet.getRange('A34').setValue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    .setFontColor('#CCCCCC');
  
  configSheet.getRange('A35').setValue('📖 HOW TO USE THIS TOOL')
    .setFontWeight('bold')
    .setFontSize(14)
    .setBackground('#4472C4')
    .setFontColor('#FFFFFF');
  configSheet.getRange('A35:B35').merge();
  
  configSheet.getRange('A37').setValue('STEP 1: Get Your GitHub Token')
    .setFontWeight('bold')
    .setBackground('#E7E6E6');
  configSheet.getRange('A38').setValue('• Go to: github.com/settings/tokens');
  configSheet.getRange('A39').setValue('• Click "Generate new token (classic)"');
  configSheet.getRange('A40').setValue('• Check the "repo" scope');
  configSheet.getRange('A41').setValue('• Copy the token (starts with ghp_)');
  configSheet.getRange('A42').setValue('• Paste into cell B2 above ↑');
  
  configSheet.getRange('A44').setValue('STEP 2: Auto-Fill Your Username')
    .setFontWeight('bold')
    .setBackground('#E7E6E6');
  configSheet.getRange('A45').setValue('• Look for "GitHub Tracker" in the top menu bar');
  configSheet.getRange('A46').setValue('• Click: GitHub Tracker > Auto-Fill My Username');
  configSheet.getRange('A47').setValue('• Cell B3 will automatically fill with your username!');
  configSheet.getRange('A48').setValue('• (Or manually type a username/org to analyze)');
  
  configSheet.getRange('A50').setValue('STEP 3: Choose a Repository')
    .setFontWeight('bold')
    .setBackground('#E7E6E6');
  configSheet.getRange('A44').setValue('Option A - Browse All Repos:');
  configSheet.getRange('A45').setValue('  • GitHub Tracker > 3. List Available Repos');
  configSheet.getRange('A46').setValue('  • New "Available Repos" sheet appears');
  configSheet.getRange('A47').setValue('  • Click a row, then: 4. Select Repo from List');
  configSheet.getRange('A48').setValue('  • OR use dropdown in B4 - shows "owner/repo" format');
  configSheet.getRange('A49').setValue('Option B - Enter Manually:');
  configSheet.getRange('A50').setValue('  • Type "owner/repo" in B4 (e.g., "jmckinley/my-app")');
  
  configSheet.getRange('A52').setValue('STEP 4: Analyze Contributions!')
    .setFontWeight('bold')
    .setBackground('#E7E6E6');
  configSheet.getRange('A53').setValue('• GitHub Tracker > 5. Fetch Contributions');
  configSheet.getRange('A54').setValue('• Wait 2-5 minutes while it fetches data');
  configSheet.getRange('A55').setValue('• Summary sheet will automatically open with results!');
  
  configSheet.getRange('A57').setValue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    .setFontColor('#CCCCCC');
  
  // === SHEET DESCRIPTIONS ===
  configSheet.getRange('A59').setValue('📋 WHAT EACH SHEET CONTAINS')
    .setFontWeight('bold')
    .setFontSize(14)
    .setBackground('#70AD47')
    .setFontColor('#FFFFFF');
  configSheet.getRange('A59:B59').merge();
  
  configSheet.getRange('A60').setValue('📊 Config (This Sheet)')
    .setFontWeight('bold')
    .setBackground('#FFF2CC');
  configSheet.getRange('A61').setValue('• Your settings: GitHub token, repo owner, repo name');
  configSheet.getRange('A62').setValue('• Contribution weights: adjust how different work is scored');
  configSheet.getRange('A63').setValue('• Date range options: analyze entire repo history, or specific dates');
  configSheet.getRange('A64').setValue('• Scoring modifiers: fine-tune how points are calculated');
  
  configSheet.getRange('A66').setValue('📈 Summary')
    .setFontWeight('bold')
    .setBackground('#FFF2CC');
  configSheet.getRange('A67').setValue('• Detailed breakdown for each contributor');
  configSheet.getRange('A68').setValue('• Top 5 files they worked on with point values');
  configSheet.getRange('A69').setValue('• Activity summary: commits, PRs, reviews, issues');
  configSheet.getRange('A70').setValue('• Score breakdown by type: code, docs, reviews, issues');
  configSheet.getRange('A71').setValue('• Total weighted score for each person');
  configSheet.getRange('A72').setValue('→ This is your main results sheet!');
  
  configSheet.getRange('A74').setValue('📑 Raw Data')
    .setFontWeight('bold')
    .setBackground('#FFF2CC');
  configSheet.getRange('A75').setValue('• Unprocessed numbers from GitHub API');
  configSheet.getRange('A76').setValue('• Commits, code lines, doc lines, test lines');
  configSheet.getRange('A77').setValue('• PRs created, merged, reviewed');
  configSheet.getRange('A78').setValue('• Issues created and commented on');
  configSheet.getRange('A79').setValue('• One row per contributor with all their stats');
  
  configSheet.getRange('A81').setValue('📚 Available Repos (Optional)')
    .setFontWeight('bold')
    .setBackground('#FFF2CC');
  configSheet.getRange('A82').setValue('• Only appears after running "List Available Repos"');
  configSheet.getRange('A83').setValue('• Shows ALL repositories your token can access');
  configSheet.getRange('A84').setValue('• Sorted by most recently updated');
  configSheet.getRange('A85').setValue('• Includes owner, name, public/private status, description');
  configSheet.getRange('A86').setValue('• Browse and pick repos to analyze');
  
  configSheet.getRange('A88').setValue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    .setFontColor('#CCCCCC');
  
  // === TIPS SECTION ===
  configSheet.getRange('A90').setValue('💡 HELPFUL TIPS')
    .setFontWeight('bold')
    .setFontSize(14)
    .setBackground('#ED7D31')
    .setFontColor('#FFFFFF');
  configSheet.getRange('A90:B90').merge();
  
  configSheet.getRange('A92').setValue('Adjusting Weights:')
    .setFontWeight('bold');
  configSheet.getRange('A93').setValue('• Defaults recognize that reviews take serious effort');
  configSheet.getRange('A94').setValue('• Code: 1.0, Docs: 0.7, Reviews: 1.0, Issues: 0.6');
  configSheet.getRange('A95').setValue('• Review approval = 15 pts (up from 5) - reviews are work!');
  configSheet.getRange('A96').setValue('• Merged PR bonus = 1.5x (up from 1.2x) - validated work counts');
  configSheet.getRange('A97').setValue('• Re-run "Fetch Contributions" to recalculate with new weights');
  
  configSheet.getRange('A98').setValue('Date Ranges:')
    .setFontWeight('bold');
  configSheet.getRange('A99').setValue('• Cell B7 = 0: Analyzes entire repo history (creation to today)');
  configSheet.getRange('A100').setValue('• Cell B7 = 30: Analyzes last 30 days only');
  configSheet.getRange('A101').setValue('• Cell B7 = 0 + dates in B8/B9: Use custom date range');
  configSheet.getRange('A102').setValue('• Leave B8 blank: Starts from repo creation date');
  configSheet.getRange('A103').setValue('• Leave B9 blank: Goes through today');
  configSheet.getRange('A103').setValue('• Leave B9 blank to analyze through today');
  
  configSheet.getRange('A105').setValue('Switching Repos:')
    .setFontWeight('bold');
  configSheet.getRange('A106').setValue('• Use dropdowns in B3 (owner) and B4 (repo name)');
  configSheet.getRange('A107').setValue('• Or just type new values directly');
  configSheet.getRange('A108').setValue('• Run "5. Fetch Contributions" again');
  configSheet.getRange('A109').setValue('• Results update in Summary sheet');
  configSheet.getRange('A110').setValue('• Raw Data sheet updates with new repo data');
  
  configSheet.getRange('A112').setValue('Sharing Results:')
    .setFontWeight('bold');
  configSheet.getRange('A113').setValue('• Click Share button (top right) to share with team');
  configSheet.getRange('A114').setValue('• Copy Summary sheet sections to paste into reports');
  configSheet.getRange('A115').setValue('• Export Summary sheet as PDF for presentations');
  configSheet.getRange('A116').setValue('• Make a copy (File > Make a copy) to analyze different repos');
  
  configSheet.getRange('A116').setValue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    .setFontColor('#CCCCCC');
  
  // === TROUBLESHOOTING ===
  configSheet.getRange('A118').setValue('🔧 TROUBLESHOOTING')
    .setFontWeight('bold')
    .setFontSize(14)
    .setBackground('#C00000')
    .setFontColor('#FFFFFF');
  configSheet.getRange('A118:B118').merge();
  
  configSheet.getRange('A120').setValue('"GitHub API Error: 401"')
    .setFontWeight('bold')
    .setFontColor('#C00000');
  configSheet.getRange('A121').setValue('→ Token is invalid or expired. Generate a new token.');
  
  configSheet.getRange('A123').setValue('"GitHub API Error: 404"')
    .setFontWeight('bold')
    .setFontColor('#C00000');
  configSheet.getRange('A124').setValue('→ Repo not found. Check spelling of owner (B3) and repo (B4).');
  
  configSheet.getRange('A126').setValue('"Could not detect username"')
    .setFontWeight('bold')
    .setFontColor('#C00000');
  configSheet.getRange('A127').setValue('→ Token issue. Make sure it has "repo" scope checked.');
  
  configSheet.getRange('A129').setValue('Files show "0.0 pts"')
    .setFontWeight('bold')
    .setFontColor('#C00000');
  configSheet.getRange('A130').setValue('→ Old data. Re-run "Fetch Contributions" to get file-level details.');
  
  configSheet.getRange('A132').setValue('Menu not showing')
    .setFontWeight('bold')
    .setFontColor('#C00000');
  configSheet.getRange('A133').setValue('→ Refresh the page (Cmd+R or F5). Menu appears after page loads.');
  
  configSheet.getRange('A135').setValue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    .setFontColor('#CCCCCC');
  
  // === QUICK REFERENCE ===
  configSheet.getRange('A137').setValue('⚡ QUICK REFERENCE')
    .setFontWeight('bold')
    .setFontSize(14)
    .setBackground('#5B9BD5')
    .setFontColor('#FFFFFF');
  configSheet.getRange('A137:B137').merge();
  
  configSheet.getRange('A139').setValue('Menu Location:')
    .setFontWeight('bold');
  configSheet.getRange('A140').setValue('Look at the top menu bar → "GitHub Tracker" (after Help)');
  
  configSheet.getRange('A142').setValue('Common Workflow:')
    .setFontWeight('bold');
  configSheet.getRange('A143').setValue('1. Paste token (B2) → 2. Auto-fill username → 3. List repos → 4. Fetch!');
  
  configSheet.getRange('A145').setValue('Get Help:')
    .setFontWeight('bold');
  configSheet.getRange('A146').setValue('• Check cells above for common errors');
  configSheet.getRange('A147').setValue('• Read the troubleshooting section');
  configSheet.getRange('A148').setValue('• Make sure token has "repo" scope at github.com/settings/tokens');
  
  // Create Raw Data sheet
  let rawSheet = ss.getSheetByName('Raw Data');
  if (!rawSheet) {
    rawSheet = ss.insertSheet('Raw Data');
  }
  rawSheet.clear();
  
  // Headers
  const headers = [
    'Contributor', 'Commits', 'Code Lines', 'Doc Lines', 'Test Lines',
    'PRs Created', 'PRs Merged', 'PRs Reviewed', 'Review Comments',
    'Issues Created', 'Issue Comments'
  ];
  rawSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  rawSheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4472C4')
    .setFontColor('#FFFFFF');
  
  // Create Summary sheet
  let summarySheet = ss.getSheetByName('Summary');
  if (!summarySheet) {
    summarySheet = ss.insertSheet('Summary');
  }
  summarySheet.clear();
  
  // Title
  summarySheet.getRange('A1').setValue('GitHub Contribution Summary')
    .setFontSize(16)
    .setFontWeight('bold');
  
  // Note about where weights come from
  summarySheet.getRange('A3').setValue('Note: Weights are read from the Config sheet')
    .setFontStyle('italic')
    .setFontColor('#666666');
  
  // Instructions
  summarySheet.getRange('A5').setValue('Detailed contribution breakdowns will appear below after running "Fetch Contributions"')
    .setFontStyle('italic')
    .setFontColor('#666666');
  
  // Make Config sheet active so user sees it
  configSheet.activate();
  
  SpreadsheetApp.getUi().alert(
    'Setup Complete!',
    '✅ Config sheet created\n\n' +
    'Next steps:\n' +
    '1. Edit cell B2 with your GitHub token\n' +
    '2. Run: GitHub Tracker > Auto-Fill My Username\n' +
    '3. Pick a repo from "List Available Repos" or enter manually\n' +
    '4. Run: Fetch Contributions',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Run this to fetch GitHub data and populate sheets
 */
function fetchContributions() {
  const ui = SpreadsheetApp.getUi();
  
  // Get config from sheet
  let CONFIG;
  try {
    CONFIG = getConfig();
    Logger.log('✓ Config loaded successfully');
    Logger.log(`  Token: ${CONFIG.githubToken.substring(0, 10)}...`);
    Logger.log(`  Owner: ${CONFIG.repoOwner}`);
    Logger.log(`  Repo: ${CONFIG.repoName}`);
    Logger.log(`  Analysis Days: ${CONFIG.analysisDays}`);
  } catch (e) {
    Logger.log('❌ Failed to load config: ' + e.message);
    ui.alert('Error', 'Please run "Setup Sheets" first!', ui.ButtonSet.OK);
    return;
  }
  
  // Validate config
  if (!CONFIG.githubToken || CONFIG.githubToken === 'YOUR_GITHUB_TOKEN_HERE') {
    ui.alert('Configuration Error', 
             'Please edit the Config sheet:\n\n' +
             '1. Go to the Config sheet\n' +
             '2. Edit cell B2 with your GitHub token\n' +
             '3. Run "Auto-Fill My Username" or manually set owner/repo', 
             ui.ButtonSet.OK);
    
    // Switch to Config sheet
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config').activate();
    return;
  }
  
  // Auto-detect username if B3 is empty or default
  if (!CONFIG.repoOwner || CONFIG.repoOwner === 'your-org-name') {
    const response = ui.alert('Auto-Detect Username?',
                             'Repo owner is not set. Would you like me to auto-fill it with your GitHub username?',
                             ui.ButtonSet.YES_NO);
    
    if (response == ui.Button.YES) {
      try {
        const userUrl = 'https://api.github.com/user';
        const userInfo = makeGitHubRequest(userUrl, CONFIG);
        const username = userInfo.login;
        
        // Update Config sheet
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config').getRange('B3').setValue(username);
        CONFIG.repoOwner = username;
        
        ui.alert('Username Detected', 
                `Set repo owner to: ${username}\n\nPlease also set the repo name in Config cell B4.`,
                ui.ButtonSet.OK);
        
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config').activate();
        return;
      } catch (e) {
        ui.alert('Error', 'Could not auto-detect username. Please set it manually in Config sheet.', ui.ButtonSet.OK);
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config').activate();
        return;
      }
    } else {
      ui.alert('Configuration Required',
               'Please set repo owner and repo name in Config sheet cells B3 and B4.',
               ui.ButtonSet.OK);
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config').activate();
      return;
    }
  }
  
  if (!CONFIG.repoName || CONFIG.repoName === 'your-repo-name') {
    ui.alert('Configuration Error',
             'Please edit cell B4 in the Config sheet with your repository name.',
             ui.ButtonSet.OK);
    
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config').activate();
    return;
  }
  
  Logger.log('='.repeat(60));
  Logger.log('STARTING GITHUB DATA FETCH');
  Logger.log(`Repository: ${CONFIG.repoOwner}/${CONFIG.repoName}`);
  Logger.log('='.repeat(60));
  
  ui.alert('Starting comprehensive data fetch.\n\nThis will:\n• Fetch contributions\n• Populate commit history\n• Create detailed analysis\n\nThis may take 3-7 minutes...');
  
  try {
    const dateRange = getDateRange(CONFIG);
    Logger.log(`Date range: ${dateRange.start} to ${dateRange.end}`);
    
    const contributors = {};
    
    // Fetch commits
    Logger.log('\n### FETCHING COMMITS ###');
    fetchCommits(contributors, dateRange.start, CONFIG);
    Logger.log(`Contributors after commits: ${Object.keys(contributors).length}`);
    Logger.log(`Contributors: ${Object.keys(contributors).join(', ')}`);
    
    // Fetch PRs
    Logger.log('\n### FETCHING PULL REQUESTS ###');
    fetchPullRequests(contributors, dateRange.start, CONFIG);
    Logger.log(`Contributors after PRs: ${Object.keys(contributors).length}`);
    
    // Fetch issues
    Logger.log('\n### FETCHING ISSUES ###');
    fetchIssues(contributors, dateRange.start, CONFIG);
    Logger.log(`Contributors after issues: ${Object.keys(contributors).length}`);
    
    Logger.log('\n### FINAL CONTRIBUTOR COUNT ###');
    Logger.log(`Total contributors found: ${Object.keys(contributors).length}`);
    
    if (Object.keys(contributors).length === 0) {
      Logger.log('❌ WARNING: No contributors found!');
      ui.alert('No Data Found',
               `No contributions found for ${CONFIG.repoOwner}/${CONFIG.repoName}\n\n` +
               `Possible reasons:\n` +
               `• Repository has no commits in the date range\n` +
               `• Date range is too narrow (currently ${CONFIG.analysisDays} days)\n` +
               `• Repository is empty\n\n` +
               `Check View > Logs for detailed information.`,
               ui.ButtonSet.OK);
      return;
    }
    
    // Log contributor details
    Object.keys(contributors).forEach(username => {
      const stats = contributors[username];
      Logger.log(`  ${username}: ${stats.commits} commits, ${stats.codeLines} code lines, ${stats.prsCreated} PRs`);
    });
    
    // Write to sheets
    Logger.log('\n### WRITING TO SHEETS ###');
    writeRawData(contributors);
    Logger.log('✓ Raw data written');
    
    writeSummaryData(contributors, CONFIG);
    Logger.log('✓ Summary data written');
    
    // === NEW: POPULATE COMMIT HISTORY ===
    Logger.log('\n### POPULATING COMMIT HISTORY ###');
    try {
      populateCommitHistory(dateRange.start, CONFIG);
      Logger.log('✓ Commit history populated');
    } catch (e) {
      Logger.log('⚠️ Warning: Could not populate commit history: ' + e.message);
      // Don't fail the whole process if this fails
    }
    
    // Switch to Summary sheet to show results
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Summary').activate();
    
    ui.alert('Success!', 
             `Data fetched successfully!\n\n` +
             `Found ${Object.keys(contributors).length} contributor(s).\n\n` +
             `✓ Summary sheet updated\n` +
             `✓ Raw data sheet updated\n` +
             `✓ Commit History sheet populated\n\n` +
             `Check all tabs for detailed analysis!`,
             ui.ButtonSet.OK);
             
    Logger.log('='.repeat(60));
    Logger.log('FETCH COMPLETED SUCCESSFULLY');
    Logger.log('='.repeat(60));
  } catch (error) {
    Logger.log('\n' + '='.repeat(60));
    Logger.log('❌ ERROR OCCURRED');
    Logger.log('='.repeat(60));
    Logger.log('Error message: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    
    ui.alert('Error', 
             `Failed to fetch data:\n\n${error.message}\n\n` +
             `Check View > Logs in the Apps Script editor for details.`,
             ui.ButtonSet.OK);
  }
}

// ============================================================================
// DATE RANGE HANDLING
// ============================================================================

function getDateRange(CONFIG) {
  let startDate, endDate;
  
  if (CONFIG.analysisDays > 0) {
    // Use days-based window
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(startDate.getDate() - CONFIG.analysisDays);
  } else {
    // Use custom date range
    endDate = CONFIG.endDate ? new Date(CONFIG.endDate) : new Date();
    
    if (CONFIG.startDate) {
      startDate = new Date(CONFIG.startDate);
    } else {
      // Get repo creation date
      startDate = getRepoCreationDate(CONFIG);
    }
  }
  
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
}

function calculateSinceDate(CONFIG) {
  const dateRange = getDateRange(CONFIG);
  return dateRange.start;
}

/**
 * Populate Commit History sheet (called from fetchContributions)
 */
function populateCommitHistory(sinceDate, CONFIG) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create or get the Commit History sheet
  let historySheet = ss.getSheetByName('Commit History');
  if (!historySheet) {
    historySheet = ss.insertSheet('Commit History');
  } else {
    historySheet.clear();
  }
  
  // Set up headers
  const headers = [
    'Commit SHA',
    'Date',
    'Author Name',
    'Author Email', 
    'Committer Name',
    'Committer Email',
    'Message',
    'Files Changed',
    'Additions',
    'Deletions',
    'Total Changes',
    'Is Merge',
    'Parent Count',
    'Code Files',
    'Doc Files',
    'Test Files',
    'Data Files',
    'Other Files',
    'Top Files (with changes)',
    'Co-Authors'
  ];
  
  historySheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#4472C4')
    .setFontColor('#FFFFFF')
    .setWrap(true);
  
  // Freeze header row
  historySheet.setFrozenRows(1);
  
  // Set column widths
  historySheet.setColumnWidth(1, 100);  // SHA
  historySheet.setColumnWidth(2, 120);  // Date
  historySheet.setColumnWidth(3, 150);  // Author Name
  historySheet.setColumnWidth(4, 200);  // Author Email
  historySheet.setColumnWidth(5, 150);  // Committer Name
  historySheet.setColumnWidth(6, 200);  // Committer Email
  historySheet.setColumnWidth(7, 300);  // Message
  historySheet.setColumnWidth(8, 80);   // Files Changed
  historySheet.setColumnWidth(19, 300); // Top Files
  historySheet.setColumnWidth(20, 200); // Co-Authors
  
  const commitRows = [];
  let page = 1;
  const maxPages = 20; // More pages for detailed history
  
  Logger.log('Fetching commit history for Commit History sheet...');
  
  while (page <= maxPages) {
    const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/commits?since=${sinceDate}&per_page=100&page=${page}`;
    const commits = makeGitHubRequest(url, CONFIG);
    
    if (!commits || commits.length === 0) break;
    
    Logger.log(`Processing page ${page} for commit history, ${commits.length} commits`);
    
    commits.forEach((commit, idx) => {
      try {
        // Get full commit details
        const commitDetail = makeGitHubRequest(commit.url, CONFIG);
        
        if (!commitDetail) return;
        
        // Basic info
        const sha = commitDetail.sha.substring(0, 7);
        const date = new Date(commitDetail.commit.author.date);
        const authorName = commitDetail.commit.author.name;
        const authorEmail = commitDetail.commit.author.email;
        const committerName = commitDetail.commit.committer.name;
        const committerEmail = commitDetail.commit.committer.email;
        const message = commitDetail.commit.message.split('\n')[0]; // First line only
        
        // Stats
        const stats = commitDetail.stats || {};
        const additions = stats.additions || 0;
        const deletions = stats.deletions || 0;
        const totalChanges = additions + deletions;
        
        // Merge detection
        const parentCount = commitDetail.parents ? commitDetail.parents.length : 0;
        const isMerge = parentCount > 1 ? 'YES' : 'NO';
        
        // File categorization
        const files = commitDetail.files || [];
        const filesChanged = files.length;
        
        let codeFiles = 0;
        let docFiles = 0;
        let testFiles = 0;
        let dataFiles = 0;
        let otherFiles = 0;
        
        const topFiles = [];
        
        files.forEach(file => {
          const category = categorizeFile(file.filename);
          const changes = (file.additions || 0) + (file.deletions || 0);
          
          if (category === 'code') codeFiles++;
          else if (category === 'docs') docFiles++;
          else if (category === 'tests') testFiles++;
          else if (category === 'data') dataFiles++;
          else otherFiles++;
          
          // Track top files
          if (topFiles.length < 5) {
            topFiles.push(`${file.filename} (${changes})`);
          }
        });
        
        // Parse co-authors
        const coAuthors = parseCoAuthors(commitDetail.commit.message);
        const coAuthorsStr = coAuthors.length > 0 ? coAuthors.join(', ') : '';
        
        // Create row
        const row = [
          sha,
          date,
          authorName,
          authorEmail,
          committerName,
          committerEmail,
          message,
          filesChanged,
          additions,
          deletions,
          totalChanges,
          isMerge,
          parentCount,
          codeFiles,
          docFiles,
          testFiles,
          dataFiles,
          otherFiles,
          topFiles.join(', '),
          coAuthorsStr
        ];
        
        commitRows.push(row);
        
      } catch (e) {
        Logger.log(`Error processing commit ${commit.sha}: ${e.message}`);
      }
    });
    
    page++;
  }
  
  Logger.log(`Total commits for history: ${commitRows.length}`);
  
  // Write all rows at once (more efficient)
  if (commitRows.length > 0) {
    historySheet.getRange(2, 1, commitRows.length, commitRows[0].length)
      .setValues(commitRows);
    
    // Format the date column
    historySheet.getRange(2, 2, commitRows.length, 1)
      .setNumberFormat('yyyy-mm-dd hh:mm:ss');
    
    // Add alternating row colors for readability
    for (let i = 0; i < commitRows.length; i++) {
      const row = i + 2;
      const isMerge = commitRows[i][11]; // Is Merge column
      
      if (isMerge === 'YES') {
        // Highlight merge commits in yellow
        historySheet.getRange(row, 1, 1, headers.length)
          .setBackground('#FFF3CD');
      } else if (i % 2 === 0) {
        // Alternating white/light gray
        historySheet.getRange(row, 1, 1, headers.length)
          .setBackground('#F8F9FA');
      }
    }
    
    Logger.log(`✓ Commit History sheet populated with ${commitRows.length} commits`);
  }
}

function getRepoCreationDate(CONFIG) {
  const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}`;
  const response = makeGitHubRequest(url, CONFIG);
  const createdDate = new Date(response.created_at);
  
  // Subtract 1 day to ensure we catch the very first commit
  // (sometimes the first commit timestamp is slightly before repo creation)
  createdDate.setDate(createdDate.getDate() - 1);
  
  Logger.log(`Repo created at: ${response.created_at}, using start date: ${createdDate.toISOString()}`);
  
  return createdDate;
}

// ============================================================================
// GITHUB API CALLS
// ============================================================================

function makeGitHubRequest(url, CONFIG) {
  // Validate token
  if (!CONFIG || !CONFIG.githubToken) {
    throw new Error('GitHub token is missing from CONFIG');
  }
  
  // Aggressively clean the token - remove ALL whitespace, line breaks, carriage returns, tabs
  let cleanToken = String(CONFIG.githubToken);
  
  // Remove all types of whitespace: spaces, tabs, newlines, carriage returns, etc.
  cleanToken = cleanToken.replace(/\s/g, ''); // \s matches all whitespace characters
  cleanToken = cleanToken.replace(/[\r\n\t]/g, ''); // Extra insurance for line breaks
  cleanToken = cleanToken.trim(); // Final trim
  
  if (!cleanToken || cleanToken === '' || cleanToken === 'YOUR_GITHUB_TOKEN_HERE') {
    throw new Error('Please set a valid GitHub token in Config sheet cell B2');
  }
  
  // Validate token format (should start with ghp_ or similar)
  if (!cleanToken.match(/^(ghp_|github_pat_)/)) {
    throw new Error('Token format invalid. GitHub tokens should start with ghp_ or github_pat_');
  }
  
  const options = {
    method: 'get',
    headers: {
      'Authorization': 'token ' + cleanToken,
      'Accept': 'application/vnd.github.v3+json'
    },
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  
  if (response.getResponseCode() !== 200) {
    throw new Error(`GitHub API Error: ${response.getResponseCode()} - ${response.getContentText()}`);
  }
  
  return JSON.parse(response.getContentText());
}

function fetchCommits(contributors, sinceDate, CONFIG) {
  let page = 1;
  const maxPages = 10;
  const sinceTime = new Date(sinceDate).getTime();
  
  while (page <= maxPages) {
    const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/commits?since=${sinceDate}&per_page=100&page=${page}`;
    const commits = makeGitHubRequest(url, CONFIG);
    
    if (!commits || commits.length === 0) break;
    
    commits.forEach(commit => {
      // Get commit details first to analyze it
      const commitDetail = makeGitHubRequest(commit.url, CONFIG);
      
      // Layer 3: CHECK COMMIT MESSAGE for external/provided code patterns
      // Be specific to avoid false positives
      const commitMessage = commitDetail.commit.message;
      const firstLine = commitMessage.split('\n')[0].toLowerCase();
      
      const externalCodePatterns = [
        /^add.*libcs\d+/i,              // "Add libcs50 files"
        /^add.*library.*files/i,        // "Add library files" (must have both "library" AND "files")
        /provided.*files/i,             // "provided files" or "instructor provided files"
        /starter.*code/i,               // "starter code"
        /instructor.*provided/i,        // "instructor provided"
        /from\s+instructor/i,           // "from instructor" (with space to avoid "transformInstructor")
        /^import.*libcs\d+/i,           // "Import libcs50"
        /cs50.*given/i                  // "CS50 given files"
      ];
      
      for (let pattern of externalCodePatterns) {
        if (firstLine.match(pattern)) {
          Logger.log(`⏭️ Skipping external code commit: ${commitDetail.sha.substring(0, 7)} - "${commitDetail.commit.message.split('\n')[0]}"`);
          return;  // Skip entire commit
        }
      }
      
      // Layer 1: CHECK DATE - Skip commits before start date
      const commitDate = new Date(commitDetail.commit.author.date).getTime();
      if (commitDate < sinceTime) {
        Logger.log(`⏭️ Skipping commit before start date: ${commitDetail.sha.substring(0, 7)} (${commitDetail.commit.author.date}) - "${commitDetail.commit.message.split('\n')[0]}"`);
        return;
      }
      
      // SKIP merge commits (they don't represent new work)
      if (commitDetail.parents && commitDetail.parents.length > 1) {
        Logger.log(`Skipping merge commit: ${commitDetail.sha.substring(0, 7)} - ${commitDetail.commit.message.split('\n')[0]}`);
        return;
      }
      
      // Count total changes in this commit
      const stats = commitDetail.stats || {};
      const totalChanges = (stats.additions || 0) + (stats.deletions || 0);
      
      // SKIP commits with no actual changes (test-only, empty commits)
      if (totalChanges === 0) {
        Logger.log(`Skipping empty commit: ${commitDetail.sha.substring(0, 7)} - ${commitDetail.commit.message.split('\n')[0]}`);
        return;
      }
      
      // Use GitHub username if available, fallback to git author name
      // commitDetail.author.login = GitHub username (preferred, unique)
      // commitDetail.commit.author.name = Git config name (fallback if not on GitHub)
      let author;
      if (commitDetail.author && commitDetail.author.login) {
        author = commitDetail.author.login;
        Logger.log(`Using GitHub username: ${author}`);
      } else if (commitDetail.committer && commitDetail.committer.login) {
        author = commitDetail.committer.login;
        Logger.log(`Using GitHub username from committer: ${author}`);
      } else {
        // Fallback to git author name (only if user not on GitHub)
        const rawAuthor = commitDetail.commit.author.name;
        author = normalizeAuthorName(rawAuthor);
        Logger.log(`Fallback to git name: "${rawAuthor}" → "${author}"`);
      }
      
      Logger.log(`Processing commit: ${commitDetail.sha.substring(0, 7)} by ${author} (${totalChanges} changes)`);
      
      if (!contributors[author]) {
        contributors[author] = createContributorObject();
      }
      
      contributors[author].commits++;
      
      // Process the main author's contributions
      processCommitDetails(contributors[author], commitDetail);
      
      // Parse and process co-authors from commit message
      const coAuthors = parseCoAuthors(commitDetail.commit.message);
      if (coAuthors.length > 0) {
        Logger.log(`Found ${coAuthors.length} co-authors: ${coAuthors.join(', ')}`);
      }
      
      coAuthors.forEach(coAuthor => {
        if (!contributors[coAuthor]) {
          contributors[coAuthor] = createContributorObject();
        }
        // Co-authors get credit for the same file changes
        // (they worked on this together)
        processCommitDetails(contributors[coAuthor], commitDetail);
        // But don't increment commit count for co-authors
        // (only the main author's commit count increases)
      });
    });
    
    page++;
  }
  
  // Log final summary
  Logger.log('\n📊 ===== FINAL CONTRIBUTION SUMMARY =====');
  Object.keys(contributors).forEach(username => {
    const stats = contributors[username];
    Logger.log(`\n👤 ${username}:`);
    Logger.log(`  Commits: ${stats.commits}`);
    Logger.log(`  Code lines: ${stats.codeLines}`);
    Logger.log(`  Doc lines: ${stats.docLines}`);
    Logger.log(`  Test lines: ${stats.testLines}`);
    Logger.log(`  Total files: ${Object.keys(stats.fileContributions).length}`);
    
    // Show breakdown by category
    const categories = { code: 0, docs: 0, tests: 0, data: 0, other: 0 };
    Object.values(stats.fileContributions).forEach(file => {
      categories[file.category]++;
    });
    Logger.log(`  File breakdown: code=${categories.code}, docs=${categories.docs}, tests=${categories.tests}, data=${categories.data}, other=${categories.other}`);
  });
  Logger.log('\n===== END SUMMARY =====\n');
}

/**
 * Parse co-authors from commit message
 * Looks for lines like: "Co-authored-by: Name <email@example.com>"
 */
function parseCoAuthors(commitMessage) {
  const coAuthors = [];
  if (!commitMessage) return coAuthors;
  
  // Match patterns like:
  // Co-authored-by: Jane Doe <jane@example.com>
  // co-authored-by: John Smith <john@example.com>
  const coAuthorRegex = /co-authored-by:\s*([^<]+)\s*<[^>]+>/gi;
  let match;
  
  while ((match = coAuthorRegex.exec(commitMessage)) !== null) {
    const name = match[1].trim();
    if (name && name.length > 0) {
      coAuthors.push(normalizeAuthorName(name));
    }
  }
  
  return coAuthors;
}

/**
 * Normalize author names to handle variations
 * This handles cases where git uses different names for the same person
 * 
 * Common patterns:
 * - "Kylie McKinley" → "kyliemckinley"  
 * - "Jose Perez" → "JosePerezIV"
 * - "kylie.mckinley" → "kyliemckinley"
 */
/**
 * Normalize git author names to canonical identifiers
 * 
 * NOTE: This is primarily a FALLBACK for:
 * 1. Commits where GitHub user is not linked (rare)
 * 2. Co-authors parsed from commit messages (text format only)
 * 
 * For most commits, we use commitDetail.author.login (GitHub username) directly,
 * which is already unique and doesn't need normalization.
 */
function normalizeAuthorName(authorName) {
  if (!authorName) return authorName;
  
  const name = authorName.trim();
  
  // Define name aliases here
  // Format: "Git Name": "Display Name"
  const aliases = {
    "Kylie McKinley": "kyliemckinley",
    "kylie mckinley": "kyliemckinley",
    "kylie.mckinley": "kyliemckinley",
    "Kylie": "kyliemckinley",
    
    "Jose Perez": "JosePerezIV",
    "jose perez": "JosePerezIV",
    "jose.perez": "JosePerezIV",
    "Jose": "JosePerezIV",
    "JosePerez": "JosePerezIV",
    
    "Claire C": "clairec601",
    "claire c": "clairec601",
    "Claire": "clairec601",
    
    "Maxim Boyarskiy": "MaximBoyarskiy",
    "maxim boyarskiy": "MaximBoyarskiy",
    "Maxim": "MaximBoyarskiy"
  };
  
  // Check for exact match (case-insensitive)
  const lowerName = name.toLowerCase();
  for (const [alias, canonical] of Object.entries(aliases)) {
    if (alias.toLowerCase() === lowerName) {
      Logger.log(`Normalizing name: "${name}" → "${canonical}"`);
      return canonical;
    }
  }
  
  // No alias found, return original name
  return name;
}

function processCommitDetails(contributor, commitDetail) {
  if (!commitDetail.files) {
    Logger.log('⚠️ Commit has no files array');
    return;
  }
  
  const fileCount = commitDetail.files.length;
  const commitSha = commitDetail.sha.substring(0, 7);
  const commitMessage = commitDetail.commit.message.split('\n')[0]; // First line only
  
  // Track which files are in this commit (for commitCount tracking)
  const filesInThisCommit = new Set();
  commitDetail.files.forEach(file => {
    filesInThisCommit.add(file.filename);
  });
  
  // Calculate total changes for this commit (needed for work type categorization)
  const totalCommitChanges = commitDetail.files.reduce((sum, file) => {
    return sum + (file.additions || 0) + (file.deletions || 0);
  }, 0);
  
  // Categorize the COMMIT by work type based on message, files, and size
  const workType = categorizeCommitWorkType(commitMessage, commitDetail.files, totalCommitChanges);
  
  Logger.log(`\n=== Processing commit ${commitSha}: "${commitMessage}" ===`);
  Logger.log(`Work Type: ${workType.toUpperCase()}`);
  Logger.log(`Total files in commit: ${fileCount}`);
  
  // Track stats for this commit
  let commitStats = {
    codeFiles: 0,
    docFiles: 0,
    testFiles: 0,
    dataFiles: 0,
    otherFiles: 0,
    totalChanges: 0,
    codeChanges: 0,
    docChanges: 0,
    workType: workType
  };
  
  let totalCodeChanges = 0; // Track code changes for this commit
  let totalDocChanges = 0;  // Track doc changes for this commit
  
  commitDetail.files.forEach(file => {
    const additions = file.additions || 0;
    const deletions = file.deletions || 0;
    const changes = additions + deletions;
    const fileCategory = categorizeFile(file.filename);
    const filename = file.filename;
    
    // Log each file
    Logger.log(`  📁 ${filename}: +${additions} -${deletions} (${fileCategory})`);
    
    // Track per-file contributions with net change
    if (!contributor.fileContributions[filename]) {
      contributor.fileContributions[filename] = {
        additions: 0,
        deletions: 0,
        changes: 0,
        netChange: 0,
        commits: new Set(),  // Track unique commit SHAs
        category: fileCategory
      };
    }
    contributor.fileContributions[filename].additions += additions;
    contributor.fileContributions[filename].deletions += deletions;
    contributor.fileContributions[filename].changes += changes;
    contributor.fileContributions[filename].netChange += (additions - deletions);
    contributor.fileContributions[filename].commits.add(commitDetail.sha);  // Track this commit
    
    // Update commit stats
    commitStats.totalChanges += changes;
    if (fileCategory === 'code') {
      commitStats.codeFiles++;
      commitStats.codeChanges += changes;
      totalCodeChanges += changes;
      contributor.codeLines += changes; // Keep legacy total
    } else if (fileCategory === 'docs') {
      commitStats.docFiles++;
      commitStats.docChanges += changes;
      totalDocChanges += changes;
      contributor.docLines += changes; // Keep legacy total
    } else if (fileCategory === 'tests') {
      commitStats.testFiles++;
      commitStats.codeChanges += changes; // tests count as code for commit categorization
      totalCodeChanges += changes;
      contributor.testLines += changes;
      // NOTE: Test lines tracked separately, NOT added to codeLines
    } else if (fileCategory === 'data') {
      commitStats.dataFiles++;
    } else {
      commitStats.otherFiles++;
    }
  });
  
  // NOW apply work-type categorization to the TOTAL code/doc changes in this commit
  // This way, if a commit has 100 lines of code changes and is categorized as "feature",
  // those 100 lines go to featureLines
  
  if (totalCodeChanges > 0 || totalDocChanges > 0) {
    const linesToAdd = totalCodeChanges + totalDocChanges;
    
    switch(workType) {
      case 'feature':
        contributor.featureLines += linesToAdd;
        Logger.log(`  ✅ Added ${linesToAdd} lines to FEATURE (3.0x)`);
        break;
      case 'bugfix':
        contributor.bugfixLines += linesToAdd;
        Logger.log(`  ✅ Added ${linesToAdd} lines to BUGFIX (1.5x)`);
        break;
      case 'test':
        contributor.testingLines += linesToAdd;
        Logger.log(`  ✅ Added ${linesToAdd} lines to TESTING (1.0x)`);
        break;
      case 'high-refactor':
        contributor.highRefactorLines += linesToAdd;
        Logger.log(`  ✅ Added ${linesToAdd} lines to HIGH REFACTOR (0.7x)`);
        break;
      case 'medium-refactor':
        contributor.mediumRefactorLines += linesToAdd;
        Logger.log(`  ✅ Added ${linesToAdd} lines to MEDIUM REFACTOR (0.4x)`);
        break;
      case 'low-refactor':
        contributor.lowRefactorLines += linesToAdd;
        Logger.log(`  ✅ Added ${linesToAdd} lines to LOW REFACTOR (0.1x)`);
        break;
      case 'docs':
        contributor.docsLines += linesToAdd;
        Logger.log(`  ✅ Added ${linesToAdd} lines to DOCS (0.3x)`);
        break;
      case 'support':
        contributor.supportLines += linesToAdd;
        Logger.log(`  ✅ Added ${linesToAdd} lines to SUPPORT (0.5x)`);
        break;
    }
  }
  
  // Log commit summary
  Logger.log(`📊 Commit Summary:`);
  Logger.log(`   Work Type: ${workType}`);
  Logger.log(`   Code files: ${commitStats.codeFiles} (${commitStats.codeChanges} changes)`);
  Logger.log(`   Doc files: ${commitStats.docFiles} (${commitStats.docChanges} changes)`);
  Logger.log(`   Test files: ${commitStats.testFiles}`);
  Logger.log(`   Data files: ${commitStats.dataFiles} (not scored)`);
  Logger.log(`   Other files: ${commitStats.otherFiles} (not scored)`);
  Logger.log(`   TOTAL CHANGES: ${commitStats.totalChanges}`);
  
  Logger.log(`Total files tracked for contributor: ${Object.keys(contributor.fileContributions).length}`);
}

/**
 * 6. CREATE DETAILED COMMIT HISTORY SHEET
 * Creates a detailed sheet with all commit information for analysis
 */
function createCommitHistorySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const CONFIG = getConfig();
  
  // Create or clear the Commit History sheet
  let historySheet = ss.getSheetByName('Commit History');
  if (historySheet) {
    historySheet.clear();
  } else {
    historySheet = ss.insertSheet('Commit History');
  }
  
  // Set up headers
  const headers = [
    'Commit SHA',
    'Date',
    'Author Name',
    'Author Email', 
    'Committer Name',
    'Committer Email',
    'Message',
    'Files Changed',
    'Additions',
    'Deletions',
    'Total Changes',
    'Is Merge',
    'Parent Count',
    'Code Files',
    'Doc Files',
    'Test Files',
    'Data Files',
    'Other Files',
    'Top Files (with changes)',
    'Co-Authors'
  ];
  
  historySheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#4472C4')
    .setFontColor('#FFFFFF')
    .setWrap(true);
  
  // Freeze header row
  historySheet.setFrozenRows(1);
  
  // Set column widths
  historySheet.setColumnWidth(1, 100);  // SHA
  historySheet.setColumnWidth(2, 120);  // Date
  historySheet.setColumnWidth(3, 150);  // Author Name
  historySheet.setColumnWidth(4, 200);  // Author Email
  historySheet.setColumnWidth(5, 150);  // Committer Name
  historySheet.setColumnWidth(6, 200);  // Committer Email
  historySheet.setColumnWidth(7, 300);  // Message
  historySheet.setColumnWidth(8, 80);   // Files Changed
  historySheet.setColumnWidth(19, 300); // Top Files
  historySheet.setColumnWidth(20, 200); // Co-Authors
  
  SpreadsheetApp.getUi().alert('Commit History sheet created!\n\nNow run:\nGitHub Tracker > 7. Fetch Detailed Commit History');
}

/**
 * 7. FETCH DETAILED COMMIT HISTORY
 * Populates the Commit History sheet with detailed commit data
 */
function fetchDetailedCommitHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const CONFIG = getConfig();
  
  let historySheet = ss.getSheetByName('Commit History');
  if (!historySheet) {
    SpreadsheetApp.getUi().alert('Please run:\nGitHub Tracker > 6. Create Commit History Sheet\n\nfirst!');
    return;
  }
  
  SpreadsheetApp.getUi().alert('Fetching detailed commit history...\n\nThis may take a few minutes for large repos.');
  
  const sinceDate = calculateSinceDate(CONFIG);
  const commitRows = [];
  
  let page = 1;
  const maxPages = 20; // Get more commits for analysis
  
  Logger.log('Starting to fetch commit history...');
  
  while (page <= maxPages) {
    const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/commits?since=${sinceDate}&per_page=100&page=${page}`;
    const commits = makeGitHubRequest(url, CONFIG);
    
    if (!commits || commits.length === 0) break;
    
    Logger.log(`Processing page ${page}, ${commits.length} commits`);
    
    commits.forEach((commit, idx) => {
      try {
        // Get full commit details
        const commitDetail = makeGitHubRequest(commit.url, CONFIG);
        
        if (!commitDetail) {
          Logger.log(`Skipping commit ${commit.sha} - no details`);
          return;
        }
        
        // Basic info
        const sha = commitDetail.sha.substring(0, 7);
        const date = new Date(commitDetail.commit.author.date);
        const authorName = commitDetail.commit.author.name;
        const authorEmail = commitDetail.commit.author.email;
        const committerName = commitDetail.commit.committer.name;
        const committerEmail = commitDetail.commit.committer.email;
        const message = commitDetail.commit.message.split('\n')[0]; // First line only
        
        // Stats
        const stats = commitDetail.stats || {};
        const additions = stats.additions || 0;
        const deletions = stats.deletions || 0;
        const totalChanges = additions + deletions;
        
        // Merge detection
        const parentCount = commitDetail.parents ? commitDetail.parents.length : 0;
        const isMerge = parentCount > 1 ? 'YES' : 'NO';
        
        // File categorization
        const files = commitDetail.files || [];
        const filesChanged = files.length;
        
        let codeFiles = 0;
        let docFiles = 0;
        let testFiles = 0;
        let dataFiles = 0;
        let otherFiles = 0;
        
        const topFiles = [];
        
        files.forEach(file => {
          const category = categorizeFile(file.filename);
          const changes = (file.additions || 0) + (file.deletions || 0);
          
          if (category === 'code') codeFiles++;
          else if (category === 'docs') docFiles++;
          else if (category === 'tests') testFiles++;
          else if (category === 'data') dataFiles++;
          else otherFiles++;
          
          // Track top files
          if (topFiles.length < 5) {
            topFiles.push(`${file.filename} (${changes})`);
          }
        });
        
        // Parse co-authors
        const coAuthors = parseCoAuthors(commitDetail.commit.message);
        const coAuthorsStr = coAuthors.length > 0 ? coAuthors.join(', ') : '';
        
        // Create row
        const row = [
          sha,
          date,
          authorName,
          authorEmail,
          committerName,
          committerEmail,
          message,
          filesChanged,
          additions,
          deletions,
          totalChanges,
          isMerge,
          parentCount,
          codeFiles,
          docFiles,
          testFiles,
          dataFiles,
          otherFiles,
          topFiles.join(', '),
          coAuthorsStr
        ];
        
        commitRows.push(row);
        
        // Log progress every 20 commits
        if ((page - 1) * 100 + idx % 20 === 0) {
          Logger.log(`Processed ${(page - 1) * 100 + idx} commits...`);
        }
        
      } catch (e) {
        Logger.log(`Error processing commit ${commit.sha}: ${e.message}`);
      }
    });
    
    page++;
  }
  
  Logger.log(`Total commits fetched: ${commitRows.length}`);
  
  // Write all rows at once (more efficient)
  if (commitRows.length > 0) {
    historySheet.getRange(2, 1, commitRows.length, commitRows[0].length)
      .setValues(commitRows);
    
    // Format the date column
    historySheet.getRange(2, 2, commitRows.length, 1)
      .setNumberFormat('yyyy-mm-dd hh:mm:ss');
    
    // Add alternating row colors for readability
    for (let i = 0; i < commitRows.length; i++) {
      const row = i + 2;
      const isMerge = commitRows[i][11]; // Is Merge column
      
      if (isMerge === 'YES') {
        // Highlight merge commits in yellow
        historySheet.getRange(row, 1, 1, headers.length)
          .setBackground('#FFF3CD');
      } else if (i % 2 === 0) {
        // Alternating white/light gray
        historySheet.getRange(row, 1, 1, headers.length)
          .setBackground('#F8F9FA');
      }
    }
    
    SpreadsheetApp.getUi().alert(
      `✅ Fetched ${commitRows.length} commits!\n\n` +
      `Check the "Commit History" sheet for detailed analysis.\n\n` +
      `Yellow rows = merge commits\n` +
      `Look for patterns in Author vs Committer columns!`
    );
  } else {
    SpreadsheetApp.getUi().alert('No commits found in the specified date range.');
  }
  
  Logger.log('Commit history fetch complete!');
}

function categorizeFile(filename) {
  const lowerName = filename.toLowerCase();
  
  // EXTERNAL LIBRARIES - should not count toward code/doc scores
  // CS course libraries: libcs50, libcs51, etc.
  if (lowerName.match(/libcs\d+\//)) {
    return 'data';
  }
  
  // Other common external library directories
  if (lowerName.includes('lib/') ||
      lowerName.includes('vendor/') ||
      lowerName.includes('third_party/') ||
      lowerName.includes('third-party/') ||
      lowerName.includes('external/') ||
      lowerName.includes('node_modules/') ||
      lowerName.includes('packages/')) {
    return 'data';
  }
  
  // Data files - should not count toward code/doc scores
  // These are typically in data/ directories, output/ directories, or have data file extensions
  if (lowerName.includes('data/') || 
      lowerName.includes('output/') || 
      lowerName.includes('dataset/') ||
      lowerName.includes('cache/') ||
      lowerName.includes('temp/') ||
      lowerName.includes('tmp/') ||
      lowerName.match(/\.(csv|tsv|json|xml|parquet|pickle|pkl|dat|bin|log|sqlite|db)$/i)) {
    return 'data';
  }
  
  // Documentation
  if (filename.match(/\.(md|rst|txt|adoc)$/) || lowerName.includes('readme') || lowerName.includes('docs/')) {
    return 'docs';
  }
  
  // Tests
  if (lowerName.includes('test') || lowerName.includes('spec')) {
    return 'tests';
  }
  
  // Code (including many common file types)
  if (filename.match(/\.(py|js|jsx|ts|tsx|java|go|rb|cpp|c|cs|rs|php|sh|swift|kt|scala|r|m|h|hpp|yaml|yml|sql|graphql|proto|dart|lua|perl|pl|bash|zsh|fish)$/i)) {
    return 'code';
  }
  
  return 'other';
}

/**
 * Categorize commit by WORK TYPE based on commit message, file changes, and change size
 * Returns: 'feature', 'bugfix', 'test', 'high-refactor', 'medium-refactor', 'low-refactor', 'docs', 'support'
 */
function categorizeCommitWorkType(commitMessage, filesChanged, changes) {
  const firstLine = commitMessage.split('\n')[0].toLowerCase();
  
  // CHECK FILE STATUS - but only for LARGE new additions
  // Small new files (headers, Makefiles, config) should be categorized by message
  if (filesChanged && filesChanged.length > 0) {
    const allNewFiles = filesChanged.every(file => file.status === 'added');
    const allDeletedFiles = filesChanged.every(file => file.status === 'removed');
    
    // All new files (modules that didn't exist before) = potential feature creation
    if (allNewFiles) {
      // Calculate total lines added
      const totalLines = filesChanged.reduce((sum, file) => {
        return sum + (file.additions || 0);
      }, 0);
      
      // ONLY classify as feature if it's a substantial addition (100+ lines)
      // This avoids counting: headers, Makefiles, .gitignore, small files as features
      if (totalLines >= 100) {
        // Exception: if all new files are tests, mark as test
        const allTests = filesChanged.every(file => {
          const filename = (file.filename || '').toLowerCase();
          return filename.includes('test') || filename.includes('spec');
        });
        if (allTests) {
          return 'test';
        }
        
        // Exception: if all new files are docs, mark as docs
        const allDocs = filesChanged.every(file => {
          const filename = file.filename || '';
          return filename.match(/\.(md|txt|rst|adoc)$/i) || 
                 filename.toLowerCase().includes('readme') ||
                 filename.toLowerCase().includes('docs/');
        });
        if (allDocs) {
          return 'docs';
        }
        
        // Large new files (100+ lines) = feature work
        return 'feature';
      }
      
      // For small new files (< 100 lines), fall through to message-based categorization
      // This handles: header files, Makefiles, .gitignore, config files, etc.
    }
    
    // All deleted files = support work (cleanup/removal)
    if (allDeletedFiles) {
      return 'support';
    }
  }
  
  // LOW REFACTORING (0.1x) - Check FIRST - Formatting only, whitespace, style
  const lowRefactorPatterns = [
    /^re\s+formatting/,
    /^formatting/,
    /^format/,
    /^fixed\s+(indentation|formatting|spacing|whitespace|style)/,  // "fixed formatting"
    /^indentation/,
    /^indent/,
    /^whitespace/,
    /^style/,
    /^spacing/,
    /^just\s+formatting/
  ];
  
  for (let pattern of lowRefactorPatterns) {
    if (firstLine.match(pattern)) {
      return 'low-refactor';
    }
  }
  
  // SUPPORT CODE (0.5x) - Check EARLY - File moves, minor edits, vague messages
  const supportPatterns = [
    /^moved\s+file/,
    /^move\s+\w+\s+to/,
    /^minor/,
    /^small/,
    /^quick/,
    /^update\s+comment/,
    /^typo/,
    /stuff$/,  // Vague message ending in "stuff"
    /changes$/,  // Vague message ending in "changes"
    /^more\s+changes/,
    /^changes$/,
    /^misc/,
    /^updated$/,
    /^cleanup/,         // "cleanup code"
    /^clean\s/,         // "clean up" or "clean code"
    /^remove\s+unused/  // "remove unused code"
  ];
  
  for (let pattern of supportPatterns) {
    if (firstLine.match(pattern)) {
      return 'support';
    }
  }
  
  // BUG FIX (1.5x) - Check BEFORE features since "fixed" is common
  const bugfixPatterns = [
    /^fix\s/,
    /^fixed\s/,
    /^debug/,
    /^resolve/,
    /^correct/,
    /^patch/,
    /fixing/,
    /\bfix\b/,      // "this should fix the issue" - fix anywhere in message
    /\bbug\b/,      // "handle bug in parsing" - bug anywhere in message
    /crash/,        // "prevent crash" or "fix crash"
    /segfault/      // "fix segfault"
  ];
  
  for (let pattern of bugfixPatterns) {
    if (firstLine.match(pattern)) {
      return 'bugfix';
    }
  }
  
  // FEATURE CODE (3.0x) - New functionality, original implementation
  const featurePatterns = [
    /^wrote\s+/,
    /^implement/,
    /^add\s+\w+\s+(function|logic|feature|functionality)/,
    /^create\s+\w+\s+(function|module|component)/,
    /^build\s+/,
    /^develop\s+/,
    /skeleton/,     // "section b skeletons" - foundational structure
    /^initial/      // "initial implementation"
  ];
  
  for (let pattern of featurePatterns) {
    if (firstLine.match(pattern)) {
      return 'feature';
    }
  }
  
  // TESTING (1.0x) - Test scripts, validation
  // Be specific to avoid false positives like "test this feature"
  const testPatterns = [
    /^test/i,                    // "test query functionality" at START
    /test.*script/i,             // "added test script"
    /testing\.sh/i,              // "added testing.sh"
    /test.*file/i,               // "test file for validation"
    /\.test\./i,                 // "querier.test.c"
    /validation.*test/i,         // "validation test suite"
    /unit.*test/i,               // "unit test"
    /^add.*test.*\.(sh|py|js)/i  // "add test.sh" or similar
  ];
  
  for (let pattern of testPatterns) {
    if (firstLine.match(pattern)) {
      return 'test';
    }
  }
  
  // HIGH REFACTORING (0.7x) - Substantial restructuring with logic improvements
  // Requires BOTH matching pattern AND significant line count (150+ lines)
  const highRefactorPatterns = [
    /refactor\s+\w+\s+(function|logic|processing|handler|functions|algorithm)/,
    /improve\s+\w+\s+(algorithm|logic|processing|error\s+handling)/,
    /restructure/,
    /extract\s+function/
  ];
  
  for (let pattern of highRefactorPatterns) {
    if (firstLine.match(pattern)) {
      // HIGH-REFACTOR requires substantial changes (150+ lines)
      // Smaller refactorings are downgraded to MEDIUM-REFACTOR
      if (changes >= 150) {
        return 'high-refactor';
      }
      // Pattern matches but changes too small - treat as medium refactor
      return 'medium-refactor';
    }
  }
  
  // MEDIUM REFACTORING (0.4x) - Generic "refactor" without specifics
  // Requires at least 50 lines to be considered medium
  if (firstLine.includes('refactor')) {
    if (changes >= 50) {
      return 'medium-refactor';
    }
    // Small refactorings (<50 lines) are treated as low-refactor
    return 'low-refactor';
  }
  
  // DOCUMENTATION (0.3x) - Only if ALL files are docs
  // Check if all changed files are documentation files
  if (filesChanged && filesChanged.length > 0) {
    const allDocs = filesChanged.every(file => {
      const filename = file.filename || file;
      return filename.match(/\.(md|txt|rst|adoc)$/i) || 
             filename.toLowerCase().includes('readme') ||
             filename.toLowerCase().includes('docs/');
    });
    
    if (allDocs) {
      return 'docs';
    }
  }
  
  // DEFAULT: If we can't determine, assume medium refactoring
  // Most unmatched commits are generic improvements/changes
  // This is more conservative than assuming 'feature'
  return 'medium-refactor';
}

function fetchPullRequests(contributors, sinceDate, CONFIG) {
  let page = 1;
  const maxPages = 10;
  const sinceTime = new Date(sinceDate).getTime();
  
  while (page <= maxPages) {
    const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/pulls?state=all&sort=updated&direction=desc&per_page=100&page=${page}`;
    const prs = makeGitHubRequest(url, CONFIG);
    
    if (!prs || prs.length === 0) break;
    
    let foundOldPR = false;
    prs.forEach(pr => {
      const updatedTime = new Date(pr.updated_at).getTime();
      
      if (updatedTime < sinceTime) {
        foundOldPR = true;
        return;
      }
      
      const author = pr.user.login;
      if (!contributors[author]) {
        contributors[author] = createContributorObject();
      }
      
      contributors[author].prsCreated++;
      if (pr.merged_at) {
        contributors[author].prsMerged++;
      }
      
      // Get reviews
      try {
        fetchPRReviews(contributors, pr.number, CONFIG);
      } catch (e) {
        Logger.log(`Error fetching reviews for PR ${pr.number}: ${e}`);
      }
    });
    
    if (foundOldPR) break;
    page++;
  }
}

function fetchPRReviews(contributors, prNumber, CONFIG) {
  const reviewsUrl = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/pulls/${prNumber}/reviews`;
  const reviews = makeGitHubRequest(reviewsUrl, CONFIG);
  
  const reviewers = {};
  reviews.forEach(review => {
    const reviewer = review.user.login;
    reviewers[reviewer] = true;
  });
  
  Object.keys(reviewers).forEach(reviewer => {
    if (!contributors[reviewer]) {
      contributors[reviewer] = createContributorObject();
    }
    contributors[reviewer].prsReviewed++;
  });
  
  // Get review comments
  const commentsUrl = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/pulls/${prNumber}/comments`;
  const comments = makeGitHubRequest(commentsUrl, CONFIG);
  
  comments.forEach(comment => {
    const commenter = comment.user.login;
    if (!contributors[commenter]) {
      contributors[commenter] = createContributorObject();
    }
    contributors[commenter].reviewComments++;
  });
}

function fetchIssues(contributors, sinceDate, CONFIG) {
  let page = 1;
  const maxPages = 10;
  
  while (page <= maxPages) {
    const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/issues?state=all&since=${sinceDate}&per_page=100&page=${page}`;
    const issues = makeGitHubRequest(url, CONFIG);
    
    if (!issues || issues.length === 0) break;
    
    issues.forEach(issue => {
      // Skip PRs (they show up in issues endpoint)
      if (issue.pull_request) return;
      
      const author = issue.user.login;
      if (!contributors[author]) {
        contributors[author] = createContributorObject();
      }
      
      contributors[author].issuesCreated++;
      
      // Get comments
      try {
        fetchIssueComments(contributors, issue.number, CONFIG);
      } catch (e) {
        Logger.log(`Error fetching comments for issue ${issue.number}: ${e}`);
      }
    });
    
    page++;
  }
}

function fetchIssueComments(contributors, issueNumber, CONFIG) {
  const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/issues/${issueNumber}/comments`;
  const comments = makeGitHubRequest(url, CONFIG);
  
  comments.forEach(comment => {
    const commenter = comment.user.login;
    if (!contributors[commenter]) {
      contributors[commenter] = createContributorObject();
    }
    contributors[commenter].issueComments++;
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createContributorObject() {
  return {
    commits: 0,
    codeLines: 0,
    docLines: 0,
    testLines: 0,
    
    // Work-type breakdown for smart weighting
    featureLines: 0,      // 3.0x weight
    bugfixLines: 0,       // 1.5x weight
    testingLines: 0,      // 1.0x weight
    highRefactorLines: 0, // 0.7x weight
    mediumRefactorLines: 0, // 0.4x weight
    lowRefactorLines: 0,  // 0.1x weight
    docsLines: 0,         // 0.3x weight
    supportLines: 0,      // 0.5x weight
    
    prsCreated: 0,
    prsMerged: 0,
    prsReviewed: 0,
    reviewComments: 0,
    issuesCreated: 0,
    issueComments: 0,
    fileContributions: {}  // Track contributions per file
  };
}

function writeRawData(contributors) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = ss.getSheetByName('Raw Data');
  
  const data = [];
  Object.keys(contributors).forEach(username => {
    const stats = contributors[username];
    data.push([
      username,
      stats.commits,
      stats.codeLines,
      stats.docLines,
      stats.testLines,
      stats.prsCreated,
      stats.prsMerged,
      stats.prsReviewed,
      stats.reviewComments,
      stats.issuesCreated,
      stats.issueComments
    ]);
  });
  
  if (data.length > 0) {
    rawSheet.getRange(2, 1, data.length, 11).setValues(data);
  }
}

/**
 * Build contributor workload chart with proper data/header separation
 * This ensures chart renders correctly by using data-only ranges
 */
function buildContributorChart(summarySheet, chartStartRow, chartStartCol, chartData) {
  const header = [
    "Contributor",
    "Features",
    "Bug Fixes",
    "Refactoring",
    "Testing",
    "Documentation",
    "Support"
  ];
  
  // --- 1. CLEAR existing chart area ---
  summarySheet.getCharts().forEach(c => summarySheet.removeChart(c));
  SpreadsheetApp.flush();
  
  // --- 2. WRITE HEADER ROW ---
  summarySheet
    .getRange(chartStartRow, chartStartCol, 1, header.length)
    .setValues([header])
    .setFontWeight('bold')
    .setBackground('#4472C4')
    .setFontColor('#FFFFFF');
  
  // --- 3. WRITE DATA ROWS ---
  if (chartData.length > 0) {
    summarySheet
      .getRange(chartStartRow + 1, chartStartCol, chartData.length, header.length)
      .setValues(chartData);
  }
  
  // Ensure data is committed before chart builds
  SpreadsheetApp.flush();
  
  // --- 4. BUILD CHART USING DATA-ONLY RANGES (no header row) ---
  const dataRowCount = chartData.length;
  const domainRange = summarySheet.getRange(
    chartStartRow + 1,     // First data row (NOT header)
    chartStartCol,
    dataRowCount,
    1
  );
  const featureRange = summarySheet.getRange(chartStartRow + 1, chartStartCol + 1, dataRowCount, 1);
  const bugfixRange = summarySheet.getRange(chartStartRow + 1, chartStartCol + 2, dataRowCount, 1);
  const refactorRange = summarySheet.getRange(chartStartRow + 1, chartStartCol + 3, dataRowCount, 1);
  const testingRange = summarySheet.getRange(chartStartRow + 1, chartStartCol + 4, dataRowCount, 1);
  const docRange = summarySheet.getRange(chartStartRow + 1, chartStartCol + 5, dataRowCount, 1);
  const supportRange = summarySheet.getRange(chartStartRow + 1, chartStartCol + 6, dataRowCount, 1);
  
  SpreadsheetApp.flush();
  
  // --- 5. BUILD NEW CHART ---
  const chart = summarySheet.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(domainRange)
    .addRange(featureRange)
    .addRange(bugfixRange)
    .addRange(refactorRange)
    .addRange(testingRange)
    .addRange(docRange)
    .addRange(supportRange)
    .setOption('title', 'Work Type Breakdown by Contributor')
    .setOption('titleTextStyle', { fontSize: 14, bold: true })
    .setOption('width', 800)   // Increased from 600 to extend to column P
    .setOption('height', 500)  // Increased from 450 for better proportions
    .setOption('isStacked', true)
    .setOption('legend', { 
      position: 'bottom',       // Moved to bottom
      alignment: 'center',
      textStyle: { fontSize: 10 },
      maxLines: 2               // Allow wrapping if needed
    })
    .setOption('hAxis', { 
      title: 'Contributor',
      textStyle: { fontSize: 10 }
    })
    .setOption('vAxis', { 
      title: 'Score',
      textStyle: { fontSize: 10 },
      minValue: 0,
      format: '#,###'
    })
    .setOption('series', {
      0: { 
        color: '#34A853',
        labelInLegend: '✨ Features (3.0x)'
      },
      1: { 
        color: '#FBBC04',
        labelInLegend: '🐛 Bug Fixes (2.0x)'
      },
      2: { 
        color: '#EA4335',
        labelInLegend: '🔧 Refactoring (0.7x-0.1x)'
      },
      3: { 
        color: '#4285F4',
        labelInLegend: '🧪 Testing (0.4x)'
      },
      4: { 
        color: '#9C27B0',
        labelInLegend: '📚 Documentation (0.3x)'
      },
      5: { 
        color: '#FF6D00',
        labelInLegend: '🔩 Support (0.5x)'
      }
    })
    .setOption('chartArea', { 
      width: '75%',   // Increased from 70% for wider bars
      height: '60%'   // Keep for bottom legend space
    })
    .setPosition(chartStartRow + 10, chartStartCol, 0, 0)
    .build();
  
  summarySheet.insertChart(chart);
  Logger.log("Chart built and inserted successfully");
}

function writeSummaryData(contributors, CONFIG) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const summarySheet = ss.getSheetByName('Summary');
  
  // === DISPLAY CURRENT WEIGHTS AT TOP ===
  summarySheet.getRange('A1:F4').clear();
  
  // Title
  summarySheet.getRange('A1:F1').merge()
    .setValue('📊 Contribution Summary - Current Weights')
    .setFontWeight('bold')
    .setFontSize(16)
    .setBackground('#4472C4')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');
  
  // Weights display (3 columns x 3 rows)
  const weightsData = [
    ['✨ Feature:', `${CONFIG.weights.featureCode}x`, '🐛 Bug Fix:', `${CONFIG.weights.bugFix}x`, '🧪 Testing:', `${CONFIG.weights.testing}x`],
    ['🔧 High Refactor:', `${CONFIG.weights.highRefactoring}x`, '🔨 Med Refactor:', `${CONFIG.weights.mediumRefactoring}x`, '📝 Low Refactor:', `${CONFIG.weights.lowRefactoring}x`],
    ['📚 Documentation:', `${CONFIG.weights.documentation}x`, '🔩 Support:', `${CONFIG.weights.supportCode}x`, '💡 Change weights in Config', '']
  ];
  
  summarySheet.getRange('A2:F4').setValues(weightsData);
  
  // Add help text about recalculation
  summarySheet.getRange('A6:F6').merge()
    .setValue('ℹ️  After changing weights in Config, run "GitHub Tracker → Recalculate Scores" to update points & percentages')
    .setFontStyle('italic')
    .setFontColor('#666666')
    .setFontSize(9)
    .setHorizontalAlignment('center')
    .setBackground('#FFF3CD')
    .setWrap(true);
  
  // Style weight labels (columns A, C, E)
  summarySheet.getRange('A2:A4').setFontWeight('bold');
  summarySheet.getRange('C2:C4').setFontWeight('bold');
  summarySheet.getRange('E2:E4').setFontWeight('bold');
  
  // Style weight values (columns B, D, F) with colors
  summarySheet.getRange('B2:B2').setHorizontalAlignment('center').setFontWeight('bold').setBackground('#C6E0B4'); // Feature - green
  summarySheet.getRange('D2:D2').setHorizontalAlignment('center').setFontWeight('bold').setBackground('#C6E0B4'); // Bug fix - green
  summarySheet.getRange('F2:F2').setHorizontalAlignment('center').setFontWeight('bold').setBackground('#FFE699'); // Testing - yellow
  summarySheet.getRange('B3:F3').setHorizontalAlignment('center').setFontWeight('bold').setBackground('#F4B084'); // Refactoring - orange
  summarySheet.getRange('B4:D4').setHorizontalAlignment('center').setFontWeight('bold').setBackground('#F4B084'); // Docs/Support - orange
  summarySheet.getRange('E4:F4').setFontStyle('italic').setFontColor('#666666'); // Hint text
  
  // Update timestamp (moved to row 7 to make room for help text)
  summarySheet.getRange('A7').setValue(`Last updated: ${new Date().toLocaleString()}`);
  
  // Calculate scores for each contributor
  const contributorScores = [];
  
  Object.keys(contributors).forEach(username => {
    const stats = contributors[username];
    
    // Calculate SMART weighted scores using work-type breakdown
    const featureScore = stats.featureLines * CONFIG.weights.featureCode;      // 3.0x
    const bugfixScore = stats.bugfixLines * CONFIG.weights.bugFix;             // 1.5x
    const testingScore = stats.testingLines * CONFIG.weights.testing;          // 1.0x
    const highRefactorScore = stats.highRefactorLines * CONFIG.weights.highRefactoring;  // 0.7x
    const mediumRefactorScore = stats.mediumRefactorLines * CONFIG.weights.mediumRefactoring;  // 0.4x
    const lowRefactorScore = stats.lowRefactorLines * CONFIG.weights.lowRefactoring;  // 0.1x
    const docsScore = stats.docsLines * CONFIG.weights.documentation;          // 0.3x
    const supportScore = stats.supportLines * CONFIG.weights.supportCode;      // 0.5x
    
    // Total code score (sum of all code work types)
    const codeScore = featureScore + bugfixScore + testingScore + 
                      highRefactorScore + mediumRefactorScore + lowRefactorScore + 
                      supportScore;
    
    // Total score
    const totalScore = codeScore + docsScore;
    
    Logger.log(`\n📊 ${username} Final Scores:`);
    Logger.log(`  Feature: ${stats.featureLines} × ${CONFIG.weights.featureCode} = ${featureScore.toFixed(1)}`);
    Logger.log(`  Bugfix: ${stats.bugfixLines} × ${CONFIG.weights.bugFix} = ${bugfixScore.toFixed(1)}`);
    Logger.log(`  Testing: ${stats.testingLines} × ${CONFIG.weights.testing} = ${testingScore.toFixed(1)}`);
    Logger.log(`  High Refactor: ${stats.highRefactorLines} × ${CONFIG.weights.highRefactoring} = ${highRefactorScore.toFixed(1)}`);
    Logger.log(`  Medium Refactor: ${stats.mediumRefactorLines} × ${CONFIG.weights.mediumRefactoring} = ${mediumRefactorScore.toFixed(1)}`);
    Logger.log(`  Low Refactor: ${stats.lowRefactorLines} × ${CONFIG.weights.lowRefactoring} = ${lowRefactorScore.toFixed(1)}`);
    Logger.log(`  Docs: ${stats.docsLines} × ${CONFIG.weights.documentation} = ${docsScore.toFixed(1)}`);
    Logger.log(`  Support: ${stats.supportLines} × ${CONFIG.weights.supportCode} = ${supportScore.toFixed(1)}`);
    Logger.log(`  ---`);
    Logger.log(`  Code lines (excl tests): ${stats.codeLines}`);
    Logger.log(`  Test lines: ${stats.testingLines}`);
    Logger.log(`  TOTAL: ${totalScore.toFixed(1)}`);
    
    contributorScores.push({
      username: username,
      codeScore: codeScore,
      docScore: docsScore,  // Use smart docs score
      totalScore: totalScore,
      stats: stats,
      // Breakdown for detailed view
      featureScore: featureScore,
      bugfixScore: bugfixScore,
      testingScore: testingScore,
      highRefactorScore: highRefactorScore,
      mediumRefactorScore: mediumRefactorScore,
      lowRefactorScore: lowRefactorScore,
      docsScore: docsScore,
      supportScore: supportScore
    });
  });
  
  // Sort by total score (descending)
  contributorScores.sort((a, b) => b.totalScore - a.totalScore);
  
  // Clear old chart data area (rows 6-25, columns H-N: 7 columns for chart)
  summarySheet.getRange('H6:N25').clear();
  
  // === CREATE CHART DATA TABLE ===
  // Position chart data starting at column H
  const chartStartRow = 6;
  const chartStartCol = 8; // Column H
  
  Logger.log(`Chart starts at row=${chartStartRow}, col=${chartStartCol}`);
  
  // Data for chart - 6 work type categories only (NO Total to avoid double counting)
  const chartData = contributorScores.map(contrib => [
    contrib.username,
    Math.round(contrib.featureScore),
    Math.round(contrib.bugfixScore),
    Math.round(contrib.highRefactorScore + contrib.mediumRefactorScore + contrib.lowRefactorScore), // Combined refactoring
    Math.round(contrib.testingScore),
    Math.round(contrib.docsScore),
    Math.round(contrib.supportScore)
  ]);
  
  Logger.log("Chart data rows: " + chartData.length);
  Logger.log("Chart data: " + JSON.stringify(chartData, null, 2));
  
  // Build chart using dedicated function
  if (chartData.length > 0) {
    buildContributorChart(summarySheet, chartStartRow, chartStartCol, chartData);
  } else {
    Logger.log("WARNING: No chart data to display - contributorScores is empty");
  }
  
  // Clear old detailed summary area
  const lastRow = summarySheet.getMaxRows();
  if (lastRow > 25) {
    summarySheet.getRange(26, 1, lastRow - 25, 26).clear();
  }
  
  let currentRow = 28; // Start detailed breakdown below chart
  
  contributorScores.forEach((contrib) => {
    const stats = contrib.stats;
    const username = contrib.username;
    
    // === CONTRIBUTOR HEADER ===
    summarySheet.getRange(currentRow, 1).setValue(username)
      .setFontWeight('bold')
      .setFontSize(14)
      .setBackground('#4472C4')
      .setFontColor('#FFFFFF');
    
    summarySheet.getRange(currentRow, 2, 1, 5).merge()
      .setValue(`Total Score: ${contrib.totalScore.toFixed(1)}`)
      .setFontWeight('bold')
      .setFontSize(14)
      .setBackground('#4472C4')
      .setFontColor('#FFFFFF')
      .setHorizontalAlignment('right');
    
    currentRow++;
    
    // === CONTRIBUTION SUMMARY ===
    summarySheet.getRange(currentRow, 1).setValue('Summary:')
      .setFontWeight('bold')
      .setBackground('#E7E6E6');
    currentRow++;
    
    const summary = [
      `• ${stats.commits} commits`,
      `• ${stats.prsCreated} PRs created, ${stats.prsMerged} merged`,
      `• ${stats.prsReviewed} PRs reviewed, ${stats.reviewComments} review comments`,
      `• ${stats.issuesCreated} issues created, ${stats.issueComments} issue comments`
    ];
    
    summary.forEach(line => {
      summarySheet.getRange(currentRow, 1, 1, 6).merge().setValue(line);
      currentRow++;
    });
    
    currentRow++; // Blank line
    
    // === WORK TYPE BREAKDOWN ===
    summarySheet.getRange(currentRow, 1).setValue('Work Type Breakdown:')
      .setFontWeight('bold')
      .setBackground('#E7E6E6');
    currentRow++;
    
    // Add work type details with scores
    const workTypes = [
      { 
        name: 'Feature Creation', 
        lines: stats.featureLines, 
        score: contrib.featureScore,
        weight: CONFIG.weights.featureCode,
        emoji: '✨'
      },
      { 
        name: 'Bug Fixing', 
        lines: stats.bugfixLines, 
        score: contrib.bugfixScore,
        weight: CONFIG.weights.bugFix,
        emoji: '🐛'
      },
      { 
        name: 'Testing', 
        lines: stats.testingLines, 
        score: contrib.testingScore,
        weight: CONFIG.weights.testing,
        emoji: '🧪'
      },
      { 
        name: 'High Refactoring', 
        lines: stats.highRefactorLines, 
        score: contrib.highRefactorScore,
        weight: CONFIG.weights.highRefactoring,
        emoji: '🔧'
      },
      { 
        name: 'Medium Refactoring', 
        lines: stats.mediumRefactorLines, 
        score: contrib.mediumRefactorScore,
        weight: CONFIG.weights.mediumRefactoring,
        emoji: '🔨'
      },
      { 
        name: 'Low Refactoring', 
        lines: stats.lowRefactorLines, 
        score: contrib.lowRefactorScore,
        weight: CONFIG.weights.lowRefactoring,
        emoji: '📝'
      },
      { 
        name: 'Documentation', 
        lines: stats.docsLines, 
        score: contrib.docsScore,
        weight: CONFIG.weights.documentation,
        emoji: '📚'
      },
      { 
        name: 'Support Code', 
        lines: stats.supportLines, 
        score: contrib.supportScore,
        weight: CONFIG.weights.supportCode,
        emoji: '🔩'
      }
    ];
    
    // Filter to only show work types with actual contributions
    const activeWorkTypes = workTypes.filter(wt => wt.lines > 0);
    
    if (activeWorkTypes.length > 0) {
      // Add header row
      summarySheet.getRange(currentRow, 1).setValue('Type')
        .setFontWeight('bold')
        .setBackground('#F2F2F2');
      summarySheet.getRange(currentRow, 2).setValue('Lines')
        .setFontWeight('bold')
        .setBackground('#F2F2F2')
        .setHorizontalAlignment('right');
      summarySheet.getRange(currentRow, 3).setValue('Weight')
        .setFontWeight('bold')
        .setBackground('#F2F2F2')
        .setHorizontalAlignment('center');
      summarySheet.getRange(currentRow, 4).setValue('Points')
        .setFontWeight('bold')
        .setBackground('#F2F2F2')
        .setHorizontalAlignment('right');
      summarySheet.getRange(currentRow, 5).setValue('% of Score')
        .setFontWeight('bold')
        .setBackground('#F2F2F2')
        .setHorizontalAlignment('right');
      currentRow++;
      
      // Sort by score (descending) to show most impactful work first
      activeWorkTypes.sort((a, b) => b.score - a.score);
      
      activeWorkTypes.forEach(wt => {
        const percentage = (wt.score / contrib.totalScore * 100).toFixed(1);
        
        // Map work type to cell reference for weight at top of sheet
        const weightCellMap = {
          'Feature Creation': 'B2',
          'Bug Fixing': 'D2',
          'Testing': 'F2',
          'High Refactoring': 'B3',
          'Medium Refactoring': 'D3',
          'Low Refactoring': 'F3',
          'Documentation': 'B4',
          'Support Code': 'D4'
        };
        
        const weightCell = weightCellMap[wt.name];
        
        summarySheet.getRange(currentRow, 1).setValue(`${wt.emoji} ${wt.name}`);
        summarySheet.getRange(currentRow, 2).setValue(wt.lines)
          .setHorizontalAlignment('right');
        
        // Use formula to reference weight cell at top instead of hardcoded value
        if (weightCell) {
          summarySheet.getRange(currentRow, 3).setFormula(`=${weightCell}`)
            .setHorizontalAlignment('center');
        } else {
          // Fallback if no mapping found
          summarySheet.getRange(currentRow, 3).setValue(`${wt.weight}x`)
            .setHorizontalAlignment('center');
        }
        
        summarySheet.getRange(currentRow, 4).setValue(wt.score.toFixed(1))
          .setHorizontalAlignment('right')
          .setFontWeight('bold');
        summarySheet.getRange(currentRow, 5).setValue(`${percentage}%`)
          .setHorizontalAlignment('right');
        
        // Color-code by percentage (highest contributors get darker colors)
        if (percentage >= 50) {
          summarySheet.getRange(currentRow, 1, 1, 5).setBackground('#C6E0B4'); // Green
        } else if (percentage >= 20) {
          summarySheet.getRange(currentRow, 1, 1, 5).setBackground('#FFE699'); // Yellow
        }
        
        currentRow++;
      });
      
      // Add total row
      summarySheet.getRange(currentRow, 1).setValue('TOTAL')
        .setFontWeight('bold')
        .setBackground('#D9D9D9');
      summarySheet.getRange(currentRow, 2).setValue(stats.codeLines + stats.testLines)
        .setHorizontalAlignment('right')
        .setFontWeight('bold')
        .setBackground('#D9D9D9');
      summarySheet.getRange(currentRow, 3).setValue('')
        .setBackground('#D9D9D9');
      summarySheet.getRange(currentRow, 4).setValue(contrib.totalScore.toFixed(1))
        .setHorizontalAlignment('right')
        .setFontWeight('bold')
        .setBackground('#D9D9D9');
      summarySheet.getRange(currentRow, 5).setValue('100.0%')
        .setHorizontalAlignment('right')
        .setFontWeight('bold')
        .setBackground('#D9D9D9');
      currentRow++;
    }
    
    currentRow++; // Blank line before Top 5 Files
    
    // === MOST ACTIVE FILES ===
    summarySheet.getRange(currentRow, 1).setValue('Most Active Files:')
      .setFontWeight('bold')
      .setBackground('#E7E6E6');
    currentRow++;
    
    // Get top 5 files by number of commits touching them
    const fileList = Object.keys(stats.fileContributions).map(filename => {
      const fileData = stats.fileContributions[filename];
      return {
        filename: filename,
        commitCount: fileData.commits ? fileData.commits.size : 0  // Number of unique commits
      };
    });
    
    // Sort by commit count (most commits = most active)
    fileList.sort((a, b) => b.commitCount - a.commitCount);
    const top5 = fileList.slice(0, 5);
    
    if (top5.length > 0) {
      top5.forEach((file, i) => {
        summarySheet.getRange(currentRow, 1).setValue(`${i + 1}.`);
        summarySheet.getRange(currentRow, 2, 1, 5).merge()
          .setValue(file.filename)
          .setFontFamily('Courier New');
        currentRow++;
      });
    } else {
      summarySheet.getRange(currentRow, 1, 1, 6).merge()
        .setValue('No file-level data available')
        .setFontStyle('italic');
      currentRow++;
    }
    
    // === SCORE BREAKDOWN ===
    summarySheet.getRange(currentRow, 1).setValue('Score Breakdown:')
      .setFontWeight('bold')
      .setBackground('#E7E6E6');
    currentRow++;
    
    const breakdown = [
      ['Code:', (contrib.codeScore || 0).toFixed(1)],
      ['Documentation:', (contrib.docScore || 0).toFixed(1)],
      ['TOTAL:', (contrib.totalScore || 0).toFixed(1)]
    ];
    
    breakdown.forEach((item, i) => {
      summarySheet.getRange(currentRow, 1).setValue(item[0]);
      summarySheet.getRange(currentRow, 2).setValue(item[1])
        .setHorizontalAlignment('right');
      
      if (i === breakdown.length - 1) {
        summarySheet.getRange(currentRow, 1, 1, 2)
          .setFontWeight('bold')
          .setBackground('#FFF2CC');
      }
      currentRow++;
    });
    
    // Add spacing between contributors
    currentRow += 2;
  });
  
  // Adjust column widths
  summarySheet.setColumnWidth(1, 150);
  summarySheet.setColumnWidth(2, 400);
  summarySheet.setColumnWidth(6, 100);
}

/**
 * Auto-detect and fill username from GitHub token
 */
function autoFillUsername() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('Config');
  
  if (!configSheet) {
    ui.alert('Error', 'Config sheet not found. Please run Setup Sheets first.', ui.ButtonSet.OK);
    return;
  }
  
  const token = configSheet.getRange('B2').getValue();
  
  if (!token || token === 'YOUR_GITHUB_TOKEN_HERE') {
    ui.alert('Token Required', 
             'Please add your GitHub token to Config sheet cell B2 first.',
             ui.ButtonSet.OK);
    configSheet.activate();
    configSheet.getRange('B2').activate();
    return;
  }
  
  try {
    const CONFIG = { githubToken: token };
    
    // Get authenticated user info
    const url = 'https://api.github.com/user';
    const userInfo = makeGitHubRequest(url, CONFIG);
    
    const username = userInfo.login;
    const name = userInfo.name || username;
    const email = userInfo.email || '';
    
    // Auto-fill owner with username (cell B3)
    configSheet.getRange('B3').setValue(username);
    
    // Show success message
    ui.alert('Username Detected!', 
             `✅ Detected username: ${username}\n` +
             (name !== username ? `   Name: ${name}\n` : '') +
             (email ? `   Email: ${email}\n` : '') +
             '\n' +
             'Config sheet cell B3 has been set to: ' + username + '\n\n' +
             'You can change this if you want to analyze a different user/org.',
             ui.ButtonSet.OK);
    
    configSheet.activate();
    configSheet.getRange('B4').activate(); // Move cursor to repo name field
    
  } catch (error) {
    ui.alert('Error', 
             'Could not detect username from token:\n\n' + 
             error.toString() + '\n\n' +
             'Please check that your token is valid.',
             ui.ButtonSet.OK);
    Logger.log('Error auto-filling username: ' + error);
  }
}

/**
 * Smart setup flow - auto-fills username if token is present
 */
function smartSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('Config');
  
  if (!configSheet) {
    SpreadsheetApp.getUi().alert('Error', 
                                 'Please run "Setup Sheets" first.',
                                 SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  const token = configSheet.getRange('B2').getValue();
  
  if (!token || token === 'YOUR_GITHUB_TOKEN_HERE') {
    SpreadsheetApp.getUi().alert('Token Required', 
                                 'Please add your GitHub token to Config sheet cell B2 first, then run this again.',
                                 SpreadsheetApp.getUi().ButtonSet.OK);
    configSheet.activate();
    configSheet.getRange('B2').activate();
    return;
  }
  
  // Auto-fill username
  autoFillUsername();
}
function fetchAvailableRepos() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('Config');
  
  if (!configSheet) {
    ui.alert('Error', 'Config sheet not found. Please run Setup Sheets first.', ui.ButtonSet.OK);
    return;
  }
  
  const token = configSheet.getRange('B2').getValue();
  
  if (!token || token === 'YOUR_GITHUB_TOKEN_HERE') {
    ui.alert('Configuration Error', 
             'Please add your GitHub token to Config sheet cell B2 first.',
             ui.ButtonSet.OK);
    configSheet.activate();
    return;
  }
  
  ui.alert('Fetching Repositories', 
           'Fetching all repos you have access to. This may take 30-60 seconds...',
           ui.ButtonSet.OK);
  
  try {
    const CONFIG = { githubToken: token };
    const repos = [];
    
    // Fetch user's repos
    let page = 1;
    const maxPages = 10; // Limit to first 1000 repos
    
    while (page <= maxPages) {
      const url = `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`;
      const response = makeGitHubRequest(url, CONFIG);
      
      if (!response || response.length === 0) break;
      
      response.forEach(repo => {
        repos.push({
          fullName: repo.full_name,
          owner: repo.owner.login,
          name: repo.name,
          private: repo.private,
          updatedAt: repo.updated_at,
          description: repo.description || ''
        });
      });
      
      page++;
    }
    
    // Sort by most recently updated
    repos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    // Write to a new "Available Repos" sheet
    let repoSheet = ss.getSheetByName('Available Repos');
    if (!repoSheet) {
      repoSheet = ss.insertSheet('Available Repos');
    }
    repoSheet.clear();
    
    // Headers
    repoSheet.getRange('A1').setValue('Available Repositories')
      .setFontSize(14)
      .setFontWeight('bold');
    
    repoSheet.getRange('A2').setValue(`Found ${repos.length} repositories`)
      .setFontStyle('italic');
    
    repoSheet.getRange('A3').setValue('Click on any row, then run: GitHub Tracker > Select Repo from List')
      .setFontStyle('italic')
      .setFontColor('#666666');
    
    const headers = ['Owner', 'Repo Name', 'Private?', 'Last Updated', 'Description'];
    repoSheet.getRange(5, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold')
      .setBackground('#4472C4')
      .setFontColor('#FFFFFF');
    
    // Data - separated owner and repo name into different columns
    const data = repos.map(repo => [
      repo.owner,           // Column A: Owner
      repo.name,            // Column B: Repo Name
      repo.private ? 'Yes' : 'No',
      new Date(repo.updatedAt).toLocaleDateString(),
      repo.description
    ]);
    
    if (data.length > 0) {
      repoSheet.getRange(6, 1, data.length, 5).setValues(data);
      
      // Format
      repoSheet.getRange(6, 1, data.length, 1).setFontWeight('bold'); // Owner column bold
      repoSheet.getRange(6, 2, data.length, 1).setFontWeight('bold'); // Repo name column bold
      repoSheet.getRange(6, 3, data.length, 1).setHorizontalAlignment('center'); // Private column centered
      
      // Auto-resize columns
      repoSheet.autoResizeColumns(1, 5);
      
      // Add data validation dropdown to Config sheet B3 (owner list)
      const ownerList = [...new Set(repos.map(r => r.owner))];
      const ownerRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(ownerList, true)
        .setAllowInvalid(false)
        .build();
      configSheet.getRange('B3').setDataValidation(ownerRule);
      
      // Add data validation dropdown to Config sheet B4 (owner/repo format)
      // This ensures the repo name is unique and includes the owner
      const repoFullNameList = repos.map(r => `${r.owner}/${r.name}`).sort();
      const repoRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(repoFullNameList, true)
        .setAllowInvalid(true) // Allow typing custom names too
        .build();
      configSheet.getRange('B4').setDataValidation(repoRule);
    }
    
    repoSheet.activate();
    
    ui.alert('Success!', 
             `Found ${repos.length} repositories.\n\n` +
             'Browse them in the "Available Repos" sheet.\n\n' +
             'To select a repo:\n' +
             '1. Click on any row in this sheet\n' +
             '2. Go to: GitHub Tracker > Select Repo from List\n' +
             '3. The Config sheet will be automatically updated\n' +
             '4. Then run: Fetch Contributions',
             ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert('Error', 
             'Failed to fetch repositories:\n\n' + error.toString() + '\n\nCheck your token permissions.',
             ui.ButtonSet.OK);
    Logger.log('Error fetching repos: ' + error);
  }
}

/**
 * Quick-select a repo from Available Repos sheet
 */
function selectRepoFromList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const repoSheet = ss.getSheetByName('Available Repos');
  const configSheet = ss.getSheetByName('Config');
  
  if (!repoSheet) {
    SpreadsheetApp.getUi().alert('Error', 
                                 'Please run "List Available Repos" first.',
                                 SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  const selection = repoSheet.getActiveRange();
  const row = selection.getRow();
  
  if (row < 6) {
    SpreadsheetApp.getUi().alert('Selection', 
                                 'Please select a repository row (row 6 or below).',
                                 SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  // Owner is in column 1 (A), Repo Name is in column 2 (B)
  const owner = repoSheet.getRange(row, 1).getValue();
  const repoName = repoSheet.getRange(row, 2).getValue();
  
  if (!owner || !repoName) {
    SpreadsheetApp.getUi().alert('Error', 
                                 'Could not read repository information from the selected row.',
                                 SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  // Update Config sheet
  configSheet.getRange('B3').setValue(owner);
  configSheet.getRange('B4').setValue(repoName);
  
  configSheet.activate();
  
  SpreadsheetApp.getUi().alert('Repository Selected!', 
                               `Now analyzing: ${owner}/${repoName}\n\n` +
                               'Config sheet has been updated:\n' +
                               `  • Owner (B3): ${owner}\n` +
                               `  • Repo (B4): ${repoName}\n\n` +
                               'Ready to run "Fetch Contributions"!',
                               SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Create clickable button images in Config sheet
 */

// ============================================================================
// BUTTON HANDLERS - Click buttons in Config sheet!
// ============================================================================


/**
 * Recalculate scores using existing Raw Data with current Config weights
 * This is useful when you want to experiment with different weights without re-fetching from GitHub
 * 
 * IMPORTANT: This preserves PR/review/issue counts from the existing Summary sheet,
 * only recalculating the work type line counts and scores from Raw Data.
 */
function recalculateScoresFromRawData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawDataSheet = ss.getSheetByName('Raw Data');
  const summarySheet = ss.getSheetByName('Summary');
  
  // Check if Raw Data sheet exists
  if (!rawDataSheet) {
    SpreadsheetApp.getUi().alert(
      '⚠️ No Data Found',
      'The "Raw Data" sheet doesn\'t exist yet.\n\n' +
      'Please run "GitHub Tracker → Fetch Contributions" first to pull data from GitHub.\n\n' +
      'Once you have data, you can experiment with different weights using "Recalculate Scores".',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }
  
  try {
    // Get current config
    const CONFIG = getConfig();
    
    // Read raw data
    const rawData = rawDataSheet.getDataRange().getValues();
    
    // Check if Raw Data has any actual data (more than just header row)
    if (rawData.length <= 1) {
      SpreadsheetApp.getUi().alert(
        '⚠️ Raw Data Sheet is Empty',
        'The "Raw Data" sheet exists but has no contribution data.\n\n' +
        'Please run "GitHub Tracker → Fetch Contributions" to pull data from GitHub first.\n\n' +
        'Steps:\n' +
        '1. Go to Config sheet\n' +
        '2. Make sure you have: GitHub token, repo owner, repo name\n' +
        '3. Run "GitHub Tracker → Fetch Contributions"\n' +
        '4. Once complete, you can experiment with weights using "Recalculate Scores"',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    // Validate that Raw Data has expected columns
    const headers = rawData[0];
    
    // Check which format we have
    const hasOldFormat = headers.includes('Contributor') && headers.includes('Commits');
    const hasNewFormat = headers.includes('Username') && headers.includes('Work Type');
    
    if (!hasOldFormat && !hasNewFormat) {
      SpreadsheetApp.getUi().alert(
        '⚠️ Invalid Raw Data Format',
        'The "Raw Data" sheet doesn\'t have the expected columns.\n\n' +
        'Expected either:\n' +
        '• Contributor, Commits, Code Lines, etc. (summary format), OR\n' +
        '• Username, Work Type, Lines (detailed format)\n\n' +
        'This usually means the sheet was manually modified or corrupted.\n\n' +
        'Please run "GitHub Tracker → Fetch Contributions" to regenerate the data.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    // If using old summary format, we can't recalculate by work type
    // We need the detailed Work Type breakdown
    if (hasOldFormat && !hasNewFormat) {
      SpreadsheetApp.getUi().alert(
        'ℹ️ Cannot Recalculate from Summary Data',
        'The current "Raw Data" sheet contains summary-level data (total lines per contributor).\n\n' +
        'To use "Recalculate Scores", you need detailed work-type data.\n\n' +
        'Please run "GitHub Tracker → Fetch Contributions" again.\n' +
        'This will populate Raw Data with work-type breakdowns (Feature, Bugfix, Testing, etc.),\n' +
        'which allows recalculation with different weights.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    // Parse header row to find column indices
    const colIdx = {};
    headers.forEach((header, idx) => {
      colIdx[header] = idx;
    });
    
    // First, read existing Summary data to preserve PR/review/issue counts
    const existingContributors = {};
    if (summarySheet) {
      // Parse existing summary to extract contributor metadata
      // Look for contributor headers (they have blue background #4472C4)
      const summaryData = summarySheet.getDataRange().getValues();
      
      for (let i = 0; i < summaryData.length; i++) {
        const row = summaryData[i];
        const cell = row[0];
        
        // Check if this looks like a contributor name (non-empty, not "Summary:", etc.)
        if (cell && typeof cell === 'string' && cell.length > 0 && 
            !cell.startsWith('•') && !cell.startsWith('Summary') && 
            !cell.startsWith('Top ') && !cell.startsWith('Work Type') &&
            !cell.includes('Last updated')) {
          
          // This might be a username - check if next row has summary data
          if (i + 2 < summaryData.length) {
            const summaryLine = summaryData[i + 2][0];
            if (summaryLine && typeof summaryLine === 'string' && summaryLine.startsWith('•')) {
              const username = cell;
              
              // Parse the summary lines to extract metrics
              // Format: "• X commits"
              // Format: "• X PRs created, Y merged"
              // Format: "• X PRs reviewed, Y review comments"
              // Format: "• X issues created, Y issue comments"
              
              const commits = parseInt(summaryLine.match(/(\d+) commits/)?.[1]) || 0;
              const prsLine = summaryData[i + 3][0] || '';
              const reviewsLine = summaryData[i + 4][0] || '';
              const issuesLine = summaryData[i + 5][0] || '';
              
              const prsCreated = parseInt(prsLine.match(/(\d+) PRs created/)?.[1]) || 0;
              const prsMerged = parseInt(prsLine.match(/(\d+) merged/)?.[1]) || 0;
              const prsReviewed = parseInt(reviewsLine.match(/(\d+) PRs reviewed/)?.[1]) || 0;
              const reviewComments = parseInt(reviewsLine.match(/(\d+) review comments/)?.[1]) || 0;
              const issuesCreated = parseInt(issuesLine.match(/(\d+) issues created/)?.[1]) || 0;
              const issueComments = parseInt(issuesLine.match(/(\d+) issue comments/)?.[1]) || 0;
              
              existingContributors[username] = {
                commits: commits,
                prsCreated: prsCreated,
                prsMerged: prsMerged,
                prsReviewed: prsReviewed,
                reviewComments: reviewComments,
                issuesCreated: issuesCreated,
                issueComments: issueComments
              };
            }
          }
        }
      }
    }
    
    // Initialize contributors
    const contributors = {};
    
    // Process each row (skip header)
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      const username = row[colIdx['Username']];
      const workType = row[colIdx['Work Type']];
      const lines = parseInt(row[colIdx['Lines']]) || 0;
      
      if (!username || !workType || lines === 0) continue;
      
      // Initialize contributor if needed
      if (!contributors[username]) {
        const existingData = existingContributors[username] || {};
        
        contributors[username] = createContributorObject(username);
        
        // Restore PR/review/issue data from existing Summary
        contributors[username].commits = existingData.commits || 0;
        contributors[username].prsCreated = existingData.prsCreated || 0;
        contributors[username].prsMerged = existingData.prsMerged || 0;
        contributors[username].prsReviewed = existingData.prsReviewed || 0;
        contributors[username].reviewComments = existingData.reviewComments || 0;
        contributors[username].issuesCreated = existingData.issuesCreated || 0;
        contributors[username].issueComments = existingData.issueComments || 0;
      }
      
      // Add lines to appropriate work type
      const contributor = contributors[username];
      
      switch(workType.toLowerCase()) {
        case 'feature':
          contributor.featureLines += lines;
          break;
        case 'bugfix':
          contributor.bugfixLines += lines;
          break;
        case 'test':
          contributor.testingLines += lines;
          break;
        case 'high-refactor':
          contributor.highRefactorLines += lines;
          break;
        case 'medium-refactor':
          contributor.mediumRefactorLines += lines;
          break;
        case 'low-refactor':
          contributor.lowRefactorLines += lines;
          break;
        case 'docs':
          contributor.docsLines += lines;
          break;
        case 'support':
          contributor.supportLines += lines;
          break;
      }
      
      // Update legacy totals for compatibility
      if (workType.toLowerCase() === 'docs') {
        contributor.docLines += lines;
      } else if (workType.toLowerCase() === 'test') {
        contributor.testLines += lines;
      } else {
        contributor.codeLines += lines;
      }
      
      // Note: commit count preserved from existing Summary data
    }
    
    // Calculate scores using current weights
    const contributorScores = [];
    
    Object.keys(contributors).forEach(username => {
      const stats = contributors[username];
      
      // Calculate scores with current CONFIG weights
      const featureScore = stats.featureLines * CONFIG.weights.featureCode;
      const bugfixScore = stats.bugfixLines * CONFIG.weights.bugFix;
      const testingScore = stats.testingLines * CONFIG.weights.testing;
      const highRefactorScore = stats.highRefactorLines * CONFIG.weights.highRefactoring;
      const mediumRefactorScore = stats.mediumRefactorLines * CONFIG.weights.mediumRefactoring;
      const lowRefactorScore = stats.lowRefactorLines * CONFIG.weights.lowRefactoring;
      const docsScore = stats.docsLines * CONFIG.weights.documentation;
      const supportScore = stats.supportLines * CONFIG.weights.supportCode;
      
      const codeScore = featureScore + bugfixScore + testingScore + 
                       highRefactorScore + mediumRefactorScore + lowRefactorScore +
                       supportScore;
      const totalScore = codeScore + docsScore;
      
      contributorScores.push({
        username: username,
        codeScore: codeScore,
        docScore: docsScore,
        totalScore: totalScore,
        stats: stats,
        featureScore: featureScore,
        bugfixScore: bugfixScore,
        testingScore: testingScore,
        highRefactorScore: highRefactorScore,
        mediumRefactorScore: mediumRefactorScore,
        lowRefactorScore: lowRefactorScore,
        docsScore: docsScore,
        supportScore: supportScore
      });
    });
    
    // Sort by total score
    contributorScores.sort((a, b) => b.totalScore - a.totalScore);
    
    // Update Summary sheet with recalculated scores
    writeSummaryData(contributorScores, CONFIG);
    
    SpreadsheetApp.getUi().alert(
      '✅ Scores Recalculated!\n\n' +
      'Summary sheet has been updated with current Config weights.\n\n' +
      'Current weights:\n' +
      `• Feature: ${CONFIG.weights.featureCode}x\n` +
      `• Bug Fix: ${CONFIG.weights.bugFix}x\n` +
      `• Testing: ${CONFIG.weights.testing}x\n` +
      `• High Refactor: ${CONFIG.weights.highRefactoring}x\n` +
      `• Medium Refactor: ${CONFIG.weights.mediumRefactoring}x\n` +
      `• Low Refactor: ${CONFIG.weights.lowRefactoring}x\n` +
      `• Documentation: ${CONFIG.weights.documentation}x\n` +
      `• Support: ${CONFIG.weights.supportCode}x`
    );
    
  } catch (error) {
    Logger.log('Error recalculating scores: ' + error);
    Logger.log('Error stack: ' + error.stack);
    
    SpreadsheetApp.getUi().alert(
      '❌ Error Recalculating Scores',
      'An error occurred while recalculating:\n\n' +
      error.message + '\n\n' +
      'This might happen if:\n' +
      '• The Raw Data sheet format is invalid\n' +
      '• No contribution data exists yet\n' +
      '• The sheet structure was manually modified\n\n' +
      'Try running "GitHub Tracker → Fetch Contributions" to regenerate the data.\n\n' +
      'Check View → Logs for more details.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

// ============================================================================
// CUSTOM MENU
// ============================================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('GitHub Tracker')
    .addItem('1. Setup Sheets (run once)', 'setupSheets')
    .addSeparator()
    .addItem('2. Auto-Fill My Username', 'autoFillUsername')
    .addItem('3. List Available Repos', 'fetchAvailableRepos')
    .addItem('4. Select Repo from List', 'selectRepoFromList')
    .addSeparator()
    .addItem('5. Fetch Contributions (does everything!)', 'fetchContributions')
    .addItem('6. Recalculate Scores (use current weights)', 'recalculateScoresFromRawData')
    .addToUi();
}
