import pool from './db.js';

async function dumpSchema() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);

    const tables = {};
    for (const row of res.rows) {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push(`${row.column_name} (${row.data_type})`);
    }

    for (const [tableName, columns] of Object.entries(tables)) {
      console.log(`Table: ${tableName}`);
      columns.forEach(c => console.log(`  - ${c}`));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

dumpSchema();
