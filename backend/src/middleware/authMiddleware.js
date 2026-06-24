import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'

export const isAuth = async ({ cookie, set, store }) => {

    const token = cookie.token?.value

    if (!token) {
        set.status = 401
        return { error: 'Unauthorized' }
    }

    try {

        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET
        )

        const user = await prisma.users.findUnique({
            where: {
                id: payload.id
            },
            include: {
                roles: true
            }
        })

        if (!user) {
            set.status = 401
            return { error: 'User not found' }
        }

        if (user.status !== 'active') {
            set.status = 403
            return { error: 'บัญชีถูกระงับ' }
        }

        store.user = user

    } catch (err) {

        set.status = 401

        return {
            error: 'Invalid token'
        }
    }
}