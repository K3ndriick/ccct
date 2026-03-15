import type { Project } from '../types';

export const projects: Project[] = [
  {
    name: "my-project",
    conversations: [
      {
        id: "ID12345",
        projectName: "my-project",
        projectSlug: "read-repo-id12345",
        projectDate: "02-02-2026",
        messages: [
          {
            role: 'user',
            text: "can you read through this repo and give me a summary?"
          },
          {
            role: 'assistant',
            text: "Sure, let me read through the main files.",
            thinkingBlocks: [
              { text: "The user wants me to read the repo. Let me start with the main files and work outward." }
            ],
            toolCalls: [
              {
                type: 'read',
                filePath: 'src/main.ts',
                result: { status: 'success', result: 'File read successfully' }
              },
              {
                type: 'read',
                filePath: 'src/missing.ts',
                result: { status: 'error', result: 'Unable to read file: file not found' }
              },
            ]
          }
        ]
      },
      {
        id: "ID67890",
        projectName: "my-project",
        projectSlug: "refactor-utils-id67890",
        projectDate: "03-02-2026",
        messages: [
          {
            role: 'user',
            text: "refactor the utils file and update the imports"
          },
          {
            role: 'assistant',
            text: "I'll refactor the utils file and update all affected imports.",
            thinkingBlocks: [],
            toolCalls: [
              {
                type: 'glob',
                pattern: 'src/**/*.ts',
                result: { status: 'success', result: 'Found 12 files' }
              },
              {
                type: 'edit',
                filePath: 'src/utils.ts',
                diff: `-export function formatDate(d: Date) {\n-  return d.toString()\n+export function formatDate(d: Date): string {\n+  return d.toISOString().split('T')[0]`,
                result: { status: 'success', result: 'File edited successfully' }
              },
              {
                type: 'write',
                filePath: 'src/utils/index.ts',
                result: { status: 'success', result: 'File written successfully' }
              },
            ]
          }
        ]
      },
      {
        id: "ID11111",
        projectName: "my-project",
        projectSlug: "run-tests-id11111",
        projectDate: "05-02-2026",
        messages: [
          {
            role: 'user',
            text: "run the test suite and fix any failures"
          },
          {
            role: 'assistant',
            text: "Running the tests now.",
            thinkingBlocks: [],
            toolCalls: [
              {
                type: 'bash',
                command: 'npm run test',
                result: { status: 'error', result: '3 tests failed: formatDate, parseUser, buildIndex' }
              },
              {
                type: 'edit',
                filePath: 'src/utils.ts',
                diff: `-  return d.toISOString()\n+  return d.toISOString().split('T')[0]`,
                result: { status: 'success', result: 'File edited successfully' }
              },
              {
                type: 'bash',
                command: 'npm run test',
                result: { status: 'success', result: 'All 24 tests passed' }
              },
            ]
          }
        ]
      }
    ]
  },
  {
    name: "ccct",
    conversations: [
      {
        id: "ID22222",
        projectName: "ccct",
        projectSlug: "setup-tailwind-id22222",
        projectDate: "10-03-2026",
        messages: [
          {
            role: 'user',
            text: "set up tailwind and configure the design tokens"
          },
          {
            role: 'assistant',
            text: "I'll install Tailwind and set up the design tokens from DESIGN.md.",
            thinkingBlocks: [],
            toolCalls: [
              {
                type: 'bash',
                command: 'npm install tailwindcss',
                result: { status: 'success', result: 'Installed tailwindcss@3.4.1' }
              },
              {
                type: 'write',
                filePath: 'tailwind.config.js',
                result: { status: 'success', result: 'File written successfully' }
              },
            ]
          }
        ]
      },
      {
        id: "ID33333",
        projectName: "ccct",
        projectSlug: "build-sidebar-id33333",
        projectDate: "11-03-2026",
        messages: [
          {
            role: 'user',
            text: "build the sidebar component with project groupings"
          },
          {
            role: 'assistant',
            text: "Let me check the existing types before building the sidebar.",
            thinkingBlocks: [
              { text: "I need to understand the Project and Conversation types before building the sidebar component." }
            ],
            toolCalls: [
              {
                type: 'read',
                filePath: 'src/types/index.ts',
                result: { status: 'success', result: 'File read successfully' }
              },
              {
                type: 'write',
                filePath: 'src/components/sidebar/Sidebar.tsx',
                result: { status: 'success', result: 'File written successfully' }
              },
            ]
          }
        ]
      },
      {
        id: "ID44444",
        projectName: "ccct",
        projectSlug: "fix-layout-id44444",
        projectDate: "12-03-2026",
        messages: [
          {
            role: 'user',
            text: "the topbar is appearing on the left instead of the top, fix it"
          },
          {
            role: 'assistant',
            text: "The issue is the outer div uses flex without flex-col. I'll fix the layout.",
            thinkingBlocks: [],
            toolCalls: [
              {
                type: 'edit',
                filePath: 'src/App.tsx',
                diff: `-      <div className="flex h-full bg-surface-base">\n+      <div className="flex flex-col h-full bg-surface-base">`,
                result: { status: 'success', result: 'File edited successfully' }
              },
            ]
          }
        ]
      }
    ]
  }
]
