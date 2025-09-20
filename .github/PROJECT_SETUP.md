# GitHub Project Board Setup Guide

This guide helps you set up the kanban board for the course assignment project.

## Quick Setup Steps

### 1. Create GitHub Project Board
1. Go to your repository on GitHub
2. Click on the "Projects" tab
3. Click "Link a project" or "New project"
4. Choose "Board" template
5. Name it "Course Assignment Development"

### 2. Configure Columns
Create these columns in order:
- **Backlog** - Ideas and future tasks
- **Ready** - Tasks ready to be worked on
- **In Progress** - Currently being developed
- **Review** - Pull requests open
- **Done** - Completed and merged

### 3. Set Up Automation (Optional)
- When issues are added to project → Move to Backlog
- When PR is opened → Move linked issues to Review
- When PR is merged → Move linked issues to Done

### 4. Add Initial Issues
Use the issue templates to create issues for tasks from TASKS.md:

#### High Priority Issues to Create:
1. **Testing Framework Setup** (Task)
2. **Error Handling Improvements** (Enhancement)
3. **Security Audit** (Task)
4. **Performance Optimization** (Enhancement)
5. **API Documentation** (Documentation)
6. **Accessibility Improvements** (Enhancement)

#### Example Issue Creation:
```
Title: Set up testing framework with Vitest
Label: task, testing
Description: Set up Vitest testing framework for unit and integration tests
Acceptance Criteria:
- [ ] Vitest installed and configured
- [ ] Sample test files created
- [ ] Test scripts added to package.json
- [ ] CI pipeline updated to run tests
```

## Managing the Board

### For Team Members:
1. **Pick work from Ready column** - only take tasks that are well-defined
2. **Move to In Progress** when starting work
3. **Update progress** regularly with comments
4. **Move to Review** when PR is opened
5. **Close issue** when work is complete and merged

### For Project Maintainers:
1. **Groom Backlog** regularly - move items to Ready when defined
2. **Review In Progress** items for blockers
3. **Monitor Review** column for stale PRs
4. **Archive Done** items periodically

## Board Health Metrics

### Good Signs:
- Items flow smoothly through columns
- Ready column has 3-5 well-defined tasks
- In Progress limited to team capacity
- Review column moves quickly
- Regular movement to Done

### Warning Signs:
- Tasks stuck in In Progress too long
- Empty Ready column
- Overflowing Review column
- No movement to Done

## Integration with Development Workflow

### Branch Naming:
```
feat/issue-number-short-description
fix/issue-number-short-description
docs/issue-number-short-description
```

### Commit Messages:
```
feat(auth): add login form validation (closes #12)
fix(posts): handle empty response (closes #15)
docs(api): add endpoint documentation (closes #18)
```

### Pull Request Template:
```
## Description
Brief description of changes

## Related Issue
Closes #[issue-number]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tests pass locally
- [ ] New tests added (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

## Tips for Success

1. **Keep tasks small** - aim for tasks that take 1-3 days
2. **Write clear acceptance criteria** - makes review easier
3. **Use labels consistently** - helps with filtering and reporting
4. **Regular grooming** - spend 30 minutes weekly organizing the board
5. **Celebrate progress** - acknowledge completed work

---

*This setup ensures your team has clear visibility into what's been done and what's in progress.*