class UserRepository {
    async findById(pool, id) {
        const { rows } = await pool.query(
            'SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id = $1', [id]
        );
        return rows[0];
    }

    async findPublicById(pool, id) {
        const { rows } = await pool.query(
            'SELECT id, name, created_at FROM users WHERE id = $1', [id]
        );
        return rows[0];
    }

    async update(pool, id, { name, phone }) {
        const { rows } = await pool.query(
            'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = NOW() WHERE id = $3 RETURNING id, name, email, phone, created_at, updated_at', [name || null, phone || null, id]
        );
        return rows[0];
    }

    // We will add findByEmail, create, etc. here later for auth
}

export const userRepository = new UserRepository();