/**
 * Audit & Auto-Link Related Products on Existing Blog Posts
 *
 * Implements Requirement R2:
 * 1. Audits all existing blog posts in Firestore.
 * 2. Populates 1 to 3 relevant, high-affinity service doc IDs for the 22 unlinked posts (per survey_explorer_2 §3.2).
 * 3. Repairs the 2 corrupted posts (NKb57k6Z1dJLAGwx5cvA and wgujQUMOFd1gVxp23v4V) with valid service IDs (per survey_explorer_2 §3.3).
 * 4. Optimizes the 18 blog posts with metaTitle > 59 characters so all metaTitles are strictly <= 59 chars (per survey_explorer_2 §3.4).
 * 5. Verifies that EVERY service ID assigned exists in the services collection.
 * 6. Performs post-update verification across all blog posts.
 */

import { getAdminDb } from '../src/lib/firebase-admin';

interface UnlinkedPostConfig {
  relatedProducts: string[];
  primaryKeyword?: string;
  searchIntent?: 'Informational' | 'Commercial';
}

// 1. Mappings for the 22 unlinked blog posts (survey_explorer_2 §3.2)
export const UNLINKED_POST_UPDATES: Record<string, UnlinkedPostConfig> = {
  '1cd0923e-d65f-402b-ad90-9abdeb03e662': {
    relatedProducts: ['bJcEEaJUlz3up4LzOF20', 'dm7CVbkmccQlurYX2Fel', '5aqlDQIbupu4w5BfwpBW'],
    primaryKeyword: 'IRP6 return South Africa',
    searchIntent: 'Informational',
  },
  '2xqD1PW1BY63BvKRgeQS': {
    relatedProducts: ['ZcTUdYjTqKGkF8IM3k4n', 'QYEKK5Wu4RC084J8IWoI', 'd7tkxTkp5hxzPu7LYjYQ'],
  },
  '5nh068vEP3u5Gwzn9Qap': {
    relatedProducts: ['ZcTUdYjTqKGkF8IM3k4n', 'GQ3zzxRGW0MEFJNnqqNO', '2HG85hwbhbDsDQsjQE6y'],
  },
  '69AWx2yD8B6ns9LCV5Ep': {
    relatedProducts: ['p7Mk5I4CCCsN79Sk11zO', 'uOv7o5tv6NFW1kANqJFf', 'TFnJoFqAe5cI7eTrkFjx'],
  },
  '6ELwfNdUFq5k97sbJuL9': {
    relatedProducts: ['ZcTUdYjTqKGkF8IM3k4n', 'DMPz0z8NWUUeRigMGep0', '2HG85hwbhbDsDQsjQE6y'],
  },
  'AfzpVtX0odWw5l9LpOIU': {
    relatedProducts: ['ZcTUdYjTqKGkF8IM3k4n', '2HG85hwbhbDsDQsjQE6y', 'DMPz0z8NWUUeRigMGep0'],
  },
  'BtZG5roMzFXjwfzOwqVa': {
    relatedProducts: ['ZcTUdYjTqKGkF8IM3k4n', '2HG85hwbhbDsDQsjQE6y', '6Vuo5fEQVltv1CiLGaPg'],
  },
  'CJ4oOh3GNXwU13OzAzKL': {
    relatedProducts: ['ZcTUdYjTqKGkF8IM3k4n', '2HG85hwbhbDsDQsjQE6y', 'Gep0mXM6phvt0Zsx5Rsa'],
  },
  'HfFd00pjjHOcpUu3ikOu': {
    relatedProducts: ['aB3sBqTw9X1THHOimdKL', '6Vuo5fEQVltv1CiLGaPg', 'axdOkw4ih9ZZwxM6llgp'],
  },
  'NHaTQqDokqYz1STpfFX9': {
    relatedProducts: ['ZcTUdYjTqKGkF8IM3k4n', '2HG85hwbhbDsDQsjQE6y', 'DMPz0z8NWUUeRigMGep0'],
  },
  'NcoKWQZSTH3dPf1ZXn3C': {
    relatedProducts: ['ZcTUdYjTqKGkF8IM3k4n', '2HG85hwbhbDsDQsjQE6y', '6Vuo5fEQVltv1CiLGaPg'],
  },
  'PlvPLKUpo7UcASBNLNo7': {
    relatedProducts: ['2HG85hwbhbDsDQsjQE6y', '6Vuo5fEQVltv1CiLGaPg', 'ZcTUdYjTqKGkF8IM3k4n'],
  },
  'QmGPNC4yQw62VHQZciAR': {
    relatedProducts: ['QYEKK5Wu4RC084J8IWoI', 'd7tkxTkp5hxzPu7LYjYQ', '9rlbSVRpQvdx2EwZEelS'],
  },
  'VWzGqKxtBJ5ed9sctQv7': {
    relatedProducts: ['x1SPV4bLK73lzfk90Nem', 'spxnYsCmB6hXK0VcmN4O', '6Vuo5fEQVltv1CiLGaPg'],
  },
  'a61065e2-ca20-4035-adc5-dd30bcbce902': {
    relatedProducts: ['uvkujgUBTIbIwXLdE4Tu', 'fZnuRec18mQ7IBivhuPw', 'Tb4u78rLkcRceFy1rKxv'],
    primaryKeyword: 'VAT123e form SARS',
    searchIntent: 'Informational',
  },
  'b6bd962a-96a1-4ed9-afa3-6dde28ad34e4': {
    relatedProducts: ['c9fINj7coxAI1XlediNq', '126urIq86Tq2m0R17qoZ', 'IHthLO8QN4f9cWGkyH2a'],
    primaryKeyword: 'SARS tax directive application',
    searchIntent: 'Informational',
  },
  'ca82820c-a63b-4c66-9d0e-f963825cbe66': {
    relatedProducts: ['8CcMPMv2GEzPR7mKVOiy', 'r4HuAtPQePYaCYwMbEOw', 'SGGudvWwMnSoJ2ysreiR'],
    primaryKeyword: 'CIPC beneficial ownership declaration',
    searchIntent: 'Informational',
  },
  'dbbf9db6-a1f8-4bf5-a8a8-eb3c8f9ed510': {
    relatedProducts: ['126urIq86Tq2m0R17qoZ', 'IHthLO8QN4f9cWGkyH2a', 'Rc1Oa1zDwzLk40JplTjM'],
    primaryKeyword: 'submit ITR12 tax return',
    searchIntent: 'Informational',
  },
  'kzS19T1lZNFrFuJIQOId': {
    relatedProducts: ['D0nfSezLRim55XkPSCYZ', 'ePXg4RtNWdzfZ7XBOuV4', '8CcMPMv2GEzPR7mKVOiy'],
  },
  'l0Esh0yse210lu5jqqUZ': {
    relatedProducts: ['ZcTUdYjTqKGkF8IM3k4n', '2HG85hwbhbDsDQsjQE6y', '6Vuo5fEQVltv1CiLGaPg'],
  },
  'oVFuCJiAbZZFNn7ZDPgI': {
    relatedProducts: ['x1SPV4bLK73lzfk90Nem', 'spxnYsCmB6hXK0VcmN4O', 'KTUYhBzZKE6OLO2TAbkL'],
  },
  'yvHjOj1gwpiaMZMp8oXA': {
    relatedProducts: ['zo9yX5ws1rzHfDwIPpho', '2HG85hwbhbDsDQsjQE6y', 'Gep0mXM6phvt0Zsx5Rsa'],
  },
};

