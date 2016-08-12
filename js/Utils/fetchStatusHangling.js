/**
 * Created by tup1tsa on 11.08.2016.
 */
export default (response) => {
    if (response.status >= 200 && response.status < 300) {
        return response
    } else {
        const error = new Error(response.statusText);
        error.response = response;
        throw error
    }
}