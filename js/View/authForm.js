/**
 * Created by tup1tsa on 12.08.2016.
 */
export function showRegistrationBlock () {
    document.querySelector('#authDefault div, #profileData, #authentication .notification').style.display = 'none';
    document.getElementById('registrationBlock').style.display = 'block'
}

export function showUserInfoBlock(profileName) {
    hide(['#authDefault div','#authentication .notification', '#registrationBLock']);
    display(['#profileData']);
    document.getElementById('profileName').innerText = profileName
}

export function showNotification (text, color = 'black') {
    const elem = document.querySelector('#authentication .notification');
    elem.innerHTML = `<p>${text}</p>`;
    elem.style.display = 'block';
    elem.style.color = color;
}

function display(selectors) {
    selectors.map(selector => {
        document.querySelector(selector).style.display = 'block'
    })
}

function hide (selectors) {
    selectors.map(selector => {
        console.log(selector);
        document.querySelector(selector).style.display = 'none'
    })
}