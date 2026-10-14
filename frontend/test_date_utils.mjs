import {
  parseMessageDate,
  formatMessageBubbleTime,
  formatConversationListItemTime,
} from './src/utils/dateUtils.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function assertEquals(actual, expected, message) {
  if (actual === expected) {
    passed++;
    console.log(`  PASS: ${message} (got '${actual}')`);
  } else {
    failed++;
    console.error(`  FAIL: ${message} (expected '${expected}', got '${actual}')`);
  }
}

console.log('--- RUNNING DATE UTILS TESTS ---');

// Test 1: SQLite naive format parsing
const naiveSqlite = '2026-10-13 06:27:00';
const parsedSqlite = parseMessageDate(naiveSqlite);
assert(parsedSqlite !== null, 'SQLite naive timestamp parsed successfully');
assertEquals(parsedSqlite.toISOString(), '2026-10-13T06:27:00.000Z', 'SQLite naive timestamp treated as UTC instant');

// Test 2: ISO with Z
const isoZ = '2026-10-13T06:27:00Z';
const parsedIsoZ = parseMessageDate(isoZ);
assertEquals(parsedIsoZ.toISOString(), '2026-10-13T06:27:00.000Z', 'ISO timestamp with Z parsed as UTC instant');

// Test 3: ISO with explicit offset (IST +05:30)
const isoIST = '2026-10-13T11:57:00+05:30';
const parsedIsoIST = parseMessageDate(isoIST);
assertEquals(parsedIsoIST.toISOString(), '2026-10-13T06:27:00.000Z', 'IST offset timestamp parsed to exact same UTC instant without double-shifting');

// Test 4: Timezone conversion in Asia/Kolkata (IST)
const utcInstant = '2026-10-13T06:27:00Z';
const formattedIST = formatMessageBubbleTime(utcInstant, 'Asia/Kolkata');
// In IST, 06:27 UTC is 11:57 local time
assert(formattedIST.includes('11:57'), `UTC instant 06:27 displays as 11:57 in Asia/Kolkata (got '${formattedIST}')`);

// Test 5: Verify no double shifting: 11:57 IST should NOT become 17:27
const formattedFromOffset = formatMessageBubbleTime('2026-10-13T11:57:00+05:30', 'Asia/Kolkata');
assert(formattedFromOffset.includes('11:57'), `Explicit IST timestamp does not shift by additional 5:30 (got '${formattedFromOffset}')`);

// Test 6: Same instant viewed in different timezones
const formattedUTC = formatMessageBubbleTime(utcInstant, 'UTC');
assert(formattedUTC.includes('06:27'), `Same instant viewed in UTC displays 06:27 (got '${formattedUTC}')`);
const formattedNYC = formatMessageBubbleTime(utcInstant, 'America/New_York');
assert(formattedNYC.includes('02:27'), `Same instant viewed in New York displays 02:27 (got '${formattedNYC}')`);

// Test 7: Historical / Previous dates display readable date
const pastDate = '2025-10-12T06:27:00Z';
const formattedPast = formatMessageBubbleTime(pastDate, 'Asia/Kolkata');
assert(formattedPast.includes('12') && formattedPast.includes('Oct'), `Past message displays calendar date (got '${formattedPast}')`);
assert(formattedPast.includes('2025'), `Older year message displays year (got '${formattedPast}')`);

// Test 8: Conversation list item formatting
const pastListFormatted = formatConversationListItemTime(pastDate, 'Asia/Kolkata');
assert(pastListFormatted.includes('12') && pastListFormatted.includes('Oct') && pastListFormatted.includes('2025'), `List item displays clean date for previous year (got '${pastListFormatted}')`);

// Test 9: Graceful handling of missing or malformed inputs (no 'Invalid Date' or 'NaN')
assertEquals(formatMessageBubbleTime(null), '', 'Null input returns empty string');
assertEquals(formatMessageBubbleTime(undefined), '', 'Undefined input returns empty string');
assertEquals(formatMessageBubbleTime('invalid-string'), '', 'Malformed input returns empty string');
assertEquals(formatMessageBubbleTime(''), '', 'Empty string input returns empty string');
assertEquals(formatConversationListItemTime('not-a-date'), '', 'Malformed input returns empty string for list item');

// Test 10: Chronological sorting with stable tie-breaker
const unsortedMessages = [
  { id: 'msg-3', created_at: '2026-10-13T12:00:00Z' },
  { id: 'msg-1', created_at: '2026-10-13T10:00:00Z' },
  { id: 'msg-2b', created_at: '2026-10-13T11:00:00Z' },
  { id: 'msg-2a', created_at: '2026-10-13T11:00:00Z' },
];

const sorted = unsortedMessages.slice().sort((a, b) => {
  const tA = parseMessageDate(a.created_at)?.getTime() || 0;
  const tB = parseMessageDate(b.created_at)?.getTime() || 0;
  if (tA !== tB) return tA - tB;
  return a.id.localeCompare(b.id);
});

assertEquals(sorted.map(m => m.id).join(','), 'msg-1,msg-2a,msg-2b,msg-3', 'Messages sorted chronologically with stable secondary key');

console.log(`--- SUMMARY: ${passed} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
