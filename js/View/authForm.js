/**
 * Created by tup1tsa on 12.08.2016.
 */
export function showRegistrationBlock () {
    hideAll();
    display('registration')
}

export function showUserInfoBlock(profileName) {
    hideAll();
    document.getElementById('profileName').innerText = profileName;
    display('profileData')
}

export function showNotification (text, color = 'black') {
    let elem = document.getElementById('authNotification');
    elem.innerHTML = `<p>${text}</p>`;
    elem.style.color = color;
    elem.style.display = 'block'
}

export function hideNotification () {
    document.getElementById('authNotification').style.display = 'none'
}

export function showResetPasswordBlock () {
    hideAll();
    display(`resetPassword`);
}

export function showLogin () {
    hideAll();
    display('authDefault')
}

export function showAuthForm () {
    document.getElementById('authentication').style.display = 'block'
}

function display(id) {
    document.getElementById(id).style.display = 'block'
}

function hideAll () {
    document.querySelectorAll('.auth').forEach(elem => {
        elem.style.display='none'
    })
}