// 2. Mappings for the 2 corrupted blog posts (survey_explorer_2 §3.3)
export const CORRUPTED_POST_REPAIRS: Record<string, string[]> = {
  'NKb57k6Z1dJLAGwx5cvA': ['uvkujgUBTIbIwXLdE4Tu', 'fZnuRec18mQ7IBivhuPw', 'Tb4u78rLkcRceFy1rKxv'],
  'wgujQUMOFd1gVxp23v4V': ['Rc1Oa1zDwzLk40JplTjM', 'IHthLO8QN4f9cWGkyH2a', 'bJcEEaJUlz3up4LzOF20'],
};

// 3. Mappings for the 18 blog posts with metaTitle > 59 (survey_explorer_2 §3.4)
export const OVERLONG_METATITLE_OPTIMIZATIONS: Record<string, string> = {
  '1JoL5OQpD8yp2lbu34oR': 'CIPC Company Reinstatement SA: Restore Your Business', // 53 chars
  'NKb57k6Z1dJLAGwx5cvA': 'SA VAT Registration Thresholds (2026 Guide)', // 43 chars
  'VWzGqKxtBJ5ed9sctQv7': 'Why Outsourced Accounting Is Best for SA Businesses', // 51 chars
  '5nh068vEP3u5Gwzn9Qap': 'SARS Objections Guide: Taxpayer Rights & How to Object', // 54 chars
  '6ELwfNdUFq5k97sbJuL9': 'SARS VDP: Voluntary Disclosure Programme Guide', // 46 chars
  '2xqD1PW1BY63BvKRgeQS': 'SARS S200 Compromise Rejected? Liquidation Guide', // 48 chars
  '69AWx2yD8B6ns9LCV5Ep': 'Outsource Payroll in SA: Benefits for Your Business', // 51 chars
  'HfFd00pjjHOcpUu3ikOu': 'Bookkeeper Empowerment in SA: Practice Growth Guide', // 51 chars
  'QmGPNC4yQw62VHQZciAR': 'Liquidation & Sequestration SA: Options Explained', // 49 chars
  '2mv6uolNY5cbStKx3Xdx': 'Annual COIDA Renewal Guide for South African Firms', // 50 chars
  'BtZG5roMzFXjwfzOwqVa': 'SARS Penalty Dispute: How We Disputed R11.5M Penalty', // 52 chars
  'CJ4oOh3GNXwU13OzAzKL': 'SARS Tax Debt: Valid Reasons for Payment Relief', // 47 chars
  'RqeWk3n3MbfBJxjWwOfo': 'Provisional Tax: Feb Year-End Company Guide SA', // 46 chars
  'XApGN7ADQzxdF4RZCa7M': 'Beneficial Ownership in SA: Who Needs to File?', // 46 chars
  'NHaTQqDokqYz1STpfFX9': 'SARS Penalty Remission Requirements Explained', // 45 chars
  'GwF5g5ag9nfgRps03IR5': 'Win Government Contracts in SA: Tender Guide', // 44 chars
  'KE8aHleHZBXSm56qgb15': 'Should You Accept Your SARS Auto Assessment?', // 44 chars
  'PlvPLKUpo7UcASBNLNo7': 'SARS Audit: What Not to Do to Avoid Heavy Penalties', // 51 chars
};

