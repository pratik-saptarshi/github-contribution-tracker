# Configuration Reference

Complete guide to all configuration options in the GitHub Contribution Tracker.

---

## Config Sheet Overview

The Config sheet is created when you run **GitHub Tracker → 1. Setup Sheets**.

**Yellow cells** are inputs you should edit.
**Gray cells** are labels or read-only information.

---

## Required Settings

### GitHub Token (B2)

**What:** Your GitHub Personal Access Token

**How to get one:**
1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Name it (e.g., "Contribution Tracker")
4. Select `repo` scope
5. Generate and copy the token

**Format:** `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Security note:** 
- Token is stored only in your spreadsheet
- Never shared with external services
- Only used to call GitHub's API

---

### Repo Owner (B3)

**What:** The GitHub username or organization that owns the repository

**Examples:**
- `johndoe` (personal repo)
- `microsoft` (organization repo)
- `cs50` (course organization)

**Auto-fill:** Run **GitHub Tracker → 3. Auto-Fill My Username** to automatically populate with your username.

---

### Repo Name (B4)

**What:** The name of the repository to analyze

**Examples:**
- `my-project`
- `team-assignment-1`
- `final-project`

**Auto-select:** 
1. Run **GitHub Tracker → 4. List Available Repos**
2. Click on a repo row in the Available Repos sheet
3. Run **GitHub Tracker → 5. Set Selected Repo**

**Alternative format:** You can also enter `owner/repo` in this cell (e.g., `cs50/project1`) and leave B3 empty.

---

## Date Range Settings

### Days Back (B7)

**What:** Number of days of history to analyze

**Default:** `90`

**Examples:**
- `30` - Last month
- `90` - Last quarter
- `365` - Last year

**Note:** Ignored if Start Date (B8) is set.

---

### Start Date (B8)

**What:** Specific date to start analysis from

**Format:** `YYYY-MM-DD` (e.g., `2024-09-01`)

**When to use:**
- Course projects: Set to after starter code was added
- Sprint analysis: Set to sprint start date
- New team member: Set to their start date

**Note:** Overrides Days Back if both are set.

---

## Work Type Weights

All weights are in column B, rows 12-19.

### Feature Creation Weight (B12)

**Default:** `3.0`

**What it affects:** Points for new functionality, new files, major additions

**When to increase:**
- Building MVP or new product
- Greenfield projects
- Innovation-focused teams

**When to decrease:**
- Maintenance-heavy work
- Refactoring phase

---

### Bug Fixing Weight (B13)

**Default:** `2.0`

**What it affects:** Points for fixing bugs, patching issues, resolving errors

**When to increase:**
- Stabilization phase
- Quality-critical systems
- After major releases

**When to decrease:**
- Rarely - bug fixes are almost always valuable

---

### Testing Weight (B14)

**Default:** `0.4`

**What it affects:** Points for test files, test utilities, validation scripts

**When to increase:**
- TDD/BDD methodology
- High reliability requirements
- Testing-focused courses
- Regulated industries

**When to decrease:**
- Prototype phase
- Experimental projects

---

### High Refactoring Weight (B15)

**Default:** `0.7`

**What it affects:** Major code restructuring, architecture improvements

**Detection:** Commits with "refactor" keyword + large changes

**When to increase:**
- Technical debt paydown
- Pre-scaling cleanup
- Code quality initiatives

---

### Medium Refactoring Weight (B16)

**Default:** `0.3`

**What it affects:** Moderate code improvements, method extraction

**Detection:** Commits with improvement keywords + medium changes

---

### Low Refactoring Weight (B17)

**Default:** `0.1`

**What it affects:** Minor cleanup, formatting, small style fixes

**Detection:** Small commits with cleanup keywords

**Note:** Intentionally low to discourage trivial commits while still recognizing the work.

---

### Documentation Weight (B18)

**Default:** `0.3`

**What it affects:** README files, guides, code comments, documentation

**When to increase:**
- Open source projects
- API documentation needs
- Team onboarding focus
- Documentation-heavy courses

**When to decrease:**
- Internal tools with stable teams
- Rapid prototyping

---

### Support Code Weight (B19)

**Default:** `0.5`

**What it affects:** Build scripts, CI/CD, configs, Makefiles, utility scripts

**When to increase:**
- DevOps focus
- Complex build systems
- Infrastructure projects

**When to decrease:**
- Simple projects with standard builds

---

## Applying Weight Changes

After changing any weight:

1. **Don't re-fetch** - Your commit data is preserved
2. Run **GitHub Tracker → Recalculate Scores**
3. Summary sheet updates instantly with new calculations

This is much faster than re-fetching from GitHub!

---

## Advanced Configuration

### External Code Patterns (In Code)

The following patterns automatically exclude commits:

```javascript
/^add.*libcs\d+/i          // "Add libcs50 files"
/^add.*library.*files/i    // "Add library files"
/provided.*files/i         // "provided files"
/starter.*code/i           // "starter code"
/instructor.*provided/i    // "instructor provided"
/from\s+instructor/i       // "from instructor"
/^import.*libcs\d+/i       // "Import libcs50"
/cs50.*given/i             // "CS50 given files"
```

**To customize:** Edit the `externalCodePatterns` array in the script.

---

### Minimum Line Thresholds (In Code)

Current thresholds:
- **Code commits:** 10 lines minimum
- **Documentation commits:** 5 lines minimum

**To customize:** Search for threshold logic in `processCommitDetails()`.

---

### File Category Patterns (In Code)

Files are categorized by extension and path:

**Code:** `.py`, `.java`, `.js`, `.c`, `.cpp`, `.go`, `.rs`, etc.

**Tests:** Files with `test` in name, `_spec`, `_test`, `/tests/`, etc.

**Documentation:** `.md`, `.rst`, `.txt`, `/docs/`, `README*`

**Support/Config:** `.yml`, `.json`, `.toml`, `Makefile`, `.gitignore`, etc.

**Data:** `.csv`, `.json` (data files), `.sql`, etc.

**To customize:** Edit the `categorizeFile()` function.

---

## Example Configurations

### For CS Course (Focus on Learning)

```
Feature Creation:    3.0
Bug Fixing:          2.0
Testing:             1.0  ← Increased (learning TDD)
High Refactoring:    0.7
Medium Refactoring:  0.3
Low Refactoring:     0.1
Documentation:       0.5  ← Increased (code comments matter)
Support Code:        0.3
```

### For Startup MVP

```
Feature Creation:    4.0  ← Increased (ship features!)
Bug Fixing:          2.0
Testing:             0.3  ← Decreased (move fast)
High Refactoring:    0.3  ← Decreased (ship first)
Medium Refactoring:  0.1
Low Refactoring:     0.0
Documentation:       0.2  ← Decreased (minimal docs)
Support Code:        0.5
```

### For Mature Product

```
Feature Creation:    2.0  ← Decreased (stability matters more)
Bug Fixing:          3.0  ← Increased (quality focus)
Testing:             1.0  ← Increased (prevent regressions)
High Refactoring:    1.0  ← Increased (pay down tech debt)
Medium Refactoring:  0.5
Low Refactoring:     0.2
Documentation:       0.5
Support Code:        0.5
```

### For Open Source Library

```
Feature Creation:    2.5
Bug Fixing:          2.5
Testing:             1.0  ← Increased (reliability)
High Refactoring:    0.7
Medium Refactoring:  0.3
Low Refactoring:     0.1
Documentation:       1.0  ← Increased (community needs docs)
Support Code:        0.5
```

---

## Troubleshooting Configuration

### Weights Not Applying
- Make sure to run **Recalculate Scores** after changes
- Check that weight cells contain numbers, not text
- Verify you're editing the correct cells (B12-B19)

### Date Range Issues
- Format must be `YYYY-MM-DD` for Start Date
- Days Back must be a positive number
- If both set, Start Date takes precedence

### Token Issues
- Token must have `repo` scope
- Token must not be expired
- Copy entire token (starts with `ghp_`)

### Repo Not Found
- Check owner and repo name spelling
- Verify your token has access to the repo
- For private repos, ensure `repo` scope is enabled

---

## Resetting to Defaults

To reset all configuration:
1. Run **GitHub Tracker → 1. Setup Sheets**
2. This recreates the Config sheet with defaults
3. Re-enter your token and repo info
4. Re-run **Fetch Contributions**

Or manually reset weights to:
```
Feature Creation:    3.0
Bug Fixing:          2.0
Testing:             0.4
High Refactoring:    0.7
Medium Refactoring:  0.3
Low Refactoring:     0.1
Documentation:       0.3
Support Code:        0.5
```
