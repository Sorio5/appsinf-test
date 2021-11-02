/**
 * File: master.js
 * @author: Sorio
 * @version: 0.0.1
 *
 */
//Burger button menu for phone-sized pages
const burgerIcon = document.querySelector('#burger');
const navbarMenu = document.querySelector('#nav-links');

burgerIcon.addEventListener('click',()=> {
    navbarMenu.classList.toggle('is-active')
});