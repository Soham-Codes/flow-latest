# Secret Removal Tools

This directory contains tools to help remove leaked secrets from git history.

## ⚠️ Important Notice

If API keys have been leaked in your git history, they should be considered **compromised** even after removal from history. You must:

1. **Immediately revoke** the exposed keys
2. **Generate new keys** and configure them properly
3. **Run the purge script** to clean git history
4. **Force push** the cleaned history
5. **Monitor** for unauthorized usage of the old keys

## Files

- **`replace.txt`**: Contains the mapping of exposed secrets to replacement markers
- **`purge-history.sh`**: Script to safely purge secrets from git history

## The Two Leaked Keys

According to the security scan, the following Gemini API keys were found in git history:
- `AIzaSyATr0wA5k99oWYUL0Ifu6BDZiEMS0plMOw`
- `AIzaSyCRGNQgexiMHTn3LNHn2OJGd574aqU_Dik`

Both keys are mapped in `replace.txt` and will be replaced with markers when the purge script runs.

## Usage

### Prerequisites

Install `git-filter-repo`:

```bash
# Using pip
pip install git-filter-repo

# Using homebrew (macOS)
brew install git-filter-repo

# Using apt (Debian/Ubuntu)
sudo apt install git-filter-repo
```

### Running the Purge Script

**Important**: This operation rewrites git history and requires a force push. All collaborators will need to re-clone the repository.

```bash
# Make sure you're in the repository root
cd /path/to/flow-latest

# Run the purge script
./tools/remove-secrets/purge-history.sh
```

The script will:
1. ✅ Check prerequisites (git-filter-repo installed)
2. ✅ Show what secrets will be removed
3. ✅ Create a backup mirror of your repository
4. ✅ Run git-filter-repo to rewrite history
5. ✅ Optionally force-push the cleaned history

### After Running the Script

1. **Notify all team members** that history has been rewritten
2. **All collaborators must**:
   - Delete their local repository clone
   - Re-clone from the remote
   - Recreate any local branches from the new history
3. **Update any open PRs** - they will need to be recreated
4. **Verify secrets are gone**:
   ```bash
   git log --all -p -S 'AIzaSy'
   ```
   This should return no results.

### Backup Location

The script automatically creates a backup mirror at:
```
~/git-backup-<timestamp>/
```

Keep this backup until you're certain the cleaned history is stable and all team members have updated their local copies.

## Customizing Secret Replacement

Edit `replace.txt` to add more secrets to remove. Format:

```
literal:SECRET_VALUE==>REPLACEMENT_MARKER
```

Example:
```
literal:sk-1234567890abcdef==>OPENAI_KEY_REMOVED
literal:ghp_abc123xyz789==>GITHUB_TOKEN_REMOVED
```

## Security Best Practices

After cleaning the history:

1. ✅ **Rotate all exposed keys** immediately
2. ✅ **Enable secret scanning** on GitHub (in repository settings)
3. ✅ **Set up pre-commit hooks** to prevent future leaks
4. ✅ **Use environment variables** for all secrets
5. ✅ **Never commit `.env.local`** files
6. ✅ **Review `.gitignore`** to ensure sensitive files are excluded
7. ✅ **Enable branch protection** on main/master branches
8. ✅ **Require PR reviews** before merging

## Troubleshooting

### git-filter-repo not found
Install it using pip: `pip install git-filter-repo`

### "Not a Git repository" error
Make sure you run the script from within your git repository.

### Remote rejected (force push)
You may need to temporarily disable branch protection rules in GitHub repository settings.

### Backup location full
Free up disk space or specify a different backup location by editing the script.

## Additional Resources

- [git-filter-repo documentation](https://github.com/newren/git-filter-repo)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [detect-secrets documentation](https://github.com/Yelp/detect-secrets)
