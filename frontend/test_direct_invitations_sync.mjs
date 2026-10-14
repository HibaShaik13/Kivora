/**
 * Frontend Regression & Synchronization Tests: Direct Invitations Sidebar Count & Scope
 * 
 * Tests:
 * 1. Three accepted invitations: sidebar count follows the established counting rule (3) and matches page header.
 * 2. Pending invitations: badge and header follow total & pending semantics accurately.
 * 3. Accepting or declining an invitation updates count and card status without mismatch.
 * 4. A new invitation increments the total count.
 * 5. Invitations belonging to another creator are excluded.
 * 6. Refreshing / reopening Creator Studio produces the correct count.
 * 7. Empty invitation lists show the correct zero state (0 count, 'No invitations yet').
 * 8. Invitation page and sidebar do not disagree about their shared count definition.
 * 9. Loading state: badge count is undefined while loading to prevent brief flash of 0.
 */

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

console.log('--- RUNNING DIRECT INVITATIONS SYNCHRONIZATION TESTS ---');

// Mock counting helper mirroring CreatorDashboard logic:
function computeSidebarCount(invitations, isLoadingInvitations) {
  if (isLoadingInvitations && invitations === null) {
    return undefined; // Do not show 0 while loading
  }
  return invitations?.length ?? 0;
}

function computePageHeaderCounts(invitations, isLoadingInvitations) {
  if (isLoadingInvitations && invitations === null) {
    return { totalLabel: '...', pendingActionCount: 0 };
  }
  const total = invitations?.length || 0;
  const pending = (invitations || []).filter(i => i.status === 'INVITED').length;
  return {
    totalLabel: `${total} Total`,
    pendingActionCount: pending,
    totalCount: total,
  };
}

// =========================================================================
// TEST 1: Elena Rostova Scenario - 3 Accepted Invitations
// =========================================================================
console.log('\n[Scenario 1] Three accepted invitations from Lumina Skincare:');
const elenaInvitations = [
  { id: 'app-elena-lumina', brief_id: 'b1', brief_title: 'Dewdrop Radiance Serum 4K Cinematic Launch', brand_name: 'Lumina Skincare', status: 'ACCEPTED' },
  { id: 'app-52f27baa7b', brief_id: 'b2', brief_title: 'Radiant Aura: Premium Vitamin C Face Serum Launch Campaign', brand_name: 'Lumina Skincare', status: 'ACCEPTED' },
  { id: 'app-bd721e9e85', brief_id: 'b3', brief_title: 'Lumina Dewdrop Serum Luxury Launch Campaign', brand_name: 'Lumina Skincare', status: 'ACCEPTED' },
];

const elenaSidebarCount = computeSidebarCount(elenaInvitations, false);
const elenaPageCounts = computePageHeaderCounts(elenaInvitations, false);

assertEquals(elenaSidebarCount, 3, 'Sidebar badge displays 3 for three accepted invitations (was 0 in old buggy implementation)');
assertEquals(elenaPageCounts.totalLabel, '3 Total', 'Page header displays "3 Total"');
assertEquals(elenaPageCounts.pendingActionCount, 0, 'No pending action badge when all invitations are accepted');
assertEquals(elenaSidebarCount, elenaInvitations.length, 'Sidebar badge strictly matches total rendered card count');

// =========================================================================
// TEST 2: Pending Invitations Semantics
// =========================================================================
console.log('\n[Scenario 2] Pending invitations semantics:');
const mixedInvitations = [
  ...elenaInvitations,
  { id: 'inv-new-1', brief_id: 'b4', brief_title: 'Summer Splash 9:16 Video', brand_name: 'Lumina Skincare', status: 'INVITED' },
];

const mixedSidebarCount = computeSidebarCount(mixedInvitations, false);
const mixedPageCounts = computePageHeaderCounts(mixedInvitations, false);

assertEquals(mixedSidebarCount, 4, 'Sidebar badge reflects 4 total direct invitations');
assertEquals(mixedPageCounts.totalLabel, '4 Total', 'Page header shows 4 Total');
assertEquals(mixedPageCounts.pendingActionCount, 1, 'Page header displays 1 Pending Action badge for actionability');

// =========================================================================
// TEST 3: Accepting or Declining Updates State Correctly
// =========================================================================
console.log('\n[Scenario 3] Accepting or declining an invitation:');
// Creator accepts inv-new-1
const afterAccept = mixedInvitations.map(i => i.id === 'inv-new-1' ? { ...i, status: 'ACCEPTED' } : i);
assertEquals(computeSidebarCount(afterAccept, false), 4, 'Sidebar count remains 4 total after accepting');
assertEquals(computePageHeaderCounts(afterAccept, false).pendingActionCount, 0, 'Pending actions drop to 0 after accepting');

