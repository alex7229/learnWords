import 'babel-polyfill';
import Controller from './Controller/main'


$(document).ready(() => {
    let controller = new Controller();
    controller.listenButtons();
    controller.initLearnMachine();
});



