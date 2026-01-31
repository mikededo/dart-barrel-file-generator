#!/usr/bin/env bun

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';

// eslint-disable-next-line node/prefer-global/process
const args = process.argv.slice(2);
const isCi = args.includes('--ci');

const logPrefix = pc.bgBlueBright(pc.black(' INFO '));
const okPrefix = pc.bgGreen(pc.black(' OK '));

// eslint-disable-next-line node/prefer-global/process
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

console.log(
  `${logPrefix} Found name: ${pc.green(packageJson.name)}, temporarily renaming to: ${pc.green('dart-barrel-file-generator')}\n`
);

const tempName = packageJson.name;
packageJson.name = 'dart-barrel-file-generator';
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log(`${logPrefix} Packaging extension...\n`);
execSync(
  `bun vsce package --no-dependencies --skip-license${isCi ? ' --out ./extension.vsix' : ''}`,
  { stdio: 'inherit' }
);

console.log(`\n${logPrefix} Restoring ${pc.green('package.json')} name to ${pc.green(tempName)}...`);
packageJson.name = tempName;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log(`${okPrefix} Done!`);
