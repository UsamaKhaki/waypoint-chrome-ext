import type { NotionUser, NotionPage } from '../../src/services/notionApi';

export const NOTION_MOCKS = {
  user: {
    id: 'notion-user-1',
    name: 'Test User',
    avatar_url: null,
    type: 'person',
  } satisfies NotionUser,

  pages: [
    {
      id: 'page-1',
      url: 'https://www.notion.so/acme/Tech-Spec-Template-abc123',
      created_time: '2024-01-10T10:00:00.000Z',
      last_edited_time: '2024-01-11T12:00:00.000Z',
      object: 'page',
      title: 'Tech Spec Template',
      icon: { type: 'emoji', emoji: '📄' },
      parent: { type: 'workspace' },
    },
    {
      id: 'db-1',
      url: 'https://www.notion.so/acme/Sprint-Board-def456',
      created_time: '2024-01-01T00:00:00.000Z',
      last_edited_time: '2024-01-11T10:00:00.000Z',
      object: 'database',
      title: 'Sprint Board',
      icon: null,
      parent: { type: 'workspace' },
    },
  ] satisfies NotionPage[],
};
