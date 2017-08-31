module.exports = function (context, message) {
    var series = require('async/series');

    var google = require('googleapis');
    var googleAuth = require('google-auth-library');

    var calendar = google.calendar('v3');

    var client_email = process.env.client_email;
    var private_key = process.env.private_key;
    var user_address = 'igor@wrdsb.ca';

    private_key = private_key.split('\\n').join("\n");

    var calendar_to_read = message.calendarId;
    context.log('Read calendar ' + calendar_to_read);

    var calendar_read = {};

    var jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/calendar'],
        user_address
    );

    var params = {
        auth: jwtClient,
        alt: "json",
        calendarId: calendar_to_read
    };

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            context.log(err);
            return;
        }
        series([
            function readCalendar(readCalendarCallback) {
                calendar.calendars.get(params, function (err, result) {
                    if (err) {
                        readCalendarCallback(new Error(err));
                        return;
                    }
                    context.log(result);
                    readCalendarCallback(null, result);
                });
            }
        ],
            function (err, results) {
                if (err) {
                    context.done(err);
                } else {
                    calendar_read = results[0];
                    var topic_message = {
                        'function': 'calendar_read',
                        'calendarId': calendar_to_read,
                        'result': calendar_read
                    };
                    context.log(topic_message);
                    context.bindings.resultBlob = JSON.stringify(topic_message);
                    context.done(null, topic_message);
                }
            });
    });
};
