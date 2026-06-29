import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/db'

const roleMap = {
    1: 'admin',
    2: 'officer',
    3: 'teacher'
}

export const login = async ({ body, set, cookie }) => {
    try {
        const { username, password } = body

        const result = await pool.query(`
            SELECT u.id, u.username, u.password_hash, u.status, 
                   u.first_name, u.last_name, r.role_name
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.username = $1
        `, [username])

        const user = result.rows[0]

        if (!user) {
            set.status = 400
            return { error: "User not found" }
        }

        const isMatch = await bcrypt.compare(password, user.password_hash)
        if (!isMatch) {
            set.status = 400
            return { error: "Wrong password" }
        }

        if (user.status === "inactive") {
            set.status = 403
            return { error: "บัญชีถูกระงับ" }
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role_name,
                first_name: user.first_name,
                last_name: user.last_name
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        cookie.token.set({
            value: token,
            httpOnly: true,
            maxAge: 60 * 60 * 24
        })

        return {
            message: "login success",
            role: user.role_name,
            first_name: user.first_name,
            last_name: user.last_name
        }

    } catch (error) {
        set.status = 500
        return { error: error.message }
    }
}

// ✅ REGISTER — สำหรับอาจารย์เท่านั้น (role_id = 3)
export const register = async ({ body, set }) => {
    try {
        const { username, password, title, first_name, last_name, email } = body

        // เช็ค username ซ้ำ
        const existUser = await pool.query(
            'SELECT id FROM users WHERE username = $1', [username]
        )
        if (existUser.rows.length > 0) {
            set.status = 400
            return { error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' }
        }

        // เช็ค email ซ้ำ
        const existEmail = await pool.query(
            'SELECT id FROM users WHERE email = $1', [email]
        )
        if (existEmail.rows.length > 0) {
            set.status = 400
            return { error: 'อีเมลนี้มีอยู่แล้ว' }
        }

        if (!password || password.length < 8) {
            set.status = 400
            return { error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }
        }

        const hashed = await bcrypt.hash(password, 10)

        // สร้าง user ด้วย role_id = 3 (teacher)
        const result = await pool.query(`
            INSERT INTO users (username, password_hash, title, first_name, last_name, email, role_id, status)
            VALUES ($1, $2, $3, $4, $5, $6, 3, 'active')
            RETURNING id, username, title, first_name, last_name, email
        `, [username, hashed, title, first_name, last_name, email])

        const newUser = result.rows[0]

        // ✅ สร้าง record ใน teachers อัตโนมัติ แล้วเชื่อม user_id
        await pool.query(`
            INSERT INTO teachers (user_id, employee_code, title_name, first_name_th, last_name_th, email, department_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            newUser.id,
            `EMP${newUser.id}`,
            title,
            first_name,
            last_name,
            email,
            body.department_id ? Number(body.department_id) : null  // ← เพิ่ม
        ]);

        return { message: 'ลงทะเบียนสำเร็จ', user: newUser }

    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}

export const getProfile = async ({ store, set }) => {
    const user = store.user;
    if (!user) {
        set.status = 401;
        return { error: 'Unauthorized' };
    }

    const result = await pool.query(
        `SELECT
            u.id,
            u.username,
            u.email,
            r.role_name,
            u.title,
            u.first_name,
            u.last_name,
            COALESCE(u.phone, t.phone) AS phone,
            u.created_at,
            u.updated_at
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         LEFT JOIN teachers t ON t.user_id = u.id
         WHERE u.id = $1`,
        [user.id]
    );

    return result.rows[0];
};

export const getUsers = async () => {
    const result = await pool.query(
        'SELECT id, username, email, role_id FROM users'
    )
    return result.rows
}

export const updateProfile = async ({ store, body, set }) => {
    const user = store.user;
    if (!user) { set.status = 401; return { error: 'Unauthorized' }; }

    try {
        const result = await pool.query(`
            UPDATE users SET
                title = $1,
                first_name = $2,
                last_name = $3,
                email = $4,
                phone = $5,
                updated_at = NOW()
            WHERE id = $6
            RETURNING id, title, first_name, last_name, email, phone, updated_at
        `, [body.title, body.first_name, body.last_name, body.email, body.phone || null, user.id]);

        await pool.query(`
            UPDATE teachers SET
                title_name = $1,
                first_name_th = $2,
                last_name_th = $3,
                email = $4,
                phone = $5,
                updated_at = NOW()
            WHERE user_id = $6
        `, [body.title, body.first_name, body.last_name, body.email, body.phone || null, user.id]);

        return result.rows[0];
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

export const changePassword = async ({ store, body, set }) => {
    const user = store.user;
    if (!user) { set.status = 401; return { error: 'Unauthorized' }; }

    try {
        const result = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1', [user.id]
        );

        const isMatch = await bcrypt.compare(body.current_password, result.rows[0].password_hash);
        if (!isMatch) { set.status = 400; return { error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }; }

        if (!body.new_password || body.new_password.length < 8) {
            set.status = 400;
            return { error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' };
        }

        const hashed = await bcrypt.hash(body.new_password, 10);
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [hashed, user.id]
        );

        return { message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};
export const logout = async ({ cookie }) => {

    cookie.token.set({
        value: '',
        maxAge: 0,
        path: '/',
    })

    return {
        message: 'Logout success'
    }
}