/**
 * Fallback sanitizer to guarantee metaTitle <= 59 characters
 */
export function sanitizeMetaTitle(raw: string): string {
  let cleaned = raw.replace(/\s*\|\s*My\s*Accountant\s*$/i, '').trim();
  if (cleaned.length <= 59) return cleaned;
  cleaned = cleaned.replace(/\s*\|\s*.*$/, '').trim();
  if (cleaned.length <= 59) return cleaned;
  const truncated = cleaned.slice(0, 56);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 30 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

export async function runAuditAndLinking() {
  console.log('='.repeat(80));
  console.log('STARTING BLOG POST AUDIT & AUTO-LINKING (REQUIREMENT R2)');
  console.log('='.repeat(80));

  const db = getAdminDb();

  // Step 1: Ingest and validate all services from services collection
  console.log('\n[1/6] Validating catalog in "services" collection...');
  const servicesSnap = await db.collection('services').get();
  console.log(`Found ${servicesSnap.size} total services in catalog.`);

  const validServiceMap = new Map<string, { title: string; category: string; price: number }>();
  servicesSnap.docs.forEach(doc => {
    const data = doc.data();
    validServiceMap.set(doc.id, {
      title: data.title || '',
      category: data.category || '',
      price: data.price || 0,
    });
  });

  // Verify that all IDs in UNLINKED_POST_UPDATES and CORRUPTED_POST_REPAIRS exist in services
  const allProposedServiceIds = new Set<string>();
  Object.values(UNLINKED_POST_UPDATES).forEach(u => u.relatedProducts.forEach(id => allProposedServiceIds.add(id)));
  Object.values(CORRUPTED_POST_REPAIRS).forEach(ids => ids.forEach(id => allProposedServiceIds.add(id)));

  const missingCatalogIds: string[] = [];
  allProposedServiceIds.forEach(id => {
    if (!validServiceMap.has(id)) {
      missingCatalogIds.push(id);
    }
  });

  if (missingCatalogIds.length > 0) {
    throw new Error(`FATAL: The following service IDs do NOT exist in the services collection: ${missingCatalogIds.join(', ')}`);
  }
  console.log(`✓ Catalog Pre-Check PASSED: All ${allProposedServiceIds.size} unique service IDs exist in "services".`);

  // Step 2: Fetch and audit all blog posts
  console.log('\n[2/6] Auditing existing blog posts in "blogPosts" collection...');
  const blogSnap = await db.collection('blogPosts').get();
  console.log(`Found ${blogSnap.size} total blog posts.`);

  let initialUnlinkedCount = 0;
  let initialCorruptedCount = 0;
  let initialOverlongMetaCount = 0;

  const updatesToApply: Array<{
    id: string;
    slug: string;
    title: string;
    changes: Record<string, any>;
    reasons: string[];
  }> = [];

  for (const doc of blogSnap.docs) {
    const data = doc.data();
    const id = doc.id;
    const slug = data.slug || '';
    const title = data.title || '';
    const relatedProducts = data.relatedProducts || [];
    const metaTitle = data.metaTitle || '';

    const reasons: string[] = [];
    const changes: Record<string, any> = {};

    // Check 1: Empty or missing relatedProducts
    const isUnlinked = !Array.isArray(relatedProducts) || relatedProducts.length === 0;
    if (isUnlinked) {
      initialUnlinkedCount++;
      const config = UNLINKED_POST_UPDATES[id];
      if (config) {
        changes.relatedProducts = config.relatedProducts;
        reasons.push(`Populate unlinked products (${config.relatedProducts.length} services)`);
        if (config.primaryKeyword && !data.primaryKeyword) {
          changes.primaryKeyword = config.primaryKeyword;
          reasons.push(`Add primaryKeyword "${config.primaryKeyword}"`);
        }
        if (config.searchIntent && !data.searchIntent) {
          changes.searchIntent = config.searchIntent;
          reasons.push(`Add searchIntent "${config.searchIntent}"`);
        }
      } else {
        console.warn(`WARNING: Post ${id} (${slug}) is unlinked but has no explicit mapping entry!`);
      }
    }

    // Check 2: Corrupted relatedProducts
    const corruptedReplacement = CORRUPTED_POST_REPAIRS[id];
    if (corruptedReplacement) {
      initialCorruptedCount++;
      changes.relatedProducts = corruptedReplacement;
      reasons.push(`Repair corrupted relatedProducts -> [${corruptedReplacement.join(', ')}]`);
    }

    // Check 3: Overlong metaTitle (> 59 chars)
    if (metaTitle.length > 59) {
      initialOverlongMetaCount++;
      const targetMetaTitle = OVERLONG_METATITLE_OPTIMIZATIONS[id] || sanitizeMetaTitle(metaTitle);
      if (targetMetaTitle.length > 59) {
        throw new Error(`Sanitized metaTitle for ${id} still exceeds 59 chars: "${targetMetaTitle}" (${targetMetaTitle.length})`);
      }
      changes.metaTitle = targetMetaTitle;
      reasons.push(`Optimize metaTitle from ${metaTitle.length} to ${targetMetaTitle.length} chars ("${targetMetaTitle}")`);
    }

    if (Object.keys(changes).length > 0) {
      updatesToApply.push({
        id,
        slug,
        title,
        changes,
        reasons,
      });
    }
  }

  console.log(`\nAudit Findings:`);
  console.log(`- Unlinked posts detected: ${initialUnlinkedCount} (Expected: 22)`);
  console.log(`- Corrupted posts detected: ${initialCorruptedCount} (Expected: 2)`);
  console.log(`- Overlong metaTitles (>59 chars): ${initialOverlongMetaCount} (Expected: 18)`);
  console.log(`- Total posts requiring updates: ${updatesToApply.length}`);

  // Step 3: Apply updates to Firestore
  console.log('\n[3/6] Applying updates to Firestore...');
  const batch = db.batch();
  for (const item of updatesToApply) {
    const docRef = db.collection('blogPosts').doc(item.id);
    batch.update(docRef, item.changes);
    console.log(`  -> Queued [${item.id}] ${item.slug}: ${item.reasons.join('; ')}`);
  }

  await batch.commit();
  console.log(`✓ Successfully committed updates to ${updatesToApply.length} documents.`);

  // Step 4: Post-update Verification across all blog posts
  console.log('\n[4/6] Running post-update verification across all blog posts...');
  const postVerificationSnap = await db.collection('blogPosts').get();
  console.log(`Auditing fresh snapshot of ${postVerificationSnap.size} posts...`);

  let remainingUnlinked = 0;
  let remainingCorrupted = 0;
  let remainingOverlongMeta = 0;
  const invalidServiceReferences: Array<{ postId: string; invalidIds: string[] }> = [];
  const metaTitleLengths: Array<{ postId: string; length: number; metaTitle: string }> = [];

  for (const doc of postVerificationSnap.docs) {
    const data = doc.data();
    const id = doc.id;
    const rp: string[] = data.relatedProducts || [];
    const mt: string = data.metaTitle || '';

    if (!Array.isArray(rp) || rp.length === 0) {
      remainingUnlinked++;
    }

    const invalid = rp.filter(serviceId => !validServiceMap.has(serviceId));
    if (invalid.length > 0) {
      remainingCorrupted++;
      invalidServiceReferences.push({ postId: id, invalidIds: invalid });
    }

    if (mt.length > 59) {
      remainingOverlongMeta++;
      metaTitleLengths.push({ postId: id, length: mt.length, metaTitle: mt });
    }
  }

  console.log('\n[5/6] Verification Metrics:');
  console.log(`- Remaining Unlinked posts: ${remainingUnlinked} (MUST BE 0)`);
  console.log(`- Remaining Corrupted posts: ${remainingCorrupted} (MUST BE 0)`);
  console.log(`- Remaining Overlong metaTitles: ${remainingOverlongMeta} (MUST BE 0)`);

  if (invalidServiceReferences.length > 0) {
    console.error('ERROR: Found invalid service references:', invalidServiceReferences);
    throw new Error('Verification failed: invalid service references present in blogPosts.');
  }

  if (remainingUnlinked > 0) {
    throw new Error(`Verification failed: ${remainingUnlinked} posts still have empty relatedProducts.`);
  }

  if (remainingOverlongMeta > 0) {
    console.error('ERROR: Overlong metaTitles found:', metaTitleLengths);
    throw new Error(`Verification failed: ${remainingOverlongMeta} posts have metaTitle > 59 chars.`);
  }

  console.log('\n[6/6] Detailed Verification for Target Blog Posts:');
  console.log('-'.repeat(80));
  console.log('22 Unlinked Posts Check:');
  for (const id of Object.keys(UNLINKED_POST_UPDATES)) {
    const doc = postVerificationSnap.docs.find(d => d.id === id);
    if (!doc) throw new Error(`Missing post ${id}`);
    const data = doc.data();
    const titles = (data.relatedProducts || []).map((sid: string) => validServiceMap.get(sid)?.title);
    console.log(`  ✓ [${id}] "${data.title}" -> ${data.relatedProducts.length} services (${titles.join(', ')})`);
  }

  console.log('-'.repeat(80));
  console.log('2 Corrupted Posts Check:');
  for (const id of Object.keys(CORRUPTED_POST_REPAIRS)) {
    const doc = postVerificationSnap.docs.find(d => d.id === id);
    if (!doc) throw new Error(`Missing post ${id}`);
    const data = doc.data();
    const titles = (data.relatedProducts || []).map((sid: string) => validServiceMap.get(sid)?.title);
    console.log(`  ✓ [${id}] "${data.title}" -> ${data.relatedProducts.length} services (${titles.join(', ')})`);
  }

  console.log('-'.repeat(80));
  console.log('18 Optimized metaTitles Check:');
  for (const id of Object.keys(OVERLONG_METATITLE_OPTIMIZATIONS)) {
    const doc = postVerificationSnap.docs.find(d => d.id === id);
    if (!doc) throw new Error(`Missing post ${id}`);
    const data = doc.data();
    console.log(`  ✓ [${id}] (${data.metaTitle.length} chars) "${data.metaTitle}"`);
  }

  console.log('='.repeat(80));
  console.log('ALL R2 AUDIT, POPULATION, REPAIR, AND OPTIMIZATION TASKS COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(80));
}

// Allow direct CLI execution
if (require.main === module || process.argv[1]?.includes('audit-and-link-existing-blogs')) {
  runAuditAndLinking()
    .then(() => {
      console.log('\nExecution finished with status 0.');
      process.exit(0);
    })
    .catch(err => {
      console.error('\nExecution failed with error:', err);
      process.exit(1);
    });
}
