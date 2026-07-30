#!/usr/bin/env node
import { mkdir, readdir, cp, symlink, access, constants } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';


const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_SRC = join(__dirname, 'skills');

const HELP = `
research-workflow — 協調型 AI エージェントで進める研究ワークフロー

使用方法:
  npx research-workflow init        現在のディレクトリの .opencode/skills/ にインストール
  npx research-workflow init --global  ~/.config/opencode/skills/ にグローバルインストール
  npx research-workflow help         このヘルプを表示

オプション:
  --symlink  コピーではなくシンボリックリンクを作成
  --force    既存のファイルを上書き

例:
  npx research-workflow init
  npx research-workflow init --global --symlink
`.trim();

async function targetDir(mode) {
  if (mode === 'global') {
    return join(process.env.HOME, '.config', 'opencode', 'skills');
  }
  const cwd = process.cwd();
  const dotOencode = join(cwd, '.opencode');
  if (!existsSync(dotOencode)) {
    await mkdir(dotOencode, { recursive: true });
  }
  return join(dotOencode, 'skills');
}

async function cmdInit(flags) {
  const mode = flags.includes('--global') ? 'global' : 'project';
  const useSymlink = flags.includes('--symlink');
  const force = flags.includes('--force');
  const target = await targetDir(mode);

  if (!existsSync(SKILLS_SRC)) {
    console.error(`error: skills/ not found at ${SKILLS_SRC}`);
    process.exit(1);
  }

  if (!existsSync(target)) {
    await mkdir(target, { recursive: true });
  }

  const entries = await readdir(SKILLS_SRC, { withFileTypes: true });
  let copied = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const src = join(SKILLS_SRC, entry.name);
    const dest = join(target, entry.name);
    const destExists = existsSync(dest);

    if (destExists && !force) {
      const existingSkill = join(dest, 'SKILL.md');
      if (existsSync(existingSkill)) {
        console.log(`  skip  ${entry.name} (already exists, use --force to overwrite)`);
        skipped++;
        continue;
      }
    }

    if (destExists) {
      await cp(dest, `${dest}.bak`, { recursive: true, force: true });
    }

    if (useSymlink) {
      await symlink(src, dest, 'dir');
      console.log(`  link  ${entry.name}`);
    } else {
      await cp(src, dest, { recursive: true, force: true });
      console.log(`  copy  ${entry.name}`);
    }
    copied++;
  }

  const location = mode === 'global' ? '~/.config/opencode/skills/' : '.opencode/skills/';
  console.log(`\n${copied} skill(s) installed to ${location}`);
  if (skipped > 0) {
    console.log(`${skipped} skill(s) skipped (use --force to overwrite)`);
  }
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
