/*
    Replace user id's with their usernames.
*/
window.addEventListener('load', () => {
    const usernames = document.querySelectorAll(".user-name-replace");
    for (let username of usernames) {
        const userID = username.textContent;
        fetch(`/api/v1/user/${userID}`).then(val => val.json()).then( data => {
            username.textContent = data.user_name;
        });
    }
});