#!/usr/bin/env node
import { mkdir, readdir, cp, symlink, rm, lstat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_SRC = join(__dirname, 'skills');
const TEMPLATES_SRC = join(__dirname, 'templates');

const HELP = `
research-workflow — 協調型 AI エージェントで進める研究ワークフロー

使用方法:
  npx research-workflow init                    .opencode/skills/ にインストール（OpenCode）
  npx research-workflow init --omp              .agents/skills/ にインストール（OMP / Pi 共用）
  npx research-workflow init --pi               --omp と同じ（Pi 用エイリアス）
  npx research-workflow init --claude           .claude/skills/ にインストール（Claude Code）
  npx research-workflow init --global           ~/.config/opencode/skills/ にインストール
  npx research-workflow init --omp --global     ~/.agents/skills/ にインストール（OMP / Pi 全ユーザー）
  npx research-workflow init --claude --global  ~/.claude/skills/ にインストール
  npx research-workflow help                    このヘルプを表示

オプション:
  --omp      OMP (Oh My Pi) 用にインストール（.agents/skills/）
  --pi       Pi (badlogic/pi) 用エイリアス（--omp と同じ .agents/skills/）
  --claude   Claude Code 用にインストール（.claude/skills/）
  --symlink  コピーではなくシンボリックリンクを作成
  --force    既存のファイルを上書き（旧リンクを削除して再作成）

例:
  npx research-workflow init
  npx research-workflow init --omp --symlink
  npx research-workflow init --pi --symlink --force
`.trim();

async function pathExists(p) {
  try {
    await lstat(p);
    return true;
  } catch {
    return false;
  }
}

async function targetDir(mode, target) {
  const home = process.env.HOME;
  if (mode === 'global') {
    if (target === 'agents') return join(home, '.agents', 'skills');
    if (target === 'claude') return join(home, '.claude', 'skills');
    return join(home, '.config', 'opencode', 'skills');
  }
  const cwd = process.cwd();
  if (target === 'agents') {
    const dir = join(cwd, '.agents');
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    return join(dir, 'skills');
  }
  if (target === 'claude') {
    const dir = join(cwd, '.claude');
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    return join(dir, 'skills');
  }
  const dir = join(cwd, '.opencode');
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  return join(dir, 'skills');
}

async function copyDirContents(src, dest, useSymlink, force) {
  if (!existsSync(src)) return 0;
  let count = 0;
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    const exists = await pathExists(d);
    if (exists && !force) {
      console.log(`  skip  ${entry.name} (use --force to overwrite)`);
      continue;
    }
    if (exists) {
      await rm(d, { recursive: true, force: true });
    }
    if (useSymlink) {
      await symlink(s, d, entry.isDirectory() ? 'dir' : 'file');
      console.log(`  link  ${entry.name}`);
    } else {
      await cp(s, d, { recursive: true, force: true });
      console.log(`  copy  ${entry.name}`);
    }
    count++;
  }
  return count;
}

async function cmdInit(flags) {
  const mode = flags.includes('--global') ? 'global' : 'project';
  const isOmp = flags.includes('--omp');
  const isPi = flags.includes('--pi');
  const isClaude = flags.includes('--claude');
  const useSymlink = flags.includes('--symlink');
  const force = flags.includes('--force');

  const target = isClaude ? 'claude' : isOmp || isPi ? 'agents' : 'opencode';

  if (!existsSync(SKILLS_SRC)) {
    console.error(`error: skills/ not found at ${SKILLS_SRC}`);
    process.exit(1);
  }

  // 1. Install SKILL.md files
  const skillsTarget = await targetDir(mode, target);
  if (!existsSync(skillsTarget)) {
    await mkdir(skillsTarget, { recursive: true });
  }
  const skillCount = await copyDirContents(SKILLS_SRC, skillsTarget, useSymlink, force);

  const locationMap = {
    agents: mode === 'global' ? '~/.agents/skills/' : '.agents/skills/',
    claude: mode === 'global' ? '~/.claude/skills/' : '.claude/skills/',
    opencode: mode === 'global' ? '~/.config/opencode/skills/' : '.opencode/skills/',
  };
  console.log(`\n${skillCount} skill(s) installed to ${locationMap[target]}`);

  // 2. Install templates extras for OMP
  if (isOmp && mode === 'project') {
    const agentsTarget = join(process.cwd(), '.omp', 'agents');
    if (!existsSync(agentsTarget)) {
      await mkdir(agentsTarget, { recursive: true });
    }
    const agentSrc = join(TEMPLATES_SRC, 'agents');
    const agentCount = await copyDirContents(agentSrc, agentsTarget, useSymlink, force);
    console.log(`${agentCount} agent definition(s) installed to .omp/agents/`);
  }

  console.log('Done.');
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'help';
  const flags = args.slice(1);

  switch (cmd) {
    case 'init':
      await cmdInit(flags);
      break;
    case 'help':
    case '--help':
    case '-h':
      console.log(HELP);
      break;
    default:
      console.error(`unknown command: ${cmd}\n`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('error:', err.message);
  process.exit(1);
});
