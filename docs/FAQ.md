# Frequently Asked Questions

Common questions and answers about the GitHub Contribution Tracker.

---

## Setup & Installation

### Q: Do I need to install anything?
**A:** No! The tool runs entirely in Google Sheets using Google Apps Script. Just copy the code into your spreadsheet's script editor.

### Q: Is it free?
**A:** Yes, completely free. It uses free Google Sheets and free GitHub API.

### Q: Can I use this with a private repository?
**A:** Yes, as long as your GitHub token has access to the repository. Create a token with `repo` scope.

### Q: The "GitHub Tracker" menu doesn't appear. What do I do?
**A:** 
1. Refresh the page (F5)
2. Wait 10 seconds for the menu to load
3. If still missing, go to Extensions → Apps Script and re-run any function manually

### Q: How do I get a GitHub token?
**A:** 
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select `repo` scope
4. Copy the token immediately (you won't see it again)

---

## Usage

### Q: How long does it take to analyze a repository?
**A:** Typically 30 seconds to 2 minutes depending on repository size and number of commits in the date range.

### Q: Can I analyze multiple repositories?
**A:** Currently, one repository at a time. Create separate spreadsheets for different repos, or re-run with different repo settings.

### Q: What happens if I change the weights?
**A:** Run **GitHub Tracker → Recalculate Scores** to update all points instantly. No need to re-fetch from GitHub.

### Q: How do I exclude starter/instructor code?
**A:** Set the **Start Date** (B8) to a date after the starter code was added. The tool also automatically detects commits with keywords like "starter code" or "provided files".

### Q: Can I see individual commit details?
**A:** Yes! Run **GitHub Tracker → 6. Create Commit History Sheet** and then **7. Fetch Detailed Commit History** to see every commit with categorization.

---

## Scoring & Categorization

### Q: How are commits categorized?
**A:** Using multiple signals:
- Commit message keywords (fix, add, refactor, test, etc.)
- File types changed (code, docs, tests, config)
- Size of changes
- Patterns in file names

### Q: Why did my commit get categorized as X instead of Y?
**A:** Check the commit message - keywords heavily influence categorization. Common patterns:
- "fix" → Bug Fixing
- "add" → Feature Creation  
- "refactor" → Refactoring
- Test files → Testing

### Q: What's the minimum commit size to earn points?
**A:** 
- Code commits: 10 lines minimum
- Documentation commits: 5 lines minimum
- Below threshold: Commit is counted but earns 0 points

### Q: Do merge commits count?
**A:** No, merge commits (combining branches) are automatically excluded since they don't represent new work.

### Q: How is "net change" different from line count?
**A:** 
- Line count (additions + deletions): Total changes
- Net change (additions - deletions): Actual codebase growth

Net change prevents gaming by repeatedly editing the same lines.

---

## Weights & Fairness

### Q: What are the default weights?
**A:**
```
Feature Creation:    3.0x
Bug Fixing:          2.0x
Testing:             0.4x
High Refactoring:    0.7x
Medium Refactoring:  0.3x
Low Refactoring:     0.1x
Documentation:       0.3x
Support Code:        0.5x
```

### Q: Why is Feature Creation weighted so high (3.0x)?
**A:** Building new functionality is typically the most complex and valuable work. Adjust down if your project prioritizes other work types.

### Q: Why is Bug Fixing 2.0x?
**A:** Bug fixes are high-value - they solve problems and often require deep understanding. They're undervalued in raw line counts since fixes are often small.

### Q: Why is Testing only 0.4x?
**A:** Tests are valuable but often simpler than core code. Increase this for TDD-focused teams or courses.

### Q: Can I make Documentation worth more?
**A:** Yes! Change the Documentation weight in Config sheet, then run Recalculate Scores.

### Q: Someone on my team only does infrastructure work. Is that valued?
**A:** Yes - Support Code has a 0.5x weight. If your project is infrastructure-heavy, increase this weight.

---

## Data & Privacy

### Q: Where is my data stored?
**A:** All data is stored in your Google Sheet. Nothing is sent to external servers (except GitHub API calls to fetch data).

### Q: Is my GitHub token safe?
**A:** The token is stored only in your spreadsheet cell. It's only used to make API calls to GitHub. Never share your spreadsheet publicly if it contains your token.

### Q: Can students see each other's data?
**A:** That depends on how you share the spreadsheet. You control the sharing settings.

### Q: How do I delete all data?
**A:** Delete the spreadsheet, or delete the individual sheets (Summary, Raw Data, Commit History).

---

## Troubleshooting

### Q: "Bad credentials" error
**A:** Your GitHub token is invalid or expired. Generate a new one.

### Q: "Not found" error
**A:** Check that the repo owner and name are correct. Verify your token has access to the repo.

### Q: No data appears after fetching
**A:** 
- Check the date range - are there commits in that period?
- Verify the repository has commits (not just forks with no changes)
- Check script execution logs (Extensions → Apps Script → Executions)

### Q: Chart doesn't appear
**A:** 
- Check that data exists in columns H-N of the Summary sheet
- Try running Fetch Contributions again
- Check for errors in the script execution log

### Q: Scores seem too low/high
**A:** 
- Verify weights are set as expected
- Check if external code is being included (adjust start date)
- Review commit categorization in Commit History sheet

### Q: Same person appears multiple times
**A:** This usually means their git config name doesn't match their GitHub username. The tool now uses GitHub usernames by default, which should prevent this. Re-run Fetch Contributions.

### Q: API rate limit exceeded
**A:** GitHub limits API calls (5,000/hour with token). Wait an hour or analyze a smaller date range.

---

## Comparison to Alternatives

### Q: How is this different from GitHub Insights?
**A:** GitHub Insights only shows raw line counts. This tool:
- Categorizes work into 8 types
- Applies customizable weights
- Filters external code
- Provides visual breakdown
- Prevents gaming

### Q: How does this compare to paid tools like LinearB or Pluralsight Flow?
**A:** Those tools are comprehensive but expensive ($$$). This tool is free, focused on fair evaluation, and ideal for education and small teams.

### Q: Can I use this instead of code review?
**A:** No! This tool measures quantity and type of work, not quality. Always review code for correctness, style, and best practices.

---

## Feature Requests

### Q: Can you add GitLab support?
**A:** Not currently - the tool uses GitHub's API. GitLab support would require significant changes.

### Q: Can you add multi-repo analysis?
**A:** Not yet, but it's on the roadmap. Currently, analyze repos separately.

### Q: Can you add automatic quality metrics?
**A:** Quality is subjective and hard to measure automatically. We focus on categorization and fairness, leaving quality assessment to humans.

### Q: Can you track meeting participation or design work?
**A:** No - these happen outside GitHub. The tool only analyzes what's in the repository.

---

## For Educators

### Q: How should I weight contributions for a CS course?
**A:** Consider your learning objectives:
- Teaching TDD? Increase Testing weight
- Focus on documentation? Increase Documentation weight
- First programming course? Default weights are usually fine

### Q: Should I use this for grades?
**A:** Use it as **one input**, not the only input. Consider:
- Work type distribution (not just total)
- Context and team dynamics
- Code quality (separate assessment)
- Collaboration quality

### Q: How do I handle students who worked together?
**A:** The tool tracks co-authors from commit messages. If students use `Co-authored-by:` in commits, both get credit.

### Q: A student says their score is unfair. What do I do?
**A:** 
1. Review their Work Type Breakdown together
2. Check commit categorization in Commit History
3. Discuss what type of work they did
4. Consider if weights should be adjusted for the course
5. Remember: Total score isn't everything - look at the composition

---

## Technical

### Q: What API does this use?
**A:** GitHub's REST API v3 for commits, PRs, reviews, and issues.

### Q: Is there a rate limit?
**A:** Yes, GitHub allows 5,000 requests/hour with a token (60/hour without). Most analyses use 10-50 requests.

### Q: Can I modify the code?
**A:** Yes! It's open source under MIT license. Modify freely.

### Q: How do I update to a new version?
**A:** 
1. Open Extensions → Apps Script
2. Replace all code with the new version
3. Save
4. Your data and configuration are preserved in the spreadsheet

---

## Getting Help

### Q: I found a bug. Where do I report it?
**A:** Open an issue on the [GitHub repository](../../issues).

### Q: I have a feature suggestion.
**A:** Open a feature request on [GitHub Issues](../../issues) or start a [Discussion](../../discussions).

### Q: Where can I get help?
**A:** 
1. Check this FAQ
2. Read the documentation
3. Search existing issues
4. Open a new issue or discussion
