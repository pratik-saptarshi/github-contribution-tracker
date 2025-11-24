# User Guide

A complete guide to using the GitHub Contribution Tracker.

---

## Overview

The tracker analyzes GitHub repositories and provides:
- **Smart categorization** of work into 8 types
- **Weighted scoring** based on work value
- **Visual charts** showing contribution patterns
- **Detailed breakdowns** per contributor
- **Complete audit trail** of all commits

---

## Menu Options

After setup, you'll have a **GitHub Tracker** menu with these options:

| Menu Item | Description |
|-----------|-------------|
| 1. Setup Sheets | Creates Config, Summary, and Raw Data sheets |
| 2. Create Required Sheets | Recreates sheets if accidentally deleted |
| 3. Auto-Fill My Username | Fills repo owner with your GitHub username |
| 4. List Available Repos | Shows all repos you have access to |
| 5. Set Selected Repo | Sets config from selected repo row |
| 6. Create Commit History Sheet | Creates detailed commit tracking sheet |
| 7. Fetch Detailed Commit History | Populates commit history |
| **Fetch Contributions** | Main action - analyzes the repository |
| **Recalculate Scores** | Updates scores with new weights (no re-fetch) |

---

## Understanding the Output

### Config Sheet

The configuration sheet contains:

**Credentials Section (Yellow cells = edit these):**
- **GitHub Token:** Your personal access token
- **Repo Owner:** Username or organization
- **Repo Name:** Repository to analyze

**Date Range Section:**
- **Days Back:** Analyze last N days
- **Start Date:** Specific start date (overrides Days Back)

**Weights Section:**
- All 8 work type weights (editable)
- Change these to adjust scoring priorities

**Quick Start Guide:**
- Step-by-step instructions
- Explanation of weights

---

### Summary Sheet

The main results sheet with:

#### Top Section
- Current weight settings (reference)
- Help banner reminding how to recalculate

#### Chart (Upper Right)
6-color stacked column chart showing:
- Each contributor as a column
- Work types as colored segments
- Legend at bottom with descriptions

**Color coding:**
- 🟢 Green: Features (3.0x)
- 🟡 Yellow: Bug Fixes (2.0x)
- 🔴 Red: Refactoring (0.7x-0.1x)
- 🔵 Blue: Testing (0.4x)
- 🟣 Purple: Documentation (0.3x)
- 🟠 Orange: Support (0.5x)

#### Contributor Sections

For each contributor:

**Header Row:**
```
TeamMemberA                              Total Score: 2,189.7
```

**Summary Stats:**
```
• 43 commits
• 5 PRs created, 4 merged
• 3 PRs reviewed, 12 review comments
• 2 issues created, 8 issue comments
```

**Work Type Breakdown Table:**
```
Type                 Lines    Weight    Points    % of Score
─────────────────────────────────────────────────────────────
✨ Feature Creation    511      3.0x    1,533.0     70.00%
🐛 Bug Fixing          274      2.0x      548.0     25.00%
📚 Documentation       177      0.3x       53.1      2.40%
...
─────────────────────────────────────────────────────────────
TOTAL                  959              2,189.7    100.00%
```

**Most Active Files:**
```
1. querier/querier.c
2. crawler/crawler.c
3. common/index.c
```
Shows where they focused their attention (by commit count).

**Score Breakdown:**
```
Code:          2,136.6
Documentation:    53.1
TOTAL:         2,189.7
```

---

### Raw Data Sheet

Contains raw statistics:
- Username
- Commit count
- Lines by category (code, docs, tests)
- PR statistics
- Issue statistics

Useful for exporting or creating custom analyses.

---

### Commit History Sheet

Detailed commit-by-commit view:

| Column | Description |
|--------|-------------|
| Date | Commit timestamp |
| SHA | Commit hash (first 7 chars) |
| Author | Who wrote the code |
| Committer | Who committed (may differ if rebased) |
| Message | First line of commit message |
| Files | Number of files changed |
| Additions | Lines added |
| Deletions | Lines removed |
| Work Type | Categorization (Feature, Bug Fix, etc.) |
| Co-Authors | Any co-authors from commit message |

**Yellow rows** indicate merge commits (skipped in scoring).

---

## Work Type Categorization

### How It Works

Each commit is analyzed using multiple signals:

1. **Commit message keywords**
   - "fix", "bug", "patch" → Bug Fixing
   - "add", "new", "feature", "implement" → Feature Creation
   - "refactor", "clean", "improve" → Refactoring
   - "test", "spec" → Testing
   - "doc", "readme", "comment" → Documentation

2. **File patterns**
   - `*test*.py`, `*_spec.js` → Testing
   - `*.md`, `*.rst`, `*.txt` → Documentation
   - `Makefile`, `*.yml`, `*.json` → Support Code

3. **Change size**
   - Large additions to new files → Feature Creation
   - Small targeted changes → Bug Fixing
   - Deletions > additions → Refactoring

4. **Combination logic**
   - Multiple signals weighted together
   - Most specific match wins

### Work Type Definitions

**✨ Feature Creation (Default: 3.0x)**
- New files and modules
- Significant new functionality
- Adding major components

**🐛 Bug Fixing (Default: 2.0x)**
- Fixing defects in existing code
- Patching issues
- Resolving errors

