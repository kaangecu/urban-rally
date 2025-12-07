#!/bin/bash

# Testing Setup Script for Urban Rally
# This script installs all necessary testing dependencies

set -e  # Exit on error

echo "============================================"
echo "Urban Rally - Testing Setup"
echo "============================================"
echo ""

echo "📦 Installing testing dependencies..."
echo ""

# Core testing framework
echo "1/5 Installing Vitest and core testing libraries..."
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8

# React Testing Library
echo "2/5 Installing React Testing Library..."
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Firebase testing
echo "3/5 Installing Firebase testing tools..."
npm install --save-dev @firebase/rules-unit-testing

# E2E testing (Playwright)
echo "4/5 Installing Playwright for E2E tests..."
npm install --save-dev @playwright/test

# Additional utilities
echo "5/5 Installing testing utilities..."
npm install --save-dev @faker-js/faker msw

echo ""
echo "✅ All testing dependencies installed!"
echo ""

# Install Playwright browsers
echo "📥 Installing Playwright browsers..."
npx playwright install

echo ""
echo "============================================"
echo "✅ Testing Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Run 'npm test' to start test runner in watch mode"
echo "  2. Run 'npm run test:coverage' to see coverage report"
echo "  3. Run 'npm run test:ui' for interactive test UI"
echo "  4. Run 'npm run test:e2e' for E2E tests"
echo ""
echo "📚 See docs/TESTING_STRATEGY.md for full documentation"
echo ""
