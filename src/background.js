/**
 * Background script
 *
 * This script is used to scrap data from Epitech Intranet
 *
 * @link https://github.com/KalinkaGit
 * @file This files defines the background script for the extension.
 * @author Rémi GRIMAULT
 * @since 1.0.0
 * @version 1.0.0
 */

let tmp_save = {
    user: null,
    xp: null,
    calendar: null
}

const XP = {
    positive: {
        "Talk": 1,
        "Workshop": 2,
        "Experience": 3,
        "Hackathon": 6
    },
    negative: {
        "Talk": -1,
        "Workshop": -2,
        "Experience": -3,
        "Hackathon": -6
    }
};

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

function GetUserCalendar() {
    return new Promise((resolve, reject) => {
        fetch("https://intra.epitech.eu/planning/load?format=json&start=2022-11-30", {
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

function FormatUser(data) {
    let user = {
        firstname: data.firstname,
        lastname: data.lastname,
        gpa: data.gpa[0].gpa,
        email: data.login,
        year: data.studentyear,
        scolaryear: data.scolaryear,
        location: data.location,
        semester: data.semester,
        credits: data.credits,
        picture: data.picture,
        promo: data.promo,
        max_xp: data.semester < 3 ? 50 : 80,
        max_credits: 60 * data.studentyear
    }

    return (user);
}

function FormatCalendar(data)
{
    let calendar = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i].codemodule != "B-INN-000")
            continue;

        if (!data[i].event_registered)
            continue;

        let event = {
            region: data[i].instance_location,
            registered: data[i].event_registered,
            type: data[i].type_title,
            start: data[i].start,
            end: data[i].end,
            title: data[i].acti_title,
            room: data[i].room.code
        }

        calendar.push(event);
    }

    return (calendar);
}

function CalculateXP(calendar) {
    let xp = 0;

    for (let i = 0; i < calendar.length; i++) {
        if (calendar[i].registered != "absent") {
            if (calendar[i].type in XP.positive)
                xp += XP.positive[calendar[i].type];
        } else {
            if (calendar[i].type in XP.negative)
                xp += XP.negative[calendar[i].type];
        }
    }

    return (xp);
}

async function ExecXP() {
    let userData = await GetUserData();
    let userCalendar = await GetUserCalendar(userData);

    tmp_save.calendar = FormatCalendar(userCalendar);
    tmp_save.user = FormatUser(userData);
    tmp_save.xp = CalculateXP(tmp_save.calendar);

    if (tmp_save.xp > tmp_save.user.max_xp)
        tmp_save.xp = tmp_save.user.max_xp;

    chrome.storage.sync.set({
        user: tmp_save.user,
        xp: tmp_save.xp,
        calendar: tmp_save.calendar
    });
}

function CheckTmp() {
    if (tmp_save.user != null
        && tmp_save.xp != null
        && tmp_save.calendar != null) {
        return (true);
    } else {
        return (false);
    }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "update") {
        if (CheckTmp()) {
            sendResponse({
                user: tmp_save.user,
                xp: tmp_save.xp,
                calendar: tmp_save.calendar
            });
        } else {
            chrome.storage.sync.get(["user", "xp", "calendar"], async function(result) {
                if (result.user == null || result.xp == null || result.calendar == null) {
                    await ExecXP();
                    sendResponse({
                        user: tmp_save.user,
                        xp: tmp_save.xp,
                        calendar: tmp_save.calendar
                    });
                } else {
                    sendResponse({
                        user: result.user,
                        xp: result.xp,
                        calendar: result.calendar
                    });
                }
            });
        }
    }
});

setInterval(ExecXP, 1 * 60 * 1000 * 5);
ExecXP();
