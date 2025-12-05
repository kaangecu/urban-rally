#!/bin/bash

# Development Setup Script
# This script deploys dev Firestore rules and adds test tasks

set -e  # Exit on error

echo "🚀 Urban Rally - Development Setup"
echo "=================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found!"
    echo "   Install it with: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI found"
echo ""

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Not logged in to Firebase. Logging in..."
    firebase login
else
    echo "✅ Already logged in to Firebase"
fi

echo ""
echo "📋 Current Firebase project:"
firebase use

echo ""
read -p "🔄 Deploy development Firestore rules? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Deploying development Firestore rules..."
    
    # Backup current rules
    echo "💾 Backing up current rules to firestore.backup.rules..."
    firebase firestore:rules get > firestore.backup.rules 2>/dev/null || true
    
    # Deploy dev rules
    cp firestore.dev.rules firestore.rules
    firebase deploy --only firestore:rules
    
    echo "✅ Development rules deployed!"
else
    echo "⏭️  Skipped Firestore rules deployment"
fi

echo ""
read -p "📝 Add test tasks to Firestore? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Adding test tasks..."
    npm run add-tasks
    echo "✅ Test tasks added!"
else
    echo "⏭️  Skipped adding test tasks"
fi

echo ""
echo "✨ Development setup complete!"
echo ""
echo "📌 Next steps:"
echo "   1. Run: npm run dev"
echo "   2. Test quiz submissions"
echo "   3. Test photo submissions"
echo ""
echo "⚠️  Remember: Development rules are PERMISSIVE"
echo "   Deploy production rules before going live!"
