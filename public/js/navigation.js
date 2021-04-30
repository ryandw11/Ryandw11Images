"use strict";

/*

    The javascript file for the navigation bar.
    Used of every page.

*/

// If the navigation bar is active
var active = false;

// If in mobile mode
var mobileNav = false;

// Add event listeners
window.addEventListener("load", init);
window.addEventListener("resize", res);

// Variables to store the navicon, lists, and the image of the nav icon.
var ul;
var navicon;
var imgNavIcon;

/**
 * When the page is loaded
 */
function init() {
    // Get the navigation list
    ul = document.getElementById("navigation");
    // get the navicons
    navicon = document.getElementById("navicon");
    // get the image of the nav icon.
    imgNavIcon = navicon.getElementsByTagName("img")[0];
    // If the width is less than 675 pixels.
    if (window.innerWidth < 675) {
        mobileMode();
    } else if (window.innerWidth > 675) {
        desktopMode();
    }
    // Add a click listener to the navicon
    navicon.addEventListener("click", onClick);
}

/**
 * When the navicon is clicked
 */
function onClick() {
    // If the nav is not active
    if (!active) {
        // Display it as active and display an animation
        ul.style.display = "block";
        imgNavIcon.className = "rotated";
        active = true;
    } else {
        // Remove the navicon.
        ul.style.display = "none";
        imgNavIcon.className = "";
        active = false;
    }
}

/**
 * When the page is resized
 * @param {Event} e 
 */
function res(e) {
    // if the mobilenav is not already on screen and has a width less than 675 pixels
    if (window.innerWidth < 675 && !mobileNav) {
        mobileMode();
    } else if (window.innerWidth > 675 && mobileNav) {
        desktopMode();
    }
}

/**
 * Put the nav bar into mobile mode
 */
function mobileMode() {
    // Set active to false and mobileNav to true.
    mobileNav = true;
    active = false;
    // Sets the display to none and the navicon to show.
    ul.style.display = "none";
    navicon.style.display = "block";
}

/**
 * Switch to desktop mode
 */
function desktopMode() {
    // Set everything back up to normal.
    mobileNav = false;
    active = false;
    ul.style.display = "";
    navicon.style.display = "none";
    imgNavIcon.className = "";
}