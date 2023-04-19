/**
 * Formatting script
 *
 * This script contains all the functions used to format the data scrapped from the Epitech Intranet.
 *
 * @link https://github.com/KalinkaGit
 * @file This files defines the formatting script for the extension.
 * @author Rémi GRIMAULT
 * @since 1.1.0
 * @version 1.1.0
 */

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
                start: activity.begin,
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
