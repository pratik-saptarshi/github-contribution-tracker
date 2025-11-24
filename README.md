# GitHub Contribution Tracker with Smart Scoring

> **Intelligent analysis of GitHub contributions that goes beyond simple line counts.**

A Google Sheets-based tool that provides **fair, nuanced evaluation** of developer contributions by intelligently categorizing work into 8 types and applying customizable weights to reflect the true value of different kinds of contributions.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Google%20Sheets-green.svg)
![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)

---

## 🎯 The Problem

**GitHub's built-in analytics are misleading:**
- Treats all lines equally (1 line of config = 1 line of critical algorithm)
- Easy to game with many tiny commits
- Counts starter code and auto-generated files
- Doesn't distinguish features from bug fixes from documentation
- Encourages quantity over quality

**This tool solves these problems** by understanding *what kind of work* was done, not just *how much*.

---

## ✨ Key Features

### Smart Work Type Categorization
Automatically categorizes commits into 8 types:

| Work Type | Default Weight | What It Measures |
|-----------|----------------|------------------|
| ✨ Feature Creation | 3.0x | New functionality and components |
| 🐛 Bug Fixing | 2.0x | Fixes to existing code |
| 🔧 High Refactoring | 0.7x | Major code improvements |
| 🔨 Medium Refactoring | 0.3x | Moderate improvements |
| 📝 Low Refactoring | 0.1x | Minor cleanup |
| 🧪 Testing | 0.4x | Test scripts and validation |
| 📚 Documentation | 0.3x | READMEs, comments, guides |
| 🔩 Support Code | 0.5x | Build scripts, configs, utilities |

### Customizable Weights
Adjust weights to match your project priorities:
- Building MVP? → Increase Feature weight
- Mature product? → Boost Refactoring and Testing
- Compliance-heavy? → Increase Documentation weight

