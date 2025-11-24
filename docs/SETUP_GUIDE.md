# Setup Guide

Complete instructions for setting up the GitHub Contribution Tracker.

## Prerequisites

- A Google account
- A GitHub account
- A GitHub Personal Access Token (we'll create this below)

---

## Step 1: Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. Name it something like "GitHub Contribution Tracker"

---

## Step 2: Open the Script Editor

1. In your new spreadsheet, click **Extensions** in the menu bar
2. Click **Apps Script**
3. A new tab will open with the script editor

---

## Step 3: Add the Code

1. Delete any existing code in the editor (usually `function myFunction() {}`)
2. Go to the [Code.gs](../Code.gs) file in this repository
3. Copy the **entire** contents (Ctrl/Cmd + A, then Ctrl/Cmd + C)
4. Paste it into the Apps Script editor (Ctrl/Cmd + V)
5. Click the **Save** button (💾) or press Ctrl/Cmd + S
6. Name the project "GitHub Tracker" when prompted

---

## Step 4: Authorize the Script

1. Close the Apps Script tab
2. Refresh your spreadsheet page (F5 or Ctrl/Cmd + R)
3. Wait 5-10 seconds for the menu to appear
4. Click **GitHub Tracker → 1. Setup Sheets**
5. A dialog will appear asking for authorization
6. Click **Continue**
7. Choose your Google account
8. Click **Advanced** (bottom left)
9. Click **Go to GitHub Tracker (unsafe)**
10. Click **Allow**

> **Note:** Google shows this warning because the script isn't verified. The code is open source - you can inspect it yourself!

---

## Step 5: Create a GitHub Personal Access Token

1. Go to [GitHub Settings](https://github.com/settings/profile)
2. Scroll down and click **Developer settings** (left sidebar, bottom)
3. Click **Personal access tokens**
4. Click **Tokens (classic)**
5. Click **Generate new token** → **Generate new token (classic)**
6. Fill in:
   - **Note:** "Contribution Tracker" (or any name)
   - **Expiration:** Choose based on your needs (90 days is common)
   - **Scopes:** Check only `repo` (this gives access to repository data)
7. Click **Generate token**
8. **IMPORTANT:** Copy the token immediately! You won't be able to see it again.

---

## Step 6: Configure the Spreadsheet

After running Setup Sheets, you'll have a **Config** sheet with yellow input cells:

### Required Settings:

| Cell | Setting | What to Enter |
|------|---------|---------------|
| B2 | GitHub Token | Paste your token from Step 5 |
| B3 | Repo Owner | Your GitHub username OR organization name |
| B4 | Repo Name | The repository name to analyze |

### Optional Settings:

| Cell | Setting | Default | Description |
|------|---------|---------|-------------|
| B7 | Days Back | 90 | How far back to analyze |
| B8 | Start Date | (empty) | Specific start date (overrides Days Back) |

### Automatic Method (Recommended):

Instead of manually entering B3 and B4:

1. Enter your GitHub token in B2
2. Run **GitHub Tracker → 3. Auto-Fill My Username**
   - This fills B3 with your username
3. Run **GitHub Tracker → 4. List Available Repos**
   - A new sheet appears listing all your repositories
4. Click on the row of the repository you want to analyze
5. Run **GitHub Tracker → 5. Set Selected Repo**
   - This fills B3 and B4 automatically

---

## Step 7: Set the Date Range

**Important for courses:** Set a start date AFTER instructor-provided code was added.

### Option A: Days Back
- Set B7 to number of days (e.g., `90` for last 90 days)
- Leave B8 empty

### Option B: Specific Start Date
- Leave B7 empty (or any value - it will be ignored)
- Set B8 to a specific date in `YYYY-MM-DD` format
- Example: `2024-09-01` for September 1, 2024

**Why this matters:** If students forked a repo with starter code, you want to exclude those initial commits from analysis.

---

## Step 8: Customize Weights (Optional)

The Config sheet has default weights for each work type:

```
Feature Creation:    3.0x
Bug Fixing:          2.0x
High Refactoring:    0.7x
Medium Refactoring:  0.3x
Low Refactoring:     0.1x
Testing:             0.4x
Documentation:       0.3x
Support Code:        0.5x
```

**To customize:**
1. Change any weight value in column B
2. Run **GitHub Tracker → Recalculate Scores** to update (no re-fetch needed!)

**Example customizations:**
- **Testing-focused course:** Increase Testing to 1.0x
- **Documentation-heavy project:** Increase Documentation to 0.5x
- **Startup MVP:** Increase Feature Creation to 4.0x

---

## Step 9: Fetch Contributions

Run **GitHub Tracker → Fetch Contributions**

This will:
1. Connect to GitHub's API
2. Fetch all commits in the date range
3. Categorize each commit by work type
4. Calculate scores based on weights
5. Generate the Summary sheet with results
6. Create a visualization chart

**Duration:** Typically 30 seconds to 2 minutes depending on repository size.

---

## Step 10: View Results

After fetching completes, check these sheets:

### Summary Sheet
- **Top section:** Weight settings and help banner
- **Chart:** Visual breakdown by work type per contributor
- **Contributor sections:** Detailed breakdown for each person

### Raw Data Sheet
- Line counts per contributor
- PR and issue statistics

### Commit History Sheet (Optional)
Run **GitHub Tracker → 6. Create Commit History Sheet** then **7. Fetch Detailed Commit History** to see:
- Every commit with timestamp
- Author vs committer (detects rebasing)
- Co-authors
- Work type categorization

---

## Troubleshooting

### "GitHub Tracker" menu doesn't appear
- Refresh the page (F5)
- Wait 10 seconds
- Try closing and reopening the spreadsheet

### "Authorization required" error
- Re-run any menu item
- Complete the authorization flow again

### "Bad credentials" error
- Your GitHub token is invalid or expired
- Generate a new token (Step 5)
- Make sure you copied the entire token

### "Not found" error
- Check that repo owner and name are correct
- Make sure your token has access to this repo
- For private repos, ensure `repo` scope is enabled on your token

### No data appears
- Check the date range - are there commits in that period?
- Verify the repository has commits (not just a fork with no changes)
- Check the script logs: **Extensions → Apps Script → Executions**

### Scores seem wrong
- Check if starter code commits are being included (adjust start date)
- Verify weights are set as expected
- Run **Recalculate Scores** after changing weights

---

## Updating the Script

When new versions are released:

1. Open **Extensions → Apps Script**
2. Select all code (Ctrl/Cmd + A)
3. Delete it
4. Paste the new version
5. Save

Your data and configuration will be preserved (they're in the spreadsheet, not the script).

---

## Next Steps

- Read the [User Guide](USER_GUIDE.md) for detailed feature explanations
- Check [Configuration](CONFIGURATION.md) for advanced settings
- See [FAQ](FAQ.md) for common questions

---

## Getting Help

- **Issues:** Report bugs or request features on [GitHub Issues](../../issues)
- **Discussions:** Ask questions on [GitHub Discussions](../../discussions)
