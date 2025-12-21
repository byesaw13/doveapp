#!/usr/bin/env node

/**
 * Find Unused Code Script
 *
 * Analyzes the codebase to identify:
 * - Unused npm dependencies
 * - Unused exports and functions
 * - Unused React components
 * - Unused TypeScript types/interfaces
 * - Obsolete files
 * - Dead code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const results = {
  unusedDependencies: [],
  unusedComponents: [],
  unusedExports: [],
  unusedTypes: [],
  obsoleteFiles: [],
  suggestions: [],
};

// Directories to scan
const SCAN_DIRS = ['app', 'components', 'lib', 'types'];
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '__tests__',
];

function findAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_PATTERNS.some((pattern) => filePath.includes(pattern))) {
        findAllFiles(filePath, fileList);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function searchInFiles(searchTerm, files) {
  let count = 0;
  const matches = [];

  files.forEach((file) => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const regex = new RegExp(`\\b${searchTerm}\\b`, 'g');
      const fileMatches = content.match(regex);
      if (fileMatches) {
        count += fileMatches.length;
        matches.push(file);
      }
    } catch (err) {
      // Skip files that can't be read
    }
  });

  return { count, matches };
}

function analyzeUnusedDependencies() {
  console.log('\n🔍 Analyzing unused dependencies...');

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const allFiles = findAllFiles('.');
  const unused = [];

  Object.keys(dependencies).forEach((dep) => {
    // Skip certain packages that are always needed
    const skipPackages = [
      'next',
      'react',
      'react-dom',
      'typescript',
      'tailwindcss',
      'eslint',
      'prettier',
    ];

    if (skipPackages.includes(dep)) return;

    const { count, matches } = searchInFiles(dep, allFiles);

    if (count === 0) {
      unused.push({
        package: dep,
        version: dependencies[dep],
        usage: 'Not found in code',
      });
    } else if (
      count === 1 &&
      matches.length === 1 &&
      matches[0].includes('package.json')
    ) {
      unused.push({
        package: dep,
        version: dependencies[dep],
        usage: 'Only in package.json',
      });
    }
  });

  results.unusedDependencies = unused;

  if (unused.length > 0) {
    console.log(`  ⚠️  Found ${unused.length} potentially unused dependencies`);
  } else {
    console.log('  ✅ All dependencies appear to be in use');
  }
}

function analyzeUnusedComponents() {
  console.log('\n🔍 Analyzing unused React components...');

  const componentFiles = findAllFiles('components');
  const allFiles = findAllFiles('.');
  const unused = [];

  componentFiles.forEach((file) => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const fileName = path.basename(file, path.extname(file));

      // Skip certain files
      if (fileName === 'index' || fileName.startsWith('use-')) return;

      // Extract component names (export default or export function/const)
      const exportDefault = content.match(
        /export\s+default\s+(?:function\s+)?(\w+)/
      );
      const exportNamed = content.match(/export\s+(?:function|const)\s+(\w+)/g);

      const componentNames = [];
      if (exportDefault) componentNames.push(exportDefault[1]);
      if (exportNamed) {
        exportNamed.forEach((exp) => {
          const match = exp.match(/export\s+(?:function|const)\s+(\w+)/);
          if (match) componentNames.push(match[1]);
        });
      }

      componentNames.forEach((name) => {
        const { count, matches } = searchInFiles(name, allFiles);

        // If only found in its own file, it's likely unused
        if (count <= 2 && matches.length === 1 && matches[0] === file) {
          unused.push({
            component: name,
            file: file.replace(process.cwd() + '/', ''),
            references: count - 1, // Subtract the definition
          });
        }
      });
    } catch (err) {
      // Skip
    }
  });

  results.unusedComponents = unused;

  if (unused.length > 0) {
    console.log(`  ⚠️  Found ${unused.length} potentially unused components`);
  } else {
    console.log('  ✅ All components appear to be in use');
  }
}

function analyzeUnusedExports() {
  console.log('\n🔍 Analyzing unused exports from lib/...');

  const libFiles = findAllFiles('lib');
  const allFiles = findAllFiles('.');
  const unused = [];

  libFiles.forEach((file) => {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Find exported functions and constants
      const exports = content.match(
        /export\s+(?:async\s+)?(?:function|const)\s+(\w+)/g
      );

      if (!exports) return;

      exports.forEach((exp) => {
        const match = exp.match(
          /export\s+(?:async\s+)?(?:function|const)\s+(\w+)/
        );
        if (!match) return;

        const exportName = match[1];
        const { count, matches } = searchInFiles(exportName, allFiles);

        // If only found in its own file (definition), it's unused
        if (count <= 1 && matches.length === 1 && matches[0] === file) {
          unused.push({
            export: exportName,
            file: file.replace(process.cwd() + '/', ''),
            type: 'function/const',
          });
        }
      });
    } catch (err) {
      // Skip
    }
  });

  results.unusedExports = unused;

  if (unused.length > 0) {
    console.log(`  ⚠️  Found ${unused.length} potentially unused exports`);
  } else {
    console.log('  ✅ All exports appear to be in use');
  }
}

function analyzeUnusedTypes() {
  console.log('\n🔍 Analyzing unused TypeScript types/interfaces...');

  const typeFiles = findAllFiles('types');
  const allFiles = findAllFiles('.');
  const unused = [];

  typeFiles.forEach((file) => {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Find exported types and interfaces
      const types = content.match(/export\s+(?:interface|type)\s+(\w+)/g);

      if (!types) return;

      types.forEach((type) => {
        const match = type.match(/export\s+(?:interface|type)\s+(\w+)/);
        if (!match) return;

        const typeName = match[1];
        const { count, matches } = searchInFiles(typeName, allFiles);

        // If only found in its own file, it's unused
        if (count <= 1 && matches.length === 1 && matches[0] === file) {
          unused.push({
            type: typeName,
            file: file.replace(process.cwd() + '/', ''),
            kind: type.includes('interface') ? 'interface' : 'type',
          });
        }
      });
    } catch (err) {
      // Skip
    }
  });

  results.unusedTypes = unused;

  if (unused.length > 0) {
    console.log(
      `  ⚠️  Found ${unused.length} potentially unused types/interfaces`
    );
  } else {
    console.log('  ✅ All types appear to be in use');
  }
}

function analyzeObsoleteFiles() {
  console.log('\n🔍 Checking for obsolete files...');

  const obsoletePatterns = [
    { pattern: /\.test\.ts$/, exclude: '__tests__', type: 'Old test files' },
    { pattern: /\.spec\.ts$/, exclude: 'e2e', type: 'Old spec files' },
    { pattern: /\.bak$/, type: 'Backup files' },
    { pattern: /\.old$/, type: 'Old files' },
    { pattern: /\.tmp$/, type: 'Temp files' },
    { pattern: /-old\.(ts|tsx|js|jsx)$/, type: 'Old code files' },
    { pattern: /\.unused\.(ts|tsx|js|jsx)$/, type: 'Marked as unused' },
  ];

  const allFiles = findAllFiles('.');
  const obsolete = [];

  obsoletePatterns.forEach(({ pattern, exclude, type }) => {
    const matches = allFiles.filter((file) => {
      if (exclude && file.includes(exclude)) return false;
      return pattern.test(file);
    });

    if (matches.length > 0) {
      obsolete.push({
        type,
        count: matches.length,
        files: matches.map((f) => f.replace(process.cwd() + '/', '')),
      });
    }
  });

  // Check for markdown files that might be outdated
  const mdFiles = [
    'FIX_ESTIMATES_ERROR.md',
    'ISSUE_RESOLVED.md',
    'LOGIN_DEBUG_GUIDE.md',
    'TENANT_LOGIN_FIX.md',
    'SCHEMA_ISSUES_AND_FIXES.md',
  ];

  const outdatedDocs = [];
  mdFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      outdatedDocs.push(file);
    }
  });

  if (outdatedDocs.length > 0) {
    obsolete.push({
      type: 'Debug/Fix documentation (may be outdated)',
      count: outdatedDocs.length,
      files: outdatedDocs,
    });
  }

  results.obsoleteFiles = obsolete;

  if (obsolete.length > 0) {
    console.log(
      `  ⚠️  Found ${obsolete.length} categories of potentially obsolete files`
    );
  } else {
    console.log('  ✅ No obsolete files found');
  }
}

function generateSuggestions() {
  const suggestions = [];

  // Dependency suggestions
  if (results.unusedDependencies.length > 0) {
    const packages = results.unusedDependencies.map((d) => d.package).join(' ');
    suggestions.push({
      category: 'Dependencies',
      action: 'Remove unused packages',
      command: `npm uninstall ${packages}`,
      impact: 'Reduce bundle size and security surface',
    });
  }

  // Component suggestions
  if (results.unusedComponents.length > 0) {
    suggestions.push({
      category: 'Components',
      action: 'Review and remove unused components',
      impact: 'Reduce code complexity and maintenance burden',
      note: 'Verify these are truly unused before deleting',
    });
  }

  // Export suggestions
  if (results.unusedExports.length > 0) {
    suggestions.push({
      category: 'Exports',
      action: 'Remove unused exported functions',
      impact: 'Cleaner API surface and better tree-shaking',
      note: 'Consider making these internal if not needed elsewhere',
    });
  }

  // Type suggestions
  if (results.unusedTypes.length > 0) {
    suggestions.push({
      category: 'Types',
      action: 'Remove unused type definitions',
      impact: 'Reduce type complexity and improve compile times',
      note: 'Check if these types are imported but not used',
    });
  }

  // File suggestions
  if (results.obsoleteFiles.length > 0) {
    suggestions.push({
      category: 'Files',
      action: 'Archive or delete obsolete files',
      impact: 'Cleaner repository and reduced confusion',
      note: 'Consider moving to a /docs/archive folder instead of deleting',
    });
  }

  results.suggestions = suggestions;
}

function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 UNUSED CODE ANALYSIS REPORT');
  console.log('='.repeat(80));
  console.log(`Generated: ${new Date().toLocaleString()}\n`);

  // Summary
  const totalItems =
    results.unusedDependencies.length +
    results.unusedComponents.length +
    results.unusedExports.length +
    results.unusedTypes.length +
    results.obsoleteFiles.reduce((sum, cat) => sum + cat.count, 0);

  console.log('📈 SUMMARY:');
  console.log(`  📦 Unused Dependencies: ${results.unusedDependencies.length}`);
  console.log(`  🧩 Unused Components: ${results.unusedComponents.length}`);
  console.log(`  🔧 Unused Exports: ${results.unusedExports.length}`);
  console.log(`  📝 Unused Types: ${results.unusedTypes.length}`);
  console.log(
    `  🗑️  Obsolete Files: ${results.obsoleteFiles.reduce((sum, cat) => sum + cat.count, 0)}`
  );
  console.log(`  📊 Total Items: ${totalItems}\n`);

  // Unused Dependencies
  if (results.unusedDependencies.length > 0) {
    console.log('📦 UNUSED DEPENDENCIES:');
    results.unusedDependencies.forEach((dep) => {
      console.log(`  - ${dep.package}@${dep.version}`);
      console.log(`    Usage: ${dep.usage}`);
    });
    console.log('');
  }

  // Unused Components
  if (results.unusedComponents.length > 0) {
    console.log('🧩 UNUSED COMPONENTS:');
    results.unusedComponents.slice(0, 20).forEach((comp) => {
      console.log(`  - ${comp.component}`);
      console.log(`    File: ${comp.file}`);
      console.log(`    References: ${comp.references}`);
    });
    if (results.unusedComponents.length > 20) {
      console.log(`  ... and ${results.unusedComponents.length - 20} more`);
    }
    console.log('');
  }

  // Unused Exports
  if (results.unusedExports.length > 0) {
    console.log('🔧 UNUSED EXPORTS:');
    results.unusedExports.slice(0, 20).forEach((exp) => {
      console.log(`  - ${exp.export} (${exp.type})`);
      console.log(`    File: ${exp.file}`);
    });
    if (results.unusedExports.length > 20) {
      console.log(`  ... and ${results.unusedExports.length - 20} more`);
    }
    console.log('');
  }

  // Unused Types
  if (results.unusedTypes.length > 0) {
    console.log('📝 UNUSED TYPES:');
    results.unusedTypes.slice(0, 20).forEach((type) => {
      console.log(`  - ${type.type} (${type.kind})`);
      console.log(`    File: ${type.file}`);
    });
    if (results.unusedTypes.length > 20) {
      console.log(`  ... and ${results.unusedTypes.length - 20} more`);
    }
    console.log('');
  }

  // Obsolete Files
  if (results.obsoleteFiles.length > 0) {
    console.log('🗑️  OBSOLETE FILES:');
    results.obsoleteFiles.forEach((cat) => {
      console.log(`\n  ${cat.type} (${cat.count} files):`);
      cat.files.slice(0, 10).forEach((file) => {
        console.log(`    - ${file}`);
      });
      if (cat.files.length > 10) {
        console.log(`    ... and ${cat.files.length - 10} more`);
      }
    });
    console.log('');
  }

  // Suggestions
  if (results.suggestions.length > 0) {
    console.log('💡 CLEANUP SUGGESTIONS:\n');
    results.suggestions.forEach((sug, idx) => {
      console.log(`  ${idx + 1}. [${sug.category}] ${sug.action}`);
      console.log(`     Impact: ${sug.impact}`);
      if (sug.command) {
        console.log(`     Command: ${sug.command}`);
      }
      if (sug.note) {
        console.log(`     Note: ${sug.note}`);
      }
      console.log('');
    });
  }

  console.log('='.repeat(80));

  if (totalItems === 0) {
    console.log('✅ No unused code detected! Codebase is clean.\n');
  } else {
    console.log('⚠️  Review the items above and clean up as appropriate.\n');
    console.log(
      '💡 TIP: Always verify items are truly unused before deleting.'
    );
    console.log(
      '    Some items may be used dynamically or in ways not detected.\n'
    );
  }

  console.log('='.repeat(80));

  // Save detailed report to file
  const reportPath = 'unused-code-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}\n`);
}

function main() {
  console.log('🚀 Starting unused code analysis...');
  console.log('This may take a few minutes...\n');

  try {
    analyzeUnusedDependencies();
    analyzeUnusedComponents();
    analyzeUnusedExports();
    analyzeUnusedTypes();
    analyzeObsoleteFiles();
    generateSuggestions();
    generateReport();
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

main();
