# GitHub Contribution Tracker with Smart Scoring

## What This Tool Does

A Google Sheets-based application that analyzes GitHub repositories to provide **fair, nuanced evaluation of developer contributions** beyond simple line counts. It intelligently categorizes work into 8 types and applies customizable weights to reflect the true value and difficulty of different kinds of contributions.

### Core Functionality

**Analyzes:**
- Commits with detailed file-level tracking
- Pull requests (created, merged, reviewed)
- Code reviews and comments
- Issues (created and commented on)
- Co-authorship from commit messages

**Categorizes work into 8 types:**
1. **Feature Creation** (3.0x default) - New functionality
2. **Bug Fixing** (2.0x default) - Fixes to existing code
3. **High Refactoring** (0.7x default) - Major code improvements
4. **Medium Refactoring** (0.3x default) - Moderate improvements
5. **Low Refactoring** (0.1x default) - Minor cleanup
6. **Testing** (0.4x default) - Test scripts and validation
7. **Documentation** (0.3x default) - READMEs, comments, guides
8. **Support Code** (0.5x default) - Build scripts, configs, utilities

**Outputs:**
- Visual stacked column chart showing work type distribution
- Detailed contributor breakdowns with scores and percentages
- Most active files (showing focus areas)
- Work type breakdown table
- Complete commit history with co-authors

---

## Ensuring Accuracy

We implemented multiple safeguards to ensure the data is accurate and reflects actual contribution quality:

### 1. **Smart Work Type Categorization** 🎯

**Problem:** Not all code is equal. Adding 500 lines of new features ≠ fixing 500 lines of bugs ≠ reformatting 500 lines.

**Solution:** Intelligent categorization using multiple signals:
- **Commit message keywords** - "fix bug", "add feature", "refactor", "test"
- **File patterns** - test files, documentation files, config files
- **Change size** - Small tweaks vs major additions
- **File categories** - Code vs docs vs data files

**Example:**
```
Commit: "Fix memory leak in parser"
Files: parser.c (50 lines changed)
→ Categorized as: Bug Fixing (2.0x weight)

Commit: "Add new authentication module"  
Files: auth.c (200 lines added)
→ Categorized as: Feature Creation (3.0x weight)
```

### 2. **Line Count Thresholds** 🚫

**Problem:** Tiny commits can game the system (e.g., 50 commits changing 1 line each).

**Solution:** Minimum thresholds prevent noise:
- **Code commits:** Must change at least 10 lines
- **Documentation commits:** Must change at least 5 lines
- **Below threshold:** Commit is counted but contributes 0 points

**Impact:** Prevents gaming while still tracking all commits.

### 3. **External Code Filtering** 🔍

**Problem:** Students shouldn't get credit for instructor-provided starter code or library files.

**Solution:** Automatic detection and exclusion:
- Commit messages: "starter code", "provided files", "instructor provided"
- Library patterns: "libcs50", "libcs101", etc.
- Date filtering: Exclude all commits before configurable start date

**Example:**
```
Commit: "Add libcs50 files"
→ Skipped entirely (external code)

Commit: "Import starter code from instructor"
→ Skipped entirely (external code)
```

### 4. **Merge Commit Exclusion** 🔄

**Problem:** Merge commits don't represent new work - they just combine branches.

**Solution:** Automatically skip all merge commits (commits with 2+ parents).

**Impact:** Only counts actual development work.

### 5. **GitHub Username as Identifier** 👤

**Problem:** Same person could appear multiple times if git name doesn't match GitHub username.

**Solution:** Use `author.login` (GitHub username) as primary identifier:
- Consistent across commits, PRs, reviews, issues
- No manual name mapping needed
- Automatic deduplication

**Fallback:** Only uses git config name if GitHub user isn't linked (rare).

### 6. **Net Change Tracking** 📊

**Problem:** Editing same file repeatedly inflates line counts.

**Solution:** Track additions and deletions separately per file:
- `additions` - Total lines added
- `deletions` - Total lines deleted
- `netChange` - additions - deletions (true impact)

**Impact:** Shows actual codebase growth, not just churn.

### 7. **Commit Count Per File** 📁

**Problem:** Can't tell where developer spent most time.

**Solution:** Track unique commits touching each file using Set:
- Each file stores Set of commit SHAs
- "Most Active Files" shows where focus was concentrated
- Can't inflate by editing same line repeatedly

### 8. **Co-Author Recognition** 🤝

**Problem:** Pair programming and collaboration often goes unrecognized.

**Solution:** Parse co-authors from commit messages:
- Detects "Co-authored-by: Name <email>" in commits
- Gives partial credit to all co-authors
- Shows in Commit History sheet

**Example:**
```
Commit by: TeamMemberA (500 lines)
Co-authored-by: TeamMemberB

Result:
- TeamMemberA: Gets full credit
- TeamMemberB: Marked as co-author, tracked separately
```

