#!/bin/bash

# Funect Sales Pipeline - UI Components Installation Script
# This script installs all required shadcn/ui components

echo "🎨 Installing shadcn/ui components for Funect Sales Pipeline..."
echo ""

# Array of components to install
components=(
  "dialog"
  "dropdown-menu"
  "label"
  "select"
  "tabs"
  "tooltip"
  "avatar"
  "badge"
  "table"
  "textarea"
  "checkbox"
  "popover"
  "calendar"
  "command"
)

# Install each component
for component in "${components[@]}"
do
  echo "📦 Installing $component..."
  npx shadcn@latest add "$component" -y
done

echo ""
echo "✅ All UI components installed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Begin building features from BUILD_CHECKLIST.md"
echo "3. Create the dashboard layout first"
echo ""
