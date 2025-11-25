# Push Story to Git

This command pushes the current story changes to Git repository.

## Usage

When a story is completed, this command will:
1. Check git status
2. Stage all changes
3. Create a commit with story information
4. Push to remote repository

## Example

After completing a story, run this command to push changes:

```
/push-story
```

Or use the dev agent menu item: `*push-changes`

## Commit Message Format

Commits follow the pattern:
```
feat: [story-key] story-title - Story completed
```

## Notes

- This command is automatically executed when using `*story-done` workflow
- Railway will automatically deploy changes on next push to main/master branch
- If migration files are present, Railway will run them automatically via postbuild.sh

