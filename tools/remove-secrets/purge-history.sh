#!/bin/bash

# ============================================================================
# Git History Secret Purge Script
# ============================================================================
# This script removes leaked API keys from git history using git-filter-repo.
# 
# ⚠️ WARNING: This script rewrites git history and requires force push!
# All collaborators will need to re-clone the repository after running this.
#
# Usage:
#   ./tools/remove-secrets/purge-history.sh
#
# Prerequisites:
#   - git-filter-repo (install via: pip install git-filter-repo)
#   - Backup of your repository (script creates one automatically)
#   - All team members informed about history rewrite
#
# What this script does:
#   1. Creates a backup mirror of your repository
#   2. Runs git-filter-repo with replace.txt to remove secrets
#   3. Prompts for confirmation before force-pushing
#   4. Optionally pushes the cleaned history
#
# After running this script:
#   - All API keys in replace.txt will be replaced with markers
#   - Git history will be rewritten (commits will have different SHAs)
#   - All collaborators must re-clone the repository
#   - Update any open PRs or local branches
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPLACE_FILE="$SCRIPT_DIR/replace.txt"
BACKUP_DIR="$HOME/git-backup-$(date +%Y%m%d-%H%M%S)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Function to print colored messages
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if git-filter-repo is installed
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    if ! command -v git-filter-repo &> /dev/null; then
        print_error "git-filter-repo is not installed."
        echo ""
        echo "Install it using one of the following methods:"
        echo "  - pip install git-filter-repo"
        echo "  - brew install git-filter-repo (macOS)"
        echo "  - apt install git-filter-repo (Debian/Ubuntu)"
        echo ""
        exit 1
    fi
    
    print_success "git-filter-repo is installed"
    
    if [ ! -f "$REPLACE_FILE" ]; then
        print_error "Replace file not found: $REPLACE_FILE"
        exit 1
    fi
    
    print_success "Replace file found: $REPLACE_FILE"
}

# Function to create backup
create_backup() {
    print_header "Creating Backup"
    
    print_info "Creating mirror backup at: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    
    cd "$REPO_ROOT"
    git clone --mirror . "$BACKUP_DIR"
    
    print_success "Backup created successfully!"
    print_info "Backup location: $BACKUP_DIR"
}

# Function to display what will be replaced
show_replacements() {
    print_header "Secrets to be Removed"
    
    echo "The following secrets will be replaced in git history:"
    echo ""
    
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ $line =~ ^#.*$ ]] || [[ -z $line ]]; then
            continue
        fi
        
        # Extract old and new values
        if [[ $line =~ literal:(.+)==\>(.+)$ ]]; then
            old_value="${BASH_REMATCH[1]}"
            new_value="${BASH_REMATCH[2]}"
            
            # Mask the secret (show first 10 and last 4 characters)
            masked="${old_value:0:10}...${old_value: -4}"
            echo "  • $masked => $new_value"
        fi
    done < "$REPLACE_FILE"
    
    echo ""
}

# Function to confirm action
confirm_action() {
    print_header "⚠️  FINAL WARNING ⚠️"
    
    print_warning "This operation will:"
    echo "  1. Rewrite ALL git history"
    echo "  2. Change ALL commit SHAs"
    echo "  3. Require force push to remote"
    echo "  4. Require all collaborators to re-clone the repo"
    echo ""
    
    print_warning "Before proceeding, ensure:"
    echo "  ✓ You have informed all team members"
    echo "  ✓ All work is committed or backed up"
    echo "  ✓ You have revoked the exposed API keys"
    echo "  ✓ You have generated new API keys"
    echo ""
    
    read -p "Do you want to proceed? (yes/no): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        print_info "Operation cancelled by user."
        exit 0
    fi
}

# Function to run git-filter-repo
run_filter_repo() {
    print_header "Running git-filter-repo"
    
    cd "$REPO_ROOT"
    
    print_info "Filtering repository history..."
    git filter-repo --replace-text "$REPLACE_FILE" --force
    
    print_success "History rewritten successfully!"
}

# Function to push changes
push_changes() {
    print_header "Pushing Changes"
    
    print_warning "The cleaned history needs to be force-pushed to the remote."
    echo ""
    read -p "Do you want to force-push to origin now? (yes/no): " push_confirmation
    
    if [ "$push_confirmation" = "yes" ]; then
        cd "$REPO_ROOT"
        
        # Add back the origin remote (git-filter-repo removes it)
        print_info "Adding remote origin..."
        git remote add origin $(git config --get remote.origin.url 2>/dev/null || echo "PLEASE_SET_ORIGIN_URL")
        
        print_info "Force pushing to origin..."
        git push --force --all origin
        git push --force --tags origin
        
        print_success "Changes pushed successfully!"
    else
        print_info "Skipping push. You can manually push later with:"
        echo "  git remote add origin <your-repo-url>"
        echo "  git push --force --all origin"
        echo "  git push --force --tags origin"
    fi
}

# Function to display next steps
show_next_steps() {
    print_header "Next Steps"
    
    echo "✅ Git history has been cleaned!"
    echo ""
    echo "Important next steps:"
    echo ""
    echo "1. Verify the changes:"
    echo "   git log --all --oneline"
    echo ""
    echo "2. Notify all team members to:"
    echo "   - Delete their local clone"
    echo "   - Re-clone the repository"
    echo "   - Avoid pushing old branches"
    echo ""
    echo "3. Update any open pull requests"
    echo ""
    echo "4. Verify secrets are removed:"
    echo "   git log --all -p -S 'AIzaSy'"
    echo ""
    echo "5. Monitor for unauthorized API key usage"
    echo ""
    echo "Backup location: $BACKUP_DIR"
    echo ""
}

# Main execution
main() {
    print_header "Git History Secret Purge Script"
    
    check_prerequisites
    show_replacements
    confirm_action
    create_backup
    run_filter_repo
    push_changes
    show_next_steps
    
    print_success "Script completed successfully!"
}

# Run main function
main
