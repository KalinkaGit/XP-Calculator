/**
 * background-wrapper.js
 *
 * Wrapper for background script.
 *
 * @link https://github.com/KalinkaGit
 * @file Wrapper for background script.
 * @author Rémi GRIMAULT
 * @since 1.0.0
 * @version 1.0.0
 */

// Importing modules
try {
    importScripts("formatter.js");
    importScripts("scrapping.js");
    importScripts("background.js");
} catch (e) {
    console.error(e);
}
