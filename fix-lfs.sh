#!/bin/bash

echo "Removing text files from Git LFS..."

# Remove all JS, JSON, CSS, HTML, MD, and TXT files from LFS
git lfs untrack "*.js"
git lfs untrack "*.json"
git lfs untrack "*.css"
git lfs untrack "*.html"
git lfs untrack "*.MD"
git lfs untrack "*.txt"

# Remove cached versions of all text files
git rm --cached -r .
git add .gitattributes

# Re-add all files (this will add text files normally, not as LFS)
git add .

echo "Fixed! Text files are no longer tracked by Git LFS"
