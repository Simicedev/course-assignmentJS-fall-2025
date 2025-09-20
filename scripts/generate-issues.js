#!/usr/bin/env node

/**
 * Script to help generate GitHub issues for the project tasks
 * Run with: node scripts/generate-issues.js
 */

const tasks = [
  {
    title: "Set up testing framework with Vitest",
    labels: ["task", "testing", "good first issue"],
    body: `## Task Description
Set up Vitest testing framework for unit and integration tests as recommended in CONTRIBUTING.md.

## Context
Currently the project has no automated tests. Adding a testing framework will improve code quality and catch regressions.

## Acceptance Criteria
- [ ] Vitest installed and configured
- [ ] Sample test files created for existing functions
- [ ] Test scripts added to package.json
- [ ] CI pipeline updated to run tests
- [ ] Documentation updated with testing guidelines

## Definition of Done
- [ ] Code is written and tested
- [ ] Documentation is updated  
- [ ] Code review is completed
- [ ] Changes are merged`
  },
  {
    title: "Implement comprehensive error handling",
    labels: ["enhancement", "reliability"],
    body: `## Feature Description
Add comprehensive error handling throughout the application for better user experience and debugging.

## Problem Statement
Currently error handling is minimal, leading to poor user experience when things go wrong.

## Proposed Solution
- Client-side error boundaries
- Consistent error message formatting
- Network failure handling
- Server error response standardization

## Acceptance Criteria
- [ ] Error boundary component for React-like error catching
- [ ] Consistent error message display
- [ ] Network timeout and retry logic
- [ ] Proper HTTP error status handling
- [ ] User-friendly error messages

## Additional Context
Focus on authentication, posts, and profile features first.`
  },
  {
    title: "Security audit and improvements",
    labels: ["task", "security"],
    body: `## Task Description
Conduct security audit and implement necessary improvements for production readiness.

## Context
Security is critical for user data protection and application reliability.

## Acceptance Criteria
- [ ] Input validation and sanitization implemented
- [ ] Authentication token security reviewed
- [ ] CORS configuration audited
- [ ] Environment variable security checked
- [ ] XSS protection measures added
- [ ] SQL injection prevention (if applicable)

## Definition of Done
- [ ] Security checklist completed
- [ ] Vulnerabilities addressed
- [ ] Security best practices documented
- [ ] Code review completed`
  },
  {
    title: "Performance optimization and monitoring",
    labels: ["enhancement", "performance"],
    body: `## Feature Description
Optimize application performance and add monitoring capabilities.

## Problem Statement
Need to ensure the application performs well and identify performance bottlenecks.

## Proposed Solution
- Bundle size analysis and optimization
- Lazy loading for routes
- Image optimization
- Caching strategies
- Performance monitoring

## Acceptance Criteria
- [ ] Bundle size reduced by 20%
- [ ] Lazy loading implemented for routes
- [ ] Image optimization added
- [ ] Caching headers configured
- [ ] Performance metrics collected
- [ ] Core Web Vitals measured

## Additional Context
Focus on initial page load and navigation performance.`
  },
  {
    title: "API documentation with OpenAPI/Swagger",
    labels: ["docs", "api"],
    body: `## Task Description
Create comprehensive API documentation using OpenAPI/Swagger specification.

## Context
Good API documentation is essential for development and maintenance.

## Acceptance Criteria
- [ ] OpenAPI 3.0 specification created
- [ ] All endpoints documented
- [ ] Request/response schemas defined
- [ ] Authentication methods documented
- [ ] Interactive API explorer available
- [ ] Documentation integrated into project

## Definition of Done
- [ ] OpenAPI spec written
- [ ] Documentation generated and hosted
- [ ] Integration with development workflow
- [ ] Team review completed`
  },
  {
    title: "Accessibility improvements (WCAG compliance)",
    labels: ["enhancement", "accessibility", "good first issue"],
    body: `## Feature Description
Improve application accessibility to meet WCAG 2.1 guidelines.

## Problem Statement
The application needs to be accessible to users with disabilities.

## Proposed Solution
- Add ARIA labels and roles
- Implement keyboard navigation
- Ensure screen reader compatibility
- Meet color contrast requirements

## Acceptance Criteria
- [ ] ARIA labels added to interactive elements
- [ ] Keyboard navigation works for all features
- [ ] Screen reader compatibility tested
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus management implemented
- [ ] Alternative text for images

## Additional Context
Start with the authentication and main navigation flows.`
  },
  {
    title: "Enhanced UX with loading states and error feedback",
    labels: ["enhancement", "ux"],
    body: `## Feature Description
Improve user experience with better loading states, error messages, and form feedback.

## Problem Statement
Users currently don't get clear feedback about loading states or errors.

## Proposed Solution
- Loading skeletons and spinners
- Improved error messages
- Form validation feedback
- Success notifications

## Acceptance Criteria
- [ ] Loading states for all async operations
- [ ] Skeleton components for content loading
- [ ] Clear error messages with actionable advice
- [ ] Form validation with inline feedback
- [ ] Success/failure notifications
- [ ] Consistent UI patterns

## Additional Context
Focus on authentication flows and post creation/editing first.`
  }
];

console.log("GitHub Issues to Create:");
console.log("========================");

tasks.forEach((task, index) => {
  console.log(`\n${index + 1}. **${task.title}**`);
  console.log(`   Labels: ${task.labels.join(", ")}`);
  console.log(`   Priority: ${task.labels.includes("good first issue") ? "Good First Issue" : "Normal"}`);
});

console.log("\n\nTo create these issues:");
console.log("1. Go to https://github.com/Simicedev/course-assignmentJS-fall-2025/issues");
console.log("2. Click 'New issue'");
console.log("3. Use the appropriate template (Task/Enhancement)");
console.log("4. Copy the title and body content from this script");
console.log("5. Add the suggested labels");
console.log("6. Create the issue");

console.log("\n\nAfter creating issues:");
console.log("1. Set up GitHub Project board");
console.log("2. Add issues to the project");
console.log("3. Organize into Backlog/Ready columns");
console.log("4. Start working on 'good first issue' labeled tasks");

// Export tasks for potential automation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = tasks;
}