/**
 * File: master.js
 * @author Sorio
 * @version 0.0.2
 *
 */
//Burger button menu for phone-sized pages
const burgerIcon = document.querySelector('#burger');
const navbarMenu = document.querySelector('#nav-links');

burgerIcon.addEventListener('click',()=> {
    navbarMenu.classList.toggle('is-active')
});


//to toggle username
const userPseudo = document.querySelector('#userPseudo');
const navbarMenu1 = document.querySelector('#nav-links1');

userPseudo.addEventListener('click',()=> {
    navbarMenu1.classList.toggle('is-active')
});