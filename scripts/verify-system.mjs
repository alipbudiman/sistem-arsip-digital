import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- STARTING AUTOMATED END-TO-END SYSTEM VERIFICATION ---');

  // 1. Check Landing Page
  console.log('1. Checking Landing Page...');
  const landingRes = await fetch(`${BASE_URL}/`);
  assert.strictEqual(landingRes.status, 200, 'Landing page should return 200');
  const landingHtml = await landingRes.text();
  assert.ok(landingHtml.includes('Kantor DPD RI'), 'Landing page should contain Kantor DPD RI');
  assert.ok(landingHtml.includes('Login') || landingHtml.includes('Masuk'), 'Landing page should contain Login button');
  console.log('✓ Task 1 (Landing page & Login button) verified.');

  // 2. Register New User -> Must be Pending
  console.log('2. Testing Registration with Pending Status...');
  const testUsername = `petugas_test_${Date.now()}`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      password: 'PetugasPass123!',
      nama_lengkap: 'Petugas Arsip Uji Coba',
    }),
  });
  assert.strictEqual(regRes.status, 201, 'Registration should return 201');
  const regData = await regRes.json();
  assert.ok(regData.message.includes('PENDING'), 'Registration message must mention PENDING');
  const newUserId = regData.userId;
  console.log(`✓ Registration created account with ID ${newUserId} and status 'pending'.`);

  // 3. Pending Account Login Attempt -> Must be BLOCKED
  console.log('3. Testing Login Gate for Pending Account...');
  const blockedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      password: 'PetugasPass123!',
    }),
  });
  assert.strictEqual(blockedLoginRes.status, 403, 'Pending user login MUST be blocked with 403');
  const blockedData = await blockedLoginRes.json();
  assert.strictEqual(blockedData.isPending, true, 'isPending flag must be true');
  console.log('✓ Pending account login blocked as required.');

  // 4. Master Admin Login (Seeded by seed_admin.py)
  console.log('4. Logging in as Master Admin...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'AdminPassword123!',
    }),
  });
  assert.strictEqual(adminLoginRes.status, 200, 'Admin login should succeed');
  const adminCookie = adminLoginRes.headers.get('set-cookie');
  assert.ok(adminCookie, 'Session cookie must be present');
  console.log('✓ Master Admin login successful and session cookie received.');

  // 5. User Management: Confirm Pending User
  console.log('5. Confirming Pending Account via Admin API...');
  const confirmRes = await fetch(`${BASE_URL}/api/users/${newUserId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: adminCookie,
    },
    body: JSON.stringify({ status: 'confirmed' }),
  });
  assert.strictEqual(confirmRes.status, 200, 'Admin should confirm user successfully');
  console.log('✓ Account confirmed and activated by Administrator.');

  // 6. Login as now-confirmed Petugas
  console.log('6. Logging in with Activated Petugas Account...');
  const confirmedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      password: 'PetugasPass123!',
    }),
  });
  assert.strictEqual(confirmedLoginRes.status, 200, 'Confirmed user should now log in successfully');
  const userCookie = confirmedLoginRes.headers.get('set-cookie');
  console.log('✓ Activated user logged in successfully.');

  // 7. Role Upgrade Test (Task 7 requirement)
  console.log('7. Testing Upgrading user account to admin...');
  const upgradeRes = await fetch(`${BASE_URL}/api/users/${newUserId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: adminCookie,
    },
    body: JSON.stringify({ role: 'admin' }),
  });
  assert.strictEqual(upgradeRes.status, 200, 'Admin upgrade should succeed');
  console.log('✓ User upgraded to Admin successfully.');

  // 8. Task 4: Archive Input with GridFS
  console.log('8. Testing Archive Input with GridFS upload...');
  const sampleFileContent = Buffer.from('%PDF-1.4 DPD RI SUMBAR DIGITAL ARCHIVE TEST BINARY %EOF');
  const formData = new FormData();
  formData.append('kepada', 'Gubernur Provinsi Sumatera Barat');
  formData.append('perihal', 'Koordinasi Pengawasan & Pengarsipan Digital Daerah');
  formData.append('nomor_surat', `001/DPD-SB/IX/${Date.now().toString().slice(-4)}`);
  formData.append('tanggal_surat', '2026-09-08');
  formData.append('jenis_arsip', 'Surat keluar');
  formData.append('keterangan', 'Arsip koordinasi resmi disimpan langsung di MongoDB GridFS');
  
  const blob = new Blob([sampleFileContent], { type: 'application/pdf' });
  formData.append('file', blob, 'surat_koordinasi_dpd.pdf');

  const uploadRes = await fetch(`${BASE_URL}/api/archives`, {
    method: 'POST',
    headers: {
      cookie: userCookie,
    },
    body: formData,
  });

  assert.strictEqual(uploadRes.status, 201, 'Archive upload should return 201');
  const uploadData = await uploadRes.json();
  const createdArchiveId = uploadData.id;
  assert.ok(uploadData.archive.data, 'data field (GridFS ObjectId) must exist');
  assert.strictEqual(uploadData.archive.jenis_arsip, 'Surat keluar', 'jenis_arsip must match verbatim enum');
  console.log(`✓ Archive created with ID ${createdArchiveId} and GridFS file binary.`);

  // Also create a "Surat masuk" archive
  const suratMasukFormData = new FormData();
  suratMasukFormData.append('kepada', 'Ketua Kantor DPD RI Provinsi Sumatera Barat');
  suratMasukFormData.append('perihal', 'Undangan Rapat Kerja Bersama DPRD Provinsi Sumatera Barat');
  suratMasukFormData.append('nomor_surat', `090/DPRD-SB/IX/${Date.now().toString().slice(-4)}`);
  suratMasukFormData.append('tanggal_surat', '2026-09-08');
  suratMasukFormData.append('jenis_arsip', 'Surat masuk');
  suratMasukFormData.append('keterangan', 'Surat masuk resmi');
  suratMasukFormData.append('file', new Blob([Buffer.from('Sample Surat Masuk')], { type: 'application/pdf' }), 'undangan_dprd.pdf');

  const masukRes = await fetch(`${BASE_URL}/api/archives`, {
    method: 'POST',
    headers: { cookie: userCookie },
    body: suratMasukFormData,
  });
  assert.strictEqual(masukRes.status, 201, 'Surat masuk creation should succeed');
  console.log('✓ Surat masuk archive created successfully.');

  // 9. Task 3: Dashboard Stats Verification
  console.log('9. Verifying Dashboard Stats (Task 3)...');
  const statsRes = await fetch(`${BASE_URL}/api/dashboard/stats`, {
    headers: { cookie: adminCookie },
  });
  assert.strictEqual(statsRes.status, 200, 'Dashboard stats should return 200');
  const statsData = await statsRes.json();
  assert.ok(statsData.stats.totalArchives >= 2, 'Total archives should be >= 2');
  assert.ok(statsData.stats.totalSuratMasuk >= 1, 'Total surat masuk should be >= 1');
  assert.ok(statsData.stats.totalSuratKeluar >= 1, 'Total surat keluar should be >= 1');
  console.log(`✓ Dashboard Stats verified: Total=${statsData.stats.totalArchives}, Masuk=${statsData.stats.totalSuratMasuk}, Keluar=${statsData.stats.totalSuratKeluar}`);

  // 10. Task 5: Archive List, Search, Download & Pagination (max 20)
  console.log('10. Testing Archive List with Search, Download & Actions (Task 5)...');
  const searchRes = await fetch(`${BASE_URL}/api/archives?search=Gubernur&page=1&limit=20`, {
    headers: { cookie: adminCookie },
  });
  assert.strictEqual(searchRes.status, 200, 'Search should return 200');
  const searchData = await searchRes.json();
  assert.ok(searchData.items.length >= 1, 'Search by kepada should return matched records');
  assert.ok(searchData.pagination.limit <= 20, 'Pagination limit must be <= 20');

  // Test Download
  const downloadRes = await fetch(`${BASE_URL}/api/archives/${createdArchiveId}/download`, {
    headers: { cookie: adminCookie },
  });
  assert.strictEqual(downloadRes.status, 200, 'Download endpoint should return 200');
  const downloadedBytes = await downloadRes.arrayBuffer();
  assert.strictEqual(
    Buffer.from(downloadedBytes).toString(),
    sampleFileContent.toString(),
    'Downloaded binary content from GridFS must match exactly'
  );
  console.log('✓ GridFS binary download verified byte-for-byte.');

  // 11. Task 6: Reports Recap & Breakdown
  console.log('11. Testing Reports Recap & Breakdown (Task 6)...');
  const recapRes = await fetch(`${BASE_URL}/api/reports/recap?page=1&limit=20`, {
    headers: { cookie: adminCookie },
  });
  assert.strictEqual(recapRes.status, 200, 'Reports recap should return 200');
  const recapData = await recapRes.json();
  assert.ok(recapData.breakdown.totalAll >= 2, 'Total archives in recap should be >= 2');
  assert.ok(recapData.monthlyRecap.length >= 1, 'Monthly recap should have entries');
  assert.ok(recapData.yearlyRecap.length >= 1, 'Yearly recap should have entries');
  assert.ok(recapData.table.pagination.limit <= 20, 'Table pagination limit must be <= 20');
  console.log('✓ Reports recap, monthly/yearly aggregation, and breakdown verified.');

  console.log('\n========================================================');
  console.log('ALL TASKS 1 - 7 SUCCESSFULLY VERIFIED PROGRAMMATICALLY!');
  console.log('========================================================\n');
}

runTests().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