### Gaming-Resistant
Multiple safeguards prevent inflating scores:
- Minimum line thresholds (tiny commits don't count)
- Merge commit exclusion (no credit for merges)
- External code filtering (starter code excluded)
- Net change tracking (repeated edits don't inflate)

### Beautiful Visualization
6-color stacked column chart shows:
- Work type composition per contributor
- Team balance (builders vs maintainers)
- Specializations vs generalists

### Complete Transparency
Every point is explainable:
- Work type breakdown with exact lines and percentages
- Most active files showing focus areas
- Full commit history with co-authors
- PR, review, and issue tracking

---

## 📊 Example Output

### Contributor Summary
```
TeamMemberA                                Total Score: 2,189.7

Summary:
• 43 commits
• 0 PRs created, 0 merged
• 0 PRs reviewed, 0 review comments
• 0 issues created, 0 issue comments

Work Type Breakdown:
┌────────────────────┬───────┬────────┬─────────┬───────────┐
│ Type               │ Lines │ Weight │ Points  │ % of Score│
├────────────────────┼───────┼────────┼─────────┼───────────┤
│ ✨ Feature Creation │  511  │  3.0x  │ 1,533.0 │   70.00%  │
│ 🐛 Bug Fixing       │  274  │  2.0x  │   548.0 │   25.00%  │
│ 📚 Documentation    │  177  │  0.3x  │    53.1 │    2.40%  │
│ 🔨 Medium Refactor  │  149  │  0.3x  │    44.7 │    2.00%  │
│ 🧪 Testing          │   26  │  0.4x  │    10.4 │    0.50%  │
│ 🔩 Support Code     │    1  │  0.5x  │     0.5 │    0.00%  │
└────────────────────┴───────┴────────┴─────────┴───────────┘
TOTAL                    959            2,189.7     100.00%

Most Active Files:
1. querier/querier.c
2. crawler/crawler.c
3. common/index.c
4. indexer/indexer.c
5. common/pagedir.c
```

### Visual Chart
The stacked column chart shows at a glance who does what type of work:

```
     │                          ┌──── Features (green)
     │    ████                  │
     │    ████  ████            ├──── Bug Fixes (yellow)
     │    ████  ████  ██        │
     │    ████  ████  ██        └──── Other types (various colors)
     └────────────────────
          A     B     C
        Contributors
```

---

## 🚀 Quick Start

### 1. Create a New Google Sheet
Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.

### 2. Open Script Editor
Click **Extensions → Apps Script**

### 3. Paste the Code
Copy the entire contents of [`Code.gs`](Code.gs) and paste it into the script editor.

### 4. Save and Refresh
- Save the script (Ctrl/Cmd + S)
- Close the script editor
- Refresh your spreadsheet page

### 5. Run Setup
From the menu bar: **GitHub Tracker → 1. Setup Sheets**
- Authorize the script when prompted

### 6. Add Your GitHub Token
- Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
- Generate a token with `repo` scope
- Paste it in cell B2 of the Config sheet

### 7. Select Repository
- Run **GitHub Tracker → 3. Auto-Fill My Username**
- Run **GitHub Tracker → 4. List Available Repos**
- Click on the repo you want to analyze
- Run **GitHub Tracker → 5. Set Selected Repo**

### 8. Fetch Contributions
Run **GitHub Tracker → Fetch Contributions**

Done! Check the **Summary** sheet for results.

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](docs/SETUP_GUIDE.md) | Detailed installation instructions |
| [User Guide](docs/USER_GUIDE.md) | How to use all features |
| [Fairness & Equity](docs/FAIRNESS.md) | Why this tool is fair |
| [Configuration](docs/CONFIGURATION.md) | Customizing weights and settings |
| [FAQ](docs/FAQ.md) | Common questions |

---

## 🆚 vs. GitHub Insights

| Feature | GitHub Insights | This Tool |
|---------|----------------|-----------|
| Work type breakdown | ❌ No | ✅ 8 categories |
| Customizable weights | ❌ No | ✅ Full control |
| Filter external code | ❌ No | ✅ Auto-detect |
| Gaming prevention | ❌ None | ✅ Multiple safeguards |
| Visual breakdown by type | ❌ No | ✅ Stacked chart |
| Recalculate scores | ❌ N/A | ✅ Instant |
| Minimum thresholds | ❌ No | ✅ Configurable |
| Co-author credit | ❌ No | ✅ Full tracking |
| Export/share | ❌ Screenshots | ✅ Google Sheets |

**GitHub shows:** `TeamMemberB: 1,913 additions (MOST LINES)`

**This tool reveals:**
```
TeamMemberA: 2,189.7 pts (MOST VALUE)
├── 70% high-impact features
└── 25% bug fixes

TeamMemberB: 1,810.4 pts
├── 40% features
├── 32% bug fixes  
└── 10% testing (quality-focused)

TeamMemberC: 438.8 pts
├── 46% support code (infrastructure)
└── 29% refactoring (code quality)
```

GitHub's raw line count makes TeamMemberB look like top contributor, but this tool shows TeamMemberA delivered the most value, and reveals TeamMemberC's specialized infrastructure role.

---

## 🎓 Ideal Use Cases

- **CS Courses** - Fair grading for team projects
- **Small Dev Teams** - Understand team dynamics
- **Open Source Projects** - Recognize diverse contributors
- **Performance Reviews** - Data-driven evaluation
- **Bootcamps** - Track student progress

---

## ⚙️ Configuration Options

### Weights (Config Sheet)
```
Feature Creation:    3.0x  (default)
Bug Fixing:          2.0x
High Refactoring:    0.7x
Medium Refactoring:  0.3x
Low Refactoring:     0.1x
Testing:             0.4x
Documentation:       0.3x
Support Code:        0.5x
```

### Date Range
Set a start date to exclude:
- Instructor-provided starter code
- Initial repository setup
- Work before the project officially began

### Instant Recalculation
Changed weights? Run **GitHub Tracker → Recalculate Scores** to update all points without re-fetching from GitHub.

---

## 🛡️ Privacy & Security

- **Your token stays in your sheet** - Never sent anywhere except GitHub's API
- **No external servers** - Everything runs in Google Apps Script
- **No data collection** - We don't track anything
- **Open source** - Inspect the code yourself

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ideas for Contributions
- Support for additional languages/file types
- New work type categories
- GitLab/Bitbucket support
- Improved commit message parsing
- Additional visualizations
- Multi-repo aggregation

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built to promote **fair evaluation** of diverse contribution styles in software development.

Special thanks to:
- CS educators who need better tools for team project grading
- Open source maintainers who recognize that not all contributions are code
- Everyone who believes quality matters more than quantity

---

## 📬 Support

- **Issues:** [GitHub Issues](../../issues)
- **Discussions:** [GitHub Discussions](../../discussions)

---

**Made with ❤️ for fair contribution tracking**
