import axios from 'axios';

export async function getRequest(endpoint) {
  try {
    return {
      success: true,
      data: (
        await axios.get(
          `${process.env.VUE_APP_SERVER_BASE_URL}/admin/${endpoint}`
        )
      ).data,
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: e };
  }
}

export async function putRequest(endpoint, body) {
  try {
    return {
      success: true,
      response: (
        await axios.put(
          `${process.env.VUE_APP_SERVER_BASE_URL}/admin/${endpoint}`,
          body
        )
      ).data,
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: e };
  }
}
export async function deleteRequest(endpoint) {
  try {
    return {
      success: true,
      response: (
        await axios.delete(
          `${process.env.VUE_APP_SERVER_BASE_URL}/admin/${endpoint}`
        )
      ).data,
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: e };
  }
}

export async function postRequest(endpoint, body) {
  try {
    return {
      success: true,
      response: (
        await axios.post(
          `${process.env.VUE_APP_SERVER_BASE_URL}/admin/${endpoint}`,
          body
        )
      ).data,
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: e };
  }
}
