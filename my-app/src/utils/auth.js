import { jwtDecode } from "jwt-decode";

export const getCurrentUser = () => {
    const token = document.cookie
        .split("; ")
        .find(row => row.startsWith("token="))
        ?.split("=")[1];

    if (!token) return null;

    try {
        return jwtDecode(token);
    } catch {
        return null;
    }
};