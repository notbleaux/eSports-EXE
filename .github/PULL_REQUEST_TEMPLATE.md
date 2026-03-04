# Pull Request

## Description
<!-- Describe your changes in detail -->

## Type of Change
<!-- Mark the relevant option with an [x] -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring
- [ ] Security fix

## Component
<!-- Mark the relevant component(s) with an [x] -->
- [ ] API (FastAPI)
- [ ] Web Frontend (React)
- [ ] Data Pipeline
- [ ] Game Simulation (Godot)
- [ ] Analytics
- [ ] Infrastructure/Deployment
- [ ] Documentation

## Checklist
<!-- Mark completed items with an [x] -->
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Data Partition Firewall
<!-- CRITICAL: For any changes to data handling -->
- [ ] I have verified no GAME_ONLY fields are exposed to the web API
- [ ] FantasyDataFilter.sanitizeForWeb() is used for all outgoing data
- [ ] No internal simulation data reaches public endpoints

## Testing
<!-- Describe the tests you ran -->
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing
- [ ] Determinism tests (for game changes)

## Deployment Notes
<!-- Any special deployment considerations -->

## Related Issues
<!-- Link to related issues using #issue_number -->
Closes #

## Screenshots (if applicable)

---

**Reviewer Notes:**
- @notbleaux (maintainer)
