# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2024-11-24

### Added
- Initial release of GitHub Contribution Tracker
- **Smart Work Type Categorization**
  - 8 work types: Feature Creation, Bug Fixing, Testing, High/Medium/Low Refactoring, Documentation, Support Code
  - Automatic categorization based on commit messages, file types, and change patterns
  - Customizable weights for each work type

- **Visualization**
  - 6-color stacked column chart showing work type distribution
  - Descriptive legend with work types and weights
  - Per-contributor breakdown tables

- **Gaming Prevention**
  - Minimum line thresholds (10 for code, 5 for docs)
  - Merge commit exclusion
  - External/starter code detection and filtering
  - Net change tracking (additions - deletions)

- **Comprehensive Tracking**
  - Commit analysis with file-level detail
  - PR creation and merge tracking
  - Code review and comment tracking
  - Issue creation and comment tracking
  - Co-author recognition from commit messages

- **User-Friendly Features**
  - One-click setup (Setup Sheets)
  - Auto-fill username from GitHub token
  - Repository browser and selector
  - Instant score recalculation (no re-fetch needed)
  - Configurable date range

- **Documentation**
  - Complete README with quick start guide
  - Detailed setup guide
  - User guide with feature explanations
  - Fairness & equity documentation
  - Configuration reference
  - FAQ

### Technical Details
- Built on Google Apps Script
- Uses GitHub REST API v3
- Runs entirely in Google Sheets (no external servers)
- MIT licensed

---

## Future Roadmap

### Planned Features
- [ ] Multi-repository aggregation
- [ ] Time-series analysis (trends over time)
- [ ] Team comparison views
- [ ] Export to PDF/HTML reports
- [ ] GitLab support
- [ ] Configurable file patterns in UI
- [ ] Configurable external code patterns in UI

### Under Consideration
- Code complexity metrics integration
- Integration with CI/CD data
- Slack/Discord notifications
- Automated periodic reports

---

## How to Update

When upgrading from a previous version:

1. Open your existing spreadsheet
2. Go to **Extensions → Apps Script**
3. Replace all code with the new version
4. Save
5. Refresh your spreadsheet

Your data and configuration are preserved in the spreadsheet itself.

---

## Reporting Issues

Found a bug or have a feature request?

- Check existing [Issues](../../issues)
- Open a new issue with details
- Include steps to reproduce for bugs
