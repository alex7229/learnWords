/**
 * Created by tup1tsa on 12.08.2016.
 */
export function showRegistrationBlock () {
    document.querySelector('#authDefault div, #profileData, .notification').style.display = 'none';
    document.getElementById('registrationBlock').style.display = 'block'
}

export function showNotification (text) {
    const selector = '#authentication .notification';
    document.querySelector(selector).innerHTML = `<p>${text}</p>`;
    document.querySelector(selector).style.display = 'block'
}