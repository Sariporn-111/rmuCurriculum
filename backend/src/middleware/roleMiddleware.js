export const allowRoles = (roles) => {

    return ({ store, set }) => {

        const roleName = store.user?.roles?.role_name

        if (!roles.includes(roleName)) {

            set.status = 403

            return {
                error: 'Forbidden'
            }
        }
    }
}