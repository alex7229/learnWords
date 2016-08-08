/**
 * Created by tup1tsa on 08.08.2016.
 */
export default class {
    constructor () {
        
    }

    getToken () {
        const authData = this.findLocalAuthData();
        if (authData) {
            fetch('/auth', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    authData: JSON.stringify(authData)
                })
            })
                .then(response => {
                    console.log(response)
                })
        } else {
            throw new Error('U have not declared password or login')
        }
    }

    findLocalAuthData () {
        const name = localStorage.getItem('authName');
        const password = localStorage.getItem('authPassword');
        if (name && password) {
            return {
                name,
                password
            }
        }
    }
    
    
}
  