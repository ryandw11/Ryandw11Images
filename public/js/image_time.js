// Convert time from the database to a nice human readable form.

const timestamps = document.getElementsByClassName('time');
const userLang = navigator.language || 'en-US';
for (let time of timestamps) {
    let dtxt = time.textContent;
    const safeTimestamp = dtxt.replace(' ', 'T'); // Safari is picky about date formats
    const date = new Date(safeTimestamp);
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: undefined };
    const formattedDate = date.toLocaleString(userLang, options);
    time.textContent = formattedDate;
}