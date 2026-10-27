export const SLACK_MOCKS = {
  authTest: {
    user_id: 'U123456',
    user: 'testuser',
    team: 'Acme Team',
  },

  // users.conversations response; the dashboard shows the summed unread_count.
  channels: [
    {
      id: 'C001',
      name: 'general',
      is_im: false,
      is_mpim: false,
      unread_count: 5,
      latest: { text: 'Hello team!', ts: '1705000000.000001' },
    },
    {
      id: 'D001',
      name: '',
      is_im: true,
      is_mpim: false,
      user: 'U999',
      unread_count: 2,
      latest: { text: 'Hey, can you review PR #42?', ts: '1705000100.000001' },
    },
  ],
};
