// Script untuk buat hash password admin
// Jalankan: npx ts-node scripts/create-admin.ts

import bcrypt from 'bcryptjs'

async function main() {
  const password = 'Karyawan@123' // Ganti dengan password yang diinginkan
  const hash = await bcrypt.hash(password, 10)
  
  console.log('=== COPY SQL INI KE SUPABASE SQL EDITOR ===')
  console.log(`
UPDATE users 
SET password_hash = '${hash}'
WHERE email = 'karyawan@perusahaan.com';
  `)
  console.log('==========================================')
  console.log('Password:', password)
  console.log('Hash:', hash)
}

main()