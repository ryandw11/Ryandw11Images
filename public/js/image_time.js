// Convert time from the database to a nice human readable form.

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Detect if the browser is IOS.
function isIOS() {
    return (
        ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
        // iPad on iOS 13 detection
        (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    );
}

function getTimeInHours(date) {
    if(date.getHours() == 0 ) return 12;
    if(date.getHours() < 13) return date.getHours();
    return date.getHours() - 12;
}

function getAMPM(date) {
    if(date.getHours() < 13) return "AM";
    return "PM";
}

if (!isIOS()) {
    const newsTime = document.getElementsByClassName('time');
    for (let time of newsTime) {
        let dtxt = time.textContent;
        let date = new Date(dtxt);
        if (date.getDate() == undefined || isNaN(date.getDate())) continue;
        time.textContent = months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear() + "  " + getTimeInHours(date) + ":" + (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds()) + " " + getAMPM(date);
    }
}