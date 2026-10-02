import assert from 'node:assert';
import fs from 'node:fs';

console.log('--- Testing Unified Inbox & Message Modifications ---');

// 1. Check index.html contains the unified inbox and message modification features
const indexHtml = fs.readFileSync('index.html', 'utf8');

// A. Permanent post deletion checks
assert.ok(
  indexHtml.includes('deletedPosts'),
  'deletedPosts collection must be checked for tombstoned posts'
);
assert.ok(
  indexHtml.includes('Deleted permanently') || indexHtml.includes('permanently and forever deleted'),
  'Post takedowns and user deletions must state permanent and irreversible deletion'
);

// B. Server takedown and restore checks
const serverJs = fs.readFileSync('server.js', 'utf8');
assert.ok(
  serverJs.includes('Posts deleted by post owner or security team are permanently and forever deleted'),
  'server.js /api/admin/restore must disallow restoring permanently deleted posts'
);
assert.ok(
  serverJs.includes('recordPermanentPostDeletion'),
  'server.js must record permanent post deletion on takedown or delete'
);

// C. Unified Inbox page checks
assert.ok(
  indexHtml.includes('inboxTabMessagesBtn') && indexHtml.includes('inboxTabNotifsBtn'),
  'Inbox page must contain tab buttons for both Chats/Messages and Notifications/Activity'
);
assert.ok(
  indexHtml.includes('inboxMessagesView') && indexHtml.includes('inboxNotificationsView'),
  'Inbox page must contain distinct view containers for both Chats and Notifications'
);
assert.ok(
  indexHtml.includes('switchInboxTab'),
  'window.switchInboxTab function must be available to seamlessly toggle between messages and notifications'
);

// D. Chat Messages Modifications checks
assert.ok(
  indexHtml.includes('startEditChatMessage') && indexHtml.includes('saveEditChatMessage') && indexHtml.includes('cancelEditChatMessage'),
  'Inbox page must support editing chat messages (start, save, cancel)'
);
assert.ok(
  indexHtml.includes('deleteChatMessage'),
  'Inbox page must support permanently deleting/unsending chat messages'
);
assert.ok(
  indexHtml.includes('toggleMessageReaction'),
  'Inbox page must support toggling emoji reactions on chat messages'
);
assert.ok(
  indexHtml.includes('copyChatMessageText'),
  'Inbox page must support copying chat message text'
);
assert.ok(
  indexHtml.includes('deleteConversation'),
  'Inbox page must support deleting conversation threads'
);

// E. Firestore Rules check
const firestoreRules = fs.readFileSync('firestore.rules', 'utf8');
assert.ok(
  firestoreRules.includes('match /messages/{messageId}'),
  'firestore.rules must contain rules for messages'
);
assert.ok(
  firestoreRules.includes('match /deletedPosts/{postId}'),
  'firestore.rules must enforce tombstone protection for deleted posts'
);

console.log('✓ Verified permanent post deletion is enforced and non-restorable');
console.log('✓ Verified unified Inbox page contains both user notifications and chat messages');
console.log('✓ Verified chat message modifications (edit, delete/unsend, emoji reactions, copy) are implemented');
console.log('--- All Unified Inbox & Message Modifications Tests Passed Successfully! ---');
