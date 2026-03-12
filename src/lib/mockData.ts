import type { Project } from '../types';

export const projects: Project[] = [
  {
    name: "my-project",
    conversations: [
      { 
        id: "ID12345",
        projectName: "Project 1",
        projectSlug: "project-id12345",
        projectDate: "02-02-2026",
        messages: [
          { role: 'user',
            text: "can you read through this repo..." 
          },
          { role: 'assistant',
            text: "user wants me to read through this repo...",
            thinkingBlocks: [
              { text: "The user wants me to read the repo. Let me start with the main files..." }
            ],
            toolCalls: [
              {
                type: 'read',
                filePath: 'src/weather.ts',
                result: {
                  status: 'success',
                  result: 'File read successfully'
                }
              },
              {
                type: 'read',
                filePath: 'src/weather.ts',
                result: {
                  status: 'error',
                  result: 'Unable to read file'
                }
              },
            ]
          }
        ]
      }
    ]
  }
  
]