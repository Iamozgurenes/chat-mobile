require('dotenv').config();
const PocketBase = require('pocketbase/cjs');
const { MeiliSearch } = require('meilisearch');

const pb = new PocketBase(process.env.POCKETBASE_URL);

const meili = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST,
  apiKey: process.env.MEILISEARCH_API_KEY,
});

async function syncUsers() {
  try {
    console.log('🔐 PocketBase admin girişi yapılıyor...');
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_EMAIL,
      process.env.POCKETBASE_PASSWORD
    );

    const users = await pb.collection('users').getFullList();
    console.log(`👥 ${users.length} kullanıcı bulundu`);

    const formatted = users.map(user => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    }));

    const result = await meili.index('users').addDocuments(formatted);
    console.log('✅ Kullanıcılar Meilisearch\'e aktarıldı:', result);
  } catch (err) {
    console.error('🚫 Hata:', err.message || err);
  }
}

syncUsers();