**🔧 High Refactoring (Default: 0.7x)**
- Major code restructuring
- Large-scale improvements
- Architecture changes

**🔨 Medium Refactoring (Default: 0.3x)**
- Moderate code improvements
- Method extraction
- Code organization

**📝 Low Refactoring (Default: 0.1x)**
- Minor cleanup
- Formatting fixes
- Small style improvements

**🧪 Testing (Default: 0.4x)**
- Test files
- Test utilities
- Validation scripts

**📚 Documentation (Default: 0.3x)**
- README files
- Code comments
- Guides and docs

**🔩 Support Code (Default: 0.5x)**
- Build scripts
- Configuration files
- CI/CD pipelines
- Utility scripts

---

## Customizing Weights

### When to Adjust Weights

**Increase Feature weight when:**
- Building MVP or new product
- Rewarding new functionality
- Greenfield projects

**Increase Bug Fix weight when:**
- Stabilization phase
- Quality is critical
- Reducing tech debt

**Increase Refactoring weight when:**
- Code quality matters
- Mature codebase
- Preparing for scale

**Increase Testing weight when:**
- TDD/BDD methodology
- High reliability requirements
- Testing-focused course

**Increase Documentation weight when:**
- Open source project
- Team onboarding focus
- API documentation needed

**Increase Support Code weight when:**
- DevOps focus
- Build system work
- Infrastructure projects

### How to Change Weights

1. Go to **Config** sheet
2. Find the Weights section (rows 12-19)
3. Change any value in column B
4. Run **GitHub Tracker → Recalculate Scores**

Scores update instantly without re-fetching from GitHub!

---

## Filtering External Code

### Automatic Detection

The tool automatically skips commits with:
- "starter code" in message
- "provided files" in message
- "instructor provided" in message
- "libcs50" or similar library imports
- Commits before the configured start date

### Using Start Date

To exclude instructor-provided code:

1. Find the date when students started their own work
2. Set **Start Date** (B8) in Config to that date
3. Re-run **Fetch Contributions**

Format: `YYYY-MM-DD` (e.g., `2024-09-15`)

---

## Interpreting Results

### High Score Contributors

**Mostly Features (green):**
- Building new functionality
- Core development work
- May need to balance with other types

**Mostly Bug Fixes (yellow):**
- Problem solvers
- Quality focused
- May be working on complex areas

**Balanced Colors:**
- Well-rounded contributor
- Works across all areas
- Versatile team member

### Lower Score Contributors

**Check their breakdown:**
- Lots of documentation? Valuable but lower weighted
- Infrastructure/support? Essential but lower weighted
- Consider adjusting weights if this work is undervalued

**Consider context:**
- New to the project? Learning curve
- Part-time contributor? Adjust expectations
- Specialist role? May be appropriate

---

## Best Practices

### For Instructors

1. **Set start date carefully** - Exclude all pre-provided code
2. **Adjust weights for your course** - Testing-focused? Increase testing weight
3. **Look beyond total scores** - Work type breakdown tells the real story
4. **Use for discussion, not just grading** - Helps students understand contributions

### For Team Leads

1. **Compare work type distributions** - Is the team balanced?
2. **Identify specialists** - Who focuses on what?
3. **Track over time** - Run monthly to see trends
4. **Recognize all contributions** - Documentation matters too

### For Individual Contributors

1. **Understand your profile** - What type of work do you do most?
2. **Diversify if needed** - Consider trying different work types
3. **Quality over quantity** - Gaming won't help long-term
4. **Document your work** - Helps others understand your contributions

---

## Limitations

### What the Tool Can't Measure

- **Code quality** - Lines ≠ good code
- **Complexity** - Simple vs hard problems
- **Impact** - Business value of changes
- **Collaboration** - Helping others (unless co-authored)
- **Design work** - Planning and architecture discussions

### Known Limitations

- **Single repository** - Can't aggregate multiple repos (yet)
- **GitHub only** - No GitLab/Bitbucket support
- **Public/accessible repos** - Token needs access
- **API rate limits** - Very large repos may hit limits

---

## Troubleshooting

### Chart Doesn't Appear
1. Check that data exists in the chart data table (columns H-N)
2. Try running **Fetch Contributions** again
3. Check for errors in **Extensions → Apps Script → Executions**

### Scores Seem Wrong
1. Verify weights are set correctly
2. Check if external code is being included (adjust start date)
3. Review commit categorization in Commit History sheet
4. Run **Recalculate Scores** after any weight changes

### Missing Contributors
1. Check date range - are their commits in that period?
2. Verify they committed (not just commented/reviewed)
3. Check for name normalization issues in logs

### Slow Performance
1. Large repos take longer - be patient
2. Reduce date range to analyze less history
3. Check GitHub API rate limits (60/hour unauthenticated, 5000/hour authenticated)

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Run last menu item | Alt+Shift+F (then Enter) |
| Open script editor | Extensions → Apps Script |
| Refresh sheet | F5 or Ctrl/Cmd+R |

---

## Next Steps

- [Configuration Guide](CONFIGURATION.md) - Advanced settings
- [FAQ](FAQ.md) - Common questions
- [Fairness & Equity](FAIRNESS.md) - Why this tool is fair
