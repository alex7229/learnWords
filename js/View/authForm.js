/**
 * Created by tup1tsa on 12.08.2016.
 */
export function showRegistrationBlock () {
    hideAll();
    display(`.registration`);
}

export function showUserInfoBlock(profileName) {
    hideAll();
    document.getElementById('profileName').innerText = profileName;
    display('.profileData')
}

export function showNotification (text, color = 'black') {
    const elem = document.getElementsByClassName('auth notification');
    elem.innerHTML = `<p>${text}</p>`;
    elem.className = 'auth notification shown';
    elem.style.color = color;
}

export function hideNotification () {
    document.getElementsByClassName('auth notification').className = 'auth notification hidden'
}

export function showResetPasswordBlock () {
    hideAll();
    display(`.resetPassword`);
}

export function showLogin () {
    hideAll();
    display('.login')
}

export function showAuthForm () {
    document.getElementById('authentication').style.display = 'block'
}

function display(selectors) {
    document.querySelectorAll(selectors).forEach(elem => {
        const previousClassName = elem.className;
        elem.className = previousClassName.replace('hidden', 'shown');
    })
}

function hideAll () {
    document.querySelectorAll('.auth').forEach(elem => {
        const previousClassName = elem.className;
        elem.className = previousClassName.replace('shown', 'hidden');
    })
}