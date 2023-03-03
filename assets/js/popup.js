function AddCalendarNextEvents(calendar) {
    let count = 0;
    $("#next-activities").html('<span class="title">Next activities</span><hr/>');
    for (let i = 0; i < calendar.length; i++) {
        if (calendar[i].registered == "registered") {
            count++;
            $("#next-activities").append(`
                <div class="event">
                    <div class="event-title">
                        <div class="event-status registered"></div>
                        <div class="event-title-text">${calendar[i].title}</div>
                        <div class="event-title-room">Room: ${calendar[i].room}</div>
                        <div class="event-title-date">${calendar[i].start}</div>
                    </div>
                </div>
            `);
        }
    }
    if (count == 0)
        $("#next-activities").append("No activities planned");
}

function AddCalendarPastEvents(calendar) {
    let count = 0;
    $("#past-activities").html('<span class="title">Past activities</span><hr/>');
    for (let i = 0; i < calendar.length; i++) {
        if (calendar[i].registered != "registered") {
            count++;
            $("#past-activities").append(`
                <div class="event">
                    <div class="event-title">
                        <div class="event-title-text">${calendar[i].title}</div>
                        <div class="event-title-room">Room: ${calendar[i].room}</div>
                        <div class="event-title-date">${calendar[i].start}</div>
                        <div class="event-status ${calendar[i].registered}"></div>
                    </div>
                </div>
            `);
        }
    }
    if (count == 0)
        $("#past-activities").append("No previous activities");
    $("#past-activities").append("<div id='ihih'></div>");
}

function UpdateUser(user) {
    $("#profile-picture").attr("src", "https://intra.epitech.eu" + user.picture);
    $("#name").html(user.firstname + " " + user.lastname);
    $("#GPA").html(user.gpa + "/4.0 GPA");
    $("#label-xp").html("-/" + user.max_xp + "XP");
    $("#xp-progress").css("width", "0%");
    $("#email").html(user.email);
    $("#credits").html(user.credits + "/" + user.max_credits + " Credits");
    $("#credits-acquired").html("- Credits acquired");
    if ($("preloader"))
        $("preloader").remove();
}

function UpdateXP(xp, max_xp) {
    let progress = xp / max_xp * 100;

    $("#xp-progress").css("width", progress + "%");
    $("#label-xp").html(xp + "/" + max_xp + "XP");
    $("#credits-acquired").html(Math.trunc(xp / 10) + " Credits acquired");
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action == "user") {
        UpdateUser(request.user);
    } else if (request.action == "calendar") {
        AddCalendarNextEvents(request.calendar);
        AddCalendarPastEvents(request.calendar);
        UpdateXP(request.xp, request.max_xp);
    }
});

$(document).ready(() => {
    chrome.runtime.sendMessage({action: "get-user"});

    chrome.runtime.sendMessage({action: "get-calendar"});

    setInterval(() => {
        chrome.runtime.sendMessage({action: "get-user"});
    
        chrome.runtime.sendMessage({action: "get-calendar"});
    }, 60000);

    setTimeout(() => {
        if ($("preloader"))
            $("#msg").show();
    }, 1 * 1000 * 10);
});
