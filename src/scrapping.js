/**
 * Scrapping script
 *
 * This script contains all the functions used to scrap the Epitech Intranet.
 *
 * @link https://github.com/KalinkaGit
 * @file This files defines the scrapping script for the extension.
 * @author Rémi GRIMAULT
 * @since 1.1.0
 * @version 1.1.0
 */

function GetUserData() {
    return new Promise((resolve, reject) => {
        fetch("https://intra.epitech.eu/user/?format=json", {
            method: "GET",
            credentials: "include"
        }).then((response) => {
            if (!response.message) {
                response.json().then((data) => {
                    resolve(data);
                });
            } else {
                reject(false);
            }
        });
    });
}

function GetUserCalendar(year, campus) {
    campus = campus.split('/')[1];

    return new Promise((resolve, reject) => {
        fetch(`https://intra.epitech.eu/module/${year}/B-INN-000/${campus}-0-1/?format=json`, {
            method: "GET",
            credentials: "include"
        }).then((response) => {
            if (!response.message) {
                fetch(`https://intra.epitech.eu/module/${year}/B-INN-000/FR-0-1/?format=json`, {
                    method: "GET",
                    credentials: "include"
                }).then((response2) => {
                    if (!response2.message) {
                        response.json().then((data) => {
                            response2.json().then((data2) => {
                                resolve([data, data2]);
                            });
                        });
                    } else {
                        reject(false);
                    }
                });
            }
        });
    });
}
