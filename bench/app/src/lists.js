import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function listsForHousehold(id) {
  const { rows } = await pool.query('select * from lists where household_id = $1', [id]);
  return rows;
}
