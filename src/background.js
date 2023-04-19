/**
 * Background script
 *
 * This script is used to scrap data from Epitech Intranet
 *
 * @link https://github.com/KalinkaGit
 * @file This files defines the background script for the extension.
 * @author Rémi GRIMAULT
 * @since 1.0.0
 * @version 1.1.0
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

setInterval(ExecXP, 300000 / 5);
ExecXP();
