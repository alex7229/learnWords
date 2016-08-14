/**
 * Created by tup1tsa on 11.08.2016.
 */
export default (response) => {
    if (response.status >= 200 && response.status < 300) {
        return response
    } else {
        return new Promise ((resolve, reject) => {
            const error = new Error(response.status);
            error.response = response;
            error.response.text()
                .then((text) => {
                    error.message = text;
                    reject(error)
                } )
        })
    }
}