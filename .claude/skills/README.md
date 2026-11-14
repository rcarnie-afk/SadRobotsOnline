# Agent skills

Instructions that AI coding agents (Claude Code and others) load when working in this repository.

## `phaser-*`: official Phaser skills

Phaser version: 4.2.1

Copied unchanged from the `skills/` folder of the `phaser` npm package, except that
each skill's name and folder are prefixed with `phaser-`. Written by Phaser Studio
and published under the MIT licence with Phaser (see `node_modules/phaser/LICENSE.md`).

After upgrading Phaser, refresh them with:

    npm install && bash tools/sync-phaser-skills.sh
