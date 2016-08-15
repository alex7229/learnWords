/**
 * Created by tup1tsa on 12.08.2016.
 */
export function showRegistrationBlock () {
    hideAll();
    display(['#authDefault', '#loginBlock', '#passwordBlock', '#registration']);
}

export function showUserInfoBlock(profileName) {
    hideAll();
    document.getElementById('profileName').innerText = profileName;
    display(['profileData'])
}

export function showNotification (text, color = 'black') {
    const elem = document.querySelector('#authentication .notification');
    elem.innerHTML = `<p>${text}</p>`;
    elem.style.display = 'block';
    elem.style.color = color;
}

export function showLogin () {
    hideAll();
    display(['#loginBlock', '#passwordBlock', '#buttonsBlock', '#authDefault'])
}

export function logOut () {
    display(['#authDefault', '#authDefault div']);
    hide(['#registration', '#profileData', '#authentication .notification'])
}

function display(...selectors) {
    document.querySelectorAll(selectors).style.display = 'block'
}

function hide (...selectors) {
    document.querySelectorAll(selectors).style.display = 'none'
}

export function hideAll () {
    document.getElementsByClassName('auth').style.display = 'none'
}