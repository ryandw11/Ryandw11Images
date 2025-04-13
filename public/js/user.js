/*
    Replace user id's with their usernames.
*/

let userMap = {};
window.addEventListener('load', () => {
    const usernames = document.querySelectorAll(".user-name-replace");
    for (let username of usernames) {
        const userID = username.textContent;
        if(userMap[userID] == null)
        {
            userMap[userID] = [];
        }
        userMap[userID].push(username);
        username.textContent = "Loading...";
    }

    for(let [userId, userElems] of Object.entries(userMap)) {
        fetch(`/api/v1/user/${userId}`).then(val => val.json()).then( data => {
            for(let elem of userElems)
            {
                elem.textContent = data.user_name;
            }
        });
    }
});