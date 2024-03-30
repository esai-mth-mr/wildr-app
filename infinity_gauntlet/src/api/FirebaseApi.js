import {getRequest} from "@/api/common";

const base = 'firebase/'
export async function getAllFirebaseUsers() {
    return await getRequest(base+ "all-users")
}