---

## Promoting Equity

Beyond accuracy, we built features to ensure fair evaluation of different contribution styles:

### 1. **Multiple Work Types Valued** ⚖️

**Equity concern:** Traditional metrics only value "new code" - ignoring critical work like bug fixes, testing, documentation, and refactoring.

**Solution:** 8 distinct work types with customizable weights:
- **Feature builders** get credit for new functionality
- **Bug fixers** get high credit (2.0x default) for solving problems
- **Code quality specialists** get credit for refactoring (0.7x-0.1x)
- **Test engineers** get credit for validation work (0.4x)
- **Technical writers** get credit for documentation (0.3x)
- **Infrastructure engineers** get credit for build/config work (0.5x)

**Impact:** Recognizes that **all types of contributions have value**.

### 2. **Customizable Weights** 🎛️

**Equity concern:** Different projects value different work types - one-size-fits-all scoring isn't fair.

**Solution:** Fully customizable weights in Config sheet:
- **Startup building MVP?** → Increase Feature Creation weight
- **Mature product with tech debt?** → Increase Refactoring weight
- **Compliance-heavy project?** → Increase Documentation weight
- **Testing-focused course?** → Increase Testing weight

**Impact:** Scoring adapts to **project priorities**, not arbitrary defaults.

### 3. **Instant Recalculation** ⚡

**Equity concern:** If weights change mid-project, students who worked early are disadvantaged.

**Solution:** "Recalculate Scores" updates all points instantly:
- Preserves all commit data (PRs, reviews, issues)
- Recalculates scores with new weights
- No need to re-fetch from GitHub
- Takes <10 seconds

**Impact:** Can adjust weights retroactively without losing data.

### 4. **Transparent Scoring** 📊

**Equity concern:** Students don't understand why they got their score.

**Solution:** Complete breakdown for each contributor:
- **Work Type Breakdown table** - Shows exact lines and points per category
- **Percentage of total** - Shows relative contribution per work type
- **Most Active Files** - Shows where they focused effort
- **All commit history** - Complete audit trail
- **Visual chart** - Easy-to-understand color-coded stacks

**Impact:** Students can see exactly where their points came from.

### 5. **Multiple Contribution Channels** 🌐

**Equity concern:** Only counting commits ignores code reviews, mentoring, issue triage, and project management.

**Solution:** Track all GitHub activity:
- **Commits** - Direct code contributions
- **PRs created/merged** - Shows feature completion
- **PRs reviewed** - Shows code review participation
- **Review comments** - Shows mentoring and feedback
- **Issues created** - Shows problem identification
- **Issue comments** - Shows debugging assistance and discussion

**Impact:** Recognizes **different ways people contribute** beyond just writing code.

### 6. **Context-Aware Categorization** 🧠

**Equity concern:** Simple keyword matching can misclassify commits.

**Solution:** Multi-signal categorization:
- Checks commit message keywords
- Analyzes which files changed
- Considers change size (small tweak vs major addition)
- Evaluates file types (code vs docs vs config)

**Example:**
```
Commit: "Update README"
Files: README.md (100 lines)
→ Correctly categorized as Documentation (not Feature)

Commit: "Add tests for authentication"
Files: test_auth.py (80 lines)
→ Correctly categorized as Testing (not Feature)
```

**Impact:** More accurate classification = fairer scoring.

### 7. **No Penalty for Efficiency** 🎯

**Equity concern:** Students who write clean, concise code get fewer points than those who write verbose code.

**Challenge:** This is hard to solve perfectly, but we mitigate with:
- **Refactoring credit** - Get points for making code smaller/better
- **Bug fix bonus** - Fixing problems weighted higher (2.0x)
- **Code quality matters** - Clean code often = fewer bugs = less rework

**Limitation:** We acknowledge line count is imperfect, but it's measurable and objective.

### 8. **Date Range Flexibility** 📅

**Equity concern:** Students who start earlier shouldn't get credit for setup/boilerplate.

**Solution:** Configurable start date in Config sheet:
- Set to **after** instructor provides starter code
- Set to **after** team setup/initialization
- Set to **when actual development begins**

**Impact:** Only counts work done during the relevant period.

### 9. **Team Visibility** 👥

**Equity concern:** In team projects, some students might claim credit for others' work.

**Solution:** Complete transparency:
- **Individual breakdowns** - Each person's exact contributions
- **Commit history** - Full audit trail with timestamps
- **Co-author tracking** - Shows collaborative work
- **File-level detail** - See who worked on what

**Impact:** Impossible to hide who did what work.

### 10. **Handles Different Skill Levels** 📈

**Equity concern:** Beginners might produce more commits (trial and error) vs experts (fewer, better commits).

