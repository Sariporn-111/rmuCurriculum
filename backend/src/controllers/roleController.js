import prisma from '../config/prisma.js'

export const getRoles = async () => {
    return await prisma.roles.findMany({
        orderBy: { role_id: 'asc' }
    })
}