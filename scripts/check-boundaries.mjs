#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function scanDirectory(dir, violations = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (
      stat.isDirectory() &&
      !item.startsWith('.') &&
      item !== 'node_modules'
    ) {
      scanDirectory(fullPath, violations);
    } else if (
      stat.isFile() &&
      (item.endsWith('.ts') ||
        item.endsWith('.tsx') ||
        item.endsWith('.js') ||
        item.endsWith('.jsx'))
    ) {
      checkFile(fullPath, violations);
    }
  }

  return violations;
}

function checkFile(filePath, violations) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const isServerOnly = content.includes('import "server-only"');
  const hasUseClient =
    content.includes('"use client"') || content.includes("'use client'");
  const isInLib = filePath.includes('/lib/');
  const isInApp = filePath.includes('/app/');

  const clientModules = [
    '@/lib/supabase/browser',
    '@/lib/supabase/client',
    '@/lib/supabase.ts',
    '@/lib/auth/context.ts',
  ];

  // Check for server-only files mixing with client
  if (isServerOnly) {
    if (hasUseClient) {
      violations.push({
        file: filePath,
        line: 1,
        message: 'Server-only file also has "use client" directive',
        offendingLine: 'import "server-only"; and "use client";',
      });
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        line.includes('createBrowserClient') ||
        clientModules.some((module) => line.includes(`from '${module}'`))
      ) {
        violations.push({
          file: filePath,
          line: i + 1,
          message: 'Server-only file imports browser Supabase client',
          offendingLine: line.trim(),
        });
      }
    }
  }

  // Check for lib files (not client-only) using browser clients
  if (isInLib && !hasUseClient) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        line.includes('createBrowserClient') ||
        (line.includes("from '@supabase/ssr'") &&
          line.includes('createBrowserClient'))
      ) {
        violations.push({
          file: filePath,
          line: i + 1,
          message: 'Server-side lib file uses browser Supabase client',
          offendingLine: line.trim(),
        });
      }
    }
  }

  // Check for app server components importing client-only modules
  if (isInApp && !hasUseClient) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (clientModules.some((module) => line.includes(`from '${module}'`))) {
        violations.push({
          file: filePath,
          line: i + 1,
          message: 'Server Component imports client-only Supabase module',
          offendingLine: line.trim(),
        });
      }
    }
  }
}

function main() {
  const violations = [];
  scanDirectory(path.join(__dirname, '..', 'lib'), violations);
  scanDirectory(path.join(__dirname, '..', 'app'), violations);

  if (violations.length > 0) {
    console.error('❌ Boundary violations found:');
    violations.forEach((v) => {
      console.error(`  ${v.file}:${v.line} - ${v.message}`);
      console.error(`    ${v.offendingLine}`);
    });
    process.exit(1);
  } else {
    console.log('✅ No boundary violations found.');
  }
}

main();
