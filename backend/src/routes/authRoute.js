import { Elysia, t } from 'elysia'
import { changePassword, getProfile, getUsers, login, logout, register, updateProfile } from '../controllers/authController'
import { isAuth } from '../middleware/authMiddleware'
import { allowRoles } from '../middleware/roleMiddleware'

export const authRoute = new Elysia()
    .post('/login', login)

    // ✅ register สำหรับอาจารย์เท่านั้น
    .post('/register', register, {
        body: t.Object({
            username: t.String(),
            password: t.String(),
            title: t.String(),
            first_name: t.String(),
            last_name: t.String(),
            email: t.String(),
        })
    })

    .get('/profile', getProfile, {
        beforeHandle: [isAuth]
    })
    .get('/users', getUsers, {
        beforeHandle: [isAuth, allowRoles(['admin'])]
    })
    .put('/profile', updateProfile)
    .put('/profile/password', changePassword)
    .post('/logout', logout)