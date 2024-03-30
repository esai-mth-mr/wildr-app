import {deleteRequest, getRequest, putRequest} from "@/api/common";
const base = 'category-interests/'
export async function getCategories() {
    return await getRequest(base)
}
export async function addCategory(category) {
    return await putRequest(base, {category})
}
export async function deleteCategory(category) {
    return await deleteRequest(base+ `/${category}`)
}