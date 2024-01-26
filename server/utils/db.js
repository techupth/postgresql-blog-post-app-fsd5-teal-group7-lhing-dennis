// Creating PostgreSQL Client here
import * as pg from "pg";

const { Pool } = pg.default;
const pool = new Pool({
  connectionString: "postgresql://postgres:123456pg@localhost:5432/posts",
});

export { pool };
