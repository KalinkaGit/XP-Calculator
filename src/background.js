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

const Limits = {
    organization: {
        "Talk": 6,
        "Workshop": 3,
        "Hackathon": Infinity
    },
    participation: {
        "Talk": 15,
        "Workshop": 10,
        "Hackathon": Infinity,
        "Experience": 8
    }
}

const XP = {
    positive: {
        participation: {
            "Talk": 1,
            "Workshop": 2,
            "Hackathon": 6,
            "Experience": 3
        },
        organization: {
            "Talk": 4,
            "Workshop": 7,
            "Hackathon": 15,
            "Experience": 0
        }
    },
    negative: {
        participation: {
            "Talk": -1,
            "Workshop": -2,
            "Hackathon": -6,
            "Experience": -3
        },
        organization: {
            "Talk": -6,
            "Workshop": -10,
            "Hackathon": -20,
            "Experience": 0
        }
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
                                console.log(data);
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

function FormatCalendar(data) {
    let calendar = [];

    for (let i = 0; i < data.length; i++) {
        let activities = data[i].activites;

        for (let j = 0; j < activities.length; j++) {
            if (activities[j].events.length == 0)
                continue;

            let activity = activities[j].events[0];

            if (!activity.already_register)
                continue;

            let event = {
                registered: activity.user_status ? activity.user_status : "registered",
                type: activities[j].type_title,
                start: activities[j].start,
                end: activities[j].end,
                title: activities[j].title,
                room: activity.location,
                assistants: activity.assistants
            }

            calendar.push(event);
        }
    }

    calendar.sort((a, b) => {
        let dateA = new Date(a.start);
        let dateB = new Date(b.start);
        
        return (dateA - dateB);
    });

    calendar = calendar.reverse();

    return (calendar);
}

function CalculateXP(calendar, email) {
    let xp = 0;

    let organization = {
        "Talk": 0,
        "Workshop": 0,
        "Hackathon": 0
    };

    let participation = {
        "Talk": 0,
        "Workshop": 0,
        "Hackathon": 0,
        "Experience": 0
    };

    for (let i = 0; i < calendar.length; i++) {
        let isOrganizer = false;

        for (let j = 0; j < calendar[i].assistants.length; j++) {
            if (calendar[i].assistants[j].login == email) {
                isOrganizer = true;
                break;
            }
        }

        if (calendar[i].registered != "absent") {
            if (isOrganizer) {
                if (organization[calendar[i].type] < Limits.organization[calendar[i].type]) {
                    xp += XP.positive.organization[calendar[i].type];
                    organization[calendar[i].type]++;
                }
            } else {
                if (participation[calendar[i].type] < Limits.participation[calendar[i].type]) {
                    xp += XP.positive.participation[calendar[i].type];
                    participation[calendar[i].type]++;
                }
            }
        } else {
            if (isOrganizer) {
                if (organization[calendar[i].type] < Limits.organization[calendar[i].type]) {
                    xp += XP.negative.organization[calendar[i].type];
                    organization[calendar[i].type]++;
                }
            } else {
                if (participation[calendar[i].type] < Limits.participation[calendar[i].type]) {
                    xp += XP.negative.participation[calendar[i].type];
                    participation[calendar[i].type]++;
                }
            }
        }
    }

    return (xp);
}

async function ExecXP() {
    let userData = await GetUserData();
    tmp_save.user = FormatUser(userData);

    let userCalendar = await GetUserCalendar(tmp_save.user.scolaryear, tmp_save.user.location);

    tmp_save.calendar = FormatCalendar(userCalendar);
    tmp_save.xp = CalculateXP(tmp_save.calendar, tmp_save.user.email);

    if (tmp_save.xp > tmp_save.user.max_xp)
        tmp_save.xp = tmp_save.user.max_xp;

    chrome.storage.local.set({
        user: tmp_save.user,
        xp: tmp_save.xp,
        calendar: tmp_save.calendar
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "get-user") {
        if (tmp_save.user != null) {
            chrome.runtime.sendMessage({
                action: "user",
                user: tmp_save.user
            });
        } else {
            chrome.storage.local.get(["user"], async function(result) {
                if (result.user == null || result.xp == null || result.calendar == null) {
                    await ExecXP();
                    chrome.runtime.sendMessage({
                        action: "user",
                        user: tmp_save.user
                    });
                } else {
                    chrome.runtime.sendMessage({
                        action: "user",
                        user: result.user
                    });
                }
            });
        }
    } else if (request.action == "get-calendar") {
        if (tmp_save.user != null && tmp_save.calendar != null && tmp_save.xp != null) {
            chrome.runtime.sendMessage({
                action: "calendar",
                calendar: tmp_save.calendar,
                xp: tmp_save.xp,
                max_xp: tmp_save.user.max_xp
            });
        } else {
            chrome.storage.local.get(["user", "calendar", "xp"], async function(result) {
                if (result.user == null || result.calendar == null || result.xp == null) {
                    await ExecXP();
                    chrome.runtime.sendMessage({
                        action: "calendar",
                        calendar: tmp_save.calendar,
                        xp: tmp_save.xp,
                        max_xp: tmp_save.user.max_xp
                    });
                } else {
                    chrome.runtime.sendMessage({
                        action: "calendar",
                        calendar: result.calendar,
                        xp: result.xp,
                        max_xp: result.user.max_xp
                    });
                }
            });
        }
    }
});

setInterval(ExecXP, 1 * 60 * 1000 * 1);
ExecXP();