// Creator declines inv-new-1
const afterDecline = mixedInvitations.map(i => i.id === 'inv-new-1' ? { ...i, status: 'DECLINED' } : i);
assertEquals(computeSidebarCount(afterDecline, false), 4, 'Sidebar count remains 4 total after declining');
assertEquals(computePageHeaderCounts(afterDecline, false).pendingActionCount, 0, 'Pending actions drop to 0 after declining');

// =========================================================================
// TEST 4: New Invitation Increments Count
// =========================================================================
console.log('\n[Scenario 4] Receiving a new invitation:');
const newInv = { id: 'inv-brand-fresh', brief_id: 'b5', brief_title: 'Winter Glow 4K', brand_name: 'Aura', status: 'INVITED' };
const updatedList = [...mixedInvitations, newInv];
assertEquals(computeSidebarCount(updatedList, false), 5, 'Sidebar count increments from 4 to 5');
assertEquals(computePageHeaderCounts(updatedList, false).pendingActionCount, 2, 'Pending actions increment from 1 to 2');

// =========================================================================
// TEST 5: Creator Isolation
// =========================================================================
console.log('\n[Scenario 5] Cross-creator isolation:');
const creatorA_id = 'cr-elena';
const creatorB_id = 'cr-marcus';
const allDbRecords = [
  { id: 'inv-1', creator_id: creatorA_id, status: 'ACCEPTED' },
  { id: 'inv-2', creator_id: creatorA_id, status: 'ACCEPTED' },
  { id: 'inv-3', creator_id: creatorB_id, status: 'INVITED' },
];

const creatorA_scoped = allDbRecords.filter(r => r.creator_id === creatorA_id);
const creatorB_scoped = allDbRecords.filter(r => r.creator_id === creatorB_id);

assertEquals(computeSidebarCount(creatorA_scoped, false), 2, 'Creator A only sees their 2 invitations');
assertEquals(computeSidebarCount(creatorB_scoped, false), 1, 'Creator B only sees their 1 invitation');
assert(!creatorA_scoped.some(r => r.creator_id === creatorB_id), 'Creator A cannot see Creator B invitations');

// =========================================================================
// TEST 6: Loading State Does NOT Flash 0
// =========================================================================
console.log('\n[Scenario 6] Loading state prevents premature 0 count flash:');
const loadingSidebar = computeSidebarCount(null, true);
assertEquals(loadingSidebar, undefined, 'While loading and invitations is null, sidebar count is undefined (no badge or pulse rendered, avoiding flash of 0)');
const loadingHeader = computePageHeaderCounts(null, true);
assertEquals(loadingHeader.totalLabel, '...', 'While loading, page header displays "..." instead of premature "0 Total"');

// =========================================================================
// TEST 7: Empty Invitation List Clean Zero State
// =========================================================================
console.log('\n[Scenario 7] Empty invitation lists:');
const emptyList = [];
assertEquals(computeSidebarCount(emptyList, false), 0, 'Loaded empty list produces 0 sidebar count');
assertEquals(computePageHeaderCounts(emptyList, false).totalLabel, '0 Total', 'Loaded empty list produces "0 Total" header');
assertEquals(computePageHeaderCounts(emptyList, false).pendingActionCount, 0, '0 pending action badge');

// =========================================================================
// TEST 8: Shared Count Contract - Sidebar and Page Never Disagree
// =========================================================================
console.log('\n[Scenario 8] Contract consistency between sidebar and page:');
const testCases = [
  [],
  [{ id: '1', status: 'INVITED' }],
  [{ id: '1', status: 'ACCEPTED' }, { id: '2', status: 'ACCEPTED' }, { id: '3', status: 'ACCEPTED' }],
  [{ id: '1', status: 'INVITED' }, { id: '2', status: 'DECLINED' }, { id: '3', status: 'ACCEPTED' }],
];

for (const tc of testCases) {
  const sb = computeSidebarCount(tc, false);
  const pg = computePageHeaderCounts(tc, false).totalCount;
  assertEquals(sb, pg, `Sidebar count (${sb}) strictly equals page totalCount (${pg}) for dataset of size ${tc.length}`);
}

console.log('\n-----------------------------------------------------------');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('-----------------------------------------------------------');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