**Design choices to balance this:**
- **Quality over quantity** - Bug fixes and refactoring weighted high
- **Minimum thresholds** - Tiny commits don't count
- **Work type diversity** - Multiple ways to contribute
- **Customizable weights** - Instructor can adjust for course level

**Example:**
```
Beginner: 50 commits, lots of trial and error, many bug fixes
→ Gets credit for learning and fixing mistakes

Expert: 20 commits, clean code, fewer bugs
→ Gets credit for features and code quality (refactoring)
```

---

## What Makes This Tool Unique

### vs. GitHub's Built-In Analytics

GitHub provides "Insights" and "Contributors" pages, but they're extremely limited for fair evaluation:

#### GitHub's Limitations:

**1. No Work Type Differentiation** ❌
```
GitHub shows:
- TeamMemberA: 2,450 additions, 350 deletions

What it doesn't tell you:
- Was it 2,450 lines of new features? Bug fixes? Documentation? Test code?
- All work treated equally (1 line of config = 1 line of critical algorithm)
```

**2. Gaming-Friendly** ❌
```
GitHub counts:
- 100 commits changing 1 line each = 100 lines
- Repeatedly editing same file = multiple counts
- Merge commits = inflated numbers
- Auto-generated code = same credit as hand-written

No thresholds, no filtering, no context.
```

**3. Missing Context** ❌
```
GitHub doesn't show:
- Why commits were made (feature vs fix vs cleanup)
- Relative value of different work types
- Team contribution patterns
- Work distribution across categories
```

**4. No Customization** ❌
```
GitHub's view:
- Fixed metrics (additions/deletions)
- Can't weight by importance
- Can't adjust for project priorities
- One-size-fits-all
```

**5. Poor Visualization** ❌
```
GitHub shows:
- Bar charts of commits over time
- List of contributors with line counts
- No breakdown by work type
- No comparative analysis
```

**6. Doesn't Exclude External Code** ❌
```
GitHub counts:
- Instructor-provided starter code
- Library files (libcs50, etc.)
- Template boilerplate
- Package lock files

Can't filter any of this out.
```

#### Our Tool's Advantages:

**1. Intelligent Categorization** ✅
```
Our tool shows:
TeamMemberA:
- Feature Creation: 511 lines (1,533 pts @ 3.0x)
- Bug Fixing: 274 lines (548 pts @ 2.0x)
- Testing: 91 lines (36 pts @ 0.4x)
- Documentation: 177 lines (53 pts @ 0.3x)

Understand WHAT they built, not just HOW MUCH.
```

**2. Gaming-Resistant** ✅
```
Our safeguards:
- Minimum 10-line threshold for code commits
- Merge commits excluded automatically
- External code filtered out
- Net change tracking (not just churn)
- Commit count per file (not line repeats)
```

**3. Rich Context** ✅
```
Complete picture:
- Work type breakdown with percentages
- Most active files (focus areas)
- PRs, reviews, issues (beyond commits)
- Co-author recognition
- Complete audit trail
```

**4. Fully Customizable** ✅
```
Adapt to your needs:
- Adjust weights per work type
- Set start date to exclude setup
- Filter external code patterns
- Recalculate instantly with new weights
```

**5. Meaningful Visualization** ✅
```
Stacked column chart shows:
- Work type composition per person
- Team balance (builders vs maintainers)
- Specializations vs generalists
- Relative contributions
- Color-coded with descriptive legend
```

**6. Smart Filtering** ✅
```
Automatically excludes:
- Starter code commits ("provided files")
- Library imports ("libcs50")
- Commits before start date
- Merge commits (no new work)
- Tiny commits (< threshold)
```

#### Side-by-Side Comparison

| Feature | GitHub Insights | Our Tool |
|---------|----------------|----------|
| **Work type breakdown** | ❌ No | ✅ 8 categories |
| **Customizable weights** | ❌ No | ✅ Full control |
| **Filter external code** | ❌ No | ✅ Auto-detect |
| **Gaming prevention** | ❌ None | ✅ Multiple safeguards |
| **Code reviews tracked** | ✅ Basic | ✅ With comments |
| **Visual breakdown** | ❌ Simple bars | ✅ Stacked chart by type |
| **Recalculate scores** | ❌ N/A | ✅ Instant |
| **Export/share** | ❌ Screenshots only | ✅ Google Sheets |
| **Minimum thresholds** | ❌ No | ✅ Configurable |
| **Co-author credit** | ❌ No | ✅ Full tracking |
| **Most active files** | ❌ No | ✅ Yes |
| **Date range filtering** | ⚠️ Limited | ✅ Flexible |
| **Point system** | ❌ Just counts | ✅ Weighted scoring |

#### Real-World Example

