const moment = require('moment');

module.exports = {
    formatDate: function(date) {
        // Format the date to YYYY-MM-DD for HTML date input without UTC conversion
        return moment(date).format('YYYY-MM-DD');
    }
}