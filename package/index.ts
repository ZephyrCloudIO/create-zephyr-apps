#!/usr/bin/env node
import { setTimeout } from 'node:timers/promises';
import { exec } from 'node:child_process';
import {
  spinner,
  group,
  intro,
  outro,
  isCancel,
  password,
  cancel,
  text,
  note,
  confirm,
  select,
  multiselect,
  tasks,
  log,
  updateSettings,
} from '@clack/prompts';
import { cyan, underline, bgCyan, black, bgRed } from 'picocolors';
import { TEMPLATES } from './utils/constants';
import fs from 'node:fs/promises';
import create from './create/create';
import { CLIOptions } from './utils/types';

async function main() {
  console.clear();

  await setTimeout(1000);

  updateSettings({
    aliases: {
      w: 'up',
      s: 'down',
      a: 'left',
      d: 'right',
    },
  });

  note('npx create-zephyr-apps@latest');
  intro(`${bgCyan(black(' Create federated applications with Zephyr '))}`);

  const project = await group(
    {
      path: ({ results }) => {
        return text({
          message: 'Where should we create your project?',
          placeholder: './sparkling-solid',
          validate: value => {
            if (!value) return 'Please enter a path.';
            if (value[0] !== '.') return 'Please enter a relative path.';
          },
        });
      },

      type: () =>
        select({
          message: 'What type of project you are creating?',
          initialValue: 'web',
          options: [
            {
              value: 'web',
              label: 'Web',
            },
            {
              value: 'react-native',
              label: 'React Native',
              hint: 'You will be building React Native powered by Re.Pack.',
            },
          ],
        }),

      templates: ({ results }) => {

        if (results.type === 'web') {
          return select({
            message: 'Pick a template: ',
            initialValue: 'react-rspack-mf',
            maxItems: 5,
            options: Object.keys(TEMPLATES).map((template) => {
              return {
                value: template as keyof typeof TEMPLATES,
                label: cyan(TEMPLATES[template as keyof typeof TEMPLATES].label),
                hint: TEMPLATES[template as keyof typeof TEMPLATES].hint
              }
            })
          })
        }
      },
      install: async ({ results }) => {
        await create(results as CLIOptions)
        return confirm({
          message: 'Install dependencies?',
          initialValue: false,
        })
      },
    },
    {
      onCancel: () => {
        cancel('Operation cancelled.');
        process.exit(0);
      },
    },
  );



  if (project.install) {

    const s = spinner();
    try {
      s.start(`Installing...`);
      await exec(`cd ${project.path}`)
      await exec(`pnpm install`)

      s.stop('Installed via pnpm');

    } catch (error) {
      log.error(bgRed(black('Error:')))
      console.error(error)
      cancel('Operation cancelled.')
      process.exit(0)
    }
  }

  exec(`rm -rf .git`)

  const next_steps = `cd ${project.path}        \n${project.install ? '' : 'pnpm install\n'}git init\nCreate a new git repo and push your code to it\nnpm run build`;

  note(next_steps, 'Next steps.');

  const end_notes = [`Discord: ${underline(cyan('https://zephyr-cloud.io/discord'))}`,
  `Documentation: ${underline(cyan('https://zephyr-cloud.io/docs'))}`,
  `Open an issue: ${underline(cyan('https://github.com/ZephyrCloudIO/create-zephyr-apps/issues'))}`
  ]

  note(Object.values(end_notes).join('\n'), 'Problems?')

}

main().catch(console.error);