**GitHub says:**
```
TeamMemberA: 959 additions, 0 deletions, 43 commits
TeamMemberB: 1913 additions, 0 deletions, 67 commits
TeamMemberC: 603 additions, 0 deletions, 27 commits

Ranking by additions:
1. TeamMemberB (most lines)
2. TeamMemberA
3. TeamMemberC (least lines)
```

**Our tool reveals:**
```
TeamMemberA: 2189.7 pts
- 70% Feature Creation (1,533 pts) - Building new modules
- 25% Bug Fixing (548 pts) - High-value problem solving
- 2% Documentation (53 pts)

TeamMemberB: 1810.4 pts
- 40% Feature Creation (732 pts)
- 32% Bug Fixing (588 pts)
- 10% Testing (186 pts) - Quality assurance
- 8% Refactoring (137 pts) - Code improvement

TeamMemberC: 438.8 pts
- 46% Support Code (202 pts) - Infrastructure work
- 29% Refactoring (126 pts) - Code cleanup
- 21% Documentation (90 pts) - Technical writing

Real ranking by value:
1. TeamMemberA (feature-focused, high-impact)
2. TeamMemberB (balanced, quality-focused)
3. TeamMemberC (infrastructure, specialized role)
```

**The difference:**
- **GitHub:** TeamMemberB looks like top contributor (most lines)
- **Our tool:** Shows TeamMemberA delivered most value (high-impact features + bug fixes)
- **Our tool:** Shows TeamMemberC's specialized infrastructure role (hidden in GitHub's view)

#### Why This Matters for Education

**Scenario: CS Course Team Project**

**GitHub's view encourages:**
- ❌ Writing more code (not better code)
- ❌ Avoiding refactoring (removes lines, looks bad)
- ❌ Skipping documentation (no line credit)
- ❌ Inflating commits (many tiny ones)
- ❌ Competition over line counts

**Our tool encourages:**
- ✅ Building meaningful features (high weight)
- ✅ Fixing bugs properly (2.0x weight)
- ✅ Refactoring for quality (gets credit)
- ✅ Writing tests (valued appropriately)
- ✅ Documentation (recognized work)
- ✅ All contribution types (holistic view)

**Result:** Students focus on **quality and diverse contributions**, not just maximizing line counts.

---

## What Makes This Tool Unique

### 1. **Beyond Line Counting**
Most tools just count additions/deletions. We **understand what kind of work** was done.

### 2. **Customizable for Context**
Weights adapt to your project priorities - not one-size-fits-all.

### 3. **Gaming-Resistant**
Multiple safeguards prevent inflating scores artificially.

### 4. **Complete Transparency**
Every point is explained and auditable.

### 5. **Recognizes All Contributions**
Not just code - reviews, documentation, testing, refactoring all count.

### 6. **Easy to Use**
Runs in Google Sheets, no installation, one-click updates.

---

## Ideal Use Cases

✅ **Computer Science Courses** - Fair grading for team projects  
✅ **Software Teams** - Understand team dynamics and contributions  
✅ **Open Source Projects** - Recognize diverse contributor types  
✅ **Performance Reviews** - Data-driven evaluation with context  
✅ **Bootcamps** - Track student progress and engagement  

---

## Limitations & Future Improvements

### Current Limitations:

1. **Line count as proxy** - More lines ≠ better code (but it's measurable)
2. **Single repo** - Can't aggregate across multiple repositories yet
3. **No code quality metrics** - Doesn't measure bugs introduced or code complexity
4. **GitHub only** - Doesn't work with GitLab, Bitbucket, etc.

### Potential Enhancements:

1. **Multi-repo tracking** - Aggregate contributions across multiple projects
2. **Time-series analysis** - Show contribution trends over time
3. **Team comparison** - Compare multiple teams side-by-side
4. **Automated reports** - Generate PDFs for performance reviews
5. **Integration with CI/CD** - Factor in test pass rates, code coverage
6. **Code review quality** - Weight reviews by thoroughness/helpfulness

---

## Design Philosophy

Our guiding principles:

1. **Fair ≠ Equal** - Different work types have different value
2. **Transparent** - Every score is explainable and auditable
3. **Flexible** - Adapt to different contexts and priorities
4. **Accurate** - Multiple safeguards against gaming and errors
5. **Holistic** - Recognize all types of contributions
6. **Simple** - Easy to use without sacrificing sophistication

---

## Summary

This tool provides **fair, nuanced, and transparent evaluation** of GitHub contributions by:

✅ **Intelligently categorizing** work into 8 meaningful types  
✅ **Applying customizable weights** that reflect project priorities  
✅ **Preventing gaming** through thresholds and smart detection  
✅ **Recognizing all contributions** beyond just code  
✅ **Providing complete transparency** with detailed breakdowns  
✅ **Adapting to context** through configurable weights and filters  

The result: A tool that values **quality over quantity**, recognizes **different contribution styles**, and provides **fair evaluation** for diverse types of development work.
