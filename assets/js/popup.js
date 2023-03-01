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

$(document).ready(() => {
    function UpdatePopup(user, xp, calendar) {
        let progress = xp / user.max_xp * 100;

        $("#profile-picture").attr("src", "https://intra.epitech.eu" + user.picture);
        $("#name").html(user.firstname + " " + user.lastname);
        $("#GPA").html(user.gpa + "/4.0 GPA");
        $("#label-xp").html(xp + "/" + user.max_xp + "XP");
        $("#xp-progress").css("width", progress + "%");
        $("#email").html(user.email);
        $("#credits").html(user.credits + "/" + user.max_credits + " Credits");
        $("#credits-acquired").html(Math.trunc(xp / 10) + " Credits acquired");
        $("preloader").remove();
        AddCalendarNextEvents(calendar);
        AddCalendarPastEvents(calendar);
    }

    chrome.runtime.sendMessage({action: "update"}, (response) => {
        UpdatePopup(response.user, response.xp, response.calendar);
    });

    setInterval(() => {
        chrome.runtime.sendMessage({action: "update"}, (response) => {
            UpdatePopup(response.user, response.xp, response.calendar);
        });
    }, 60000);

    setTimeout(() => {
        if ($("preloader"))
            $("#msg").show();
    }, 1 * 1000 * 10);
});
