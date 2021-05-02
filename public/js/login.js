window.addEventListener('load', () => {
    const url = new URL(location.href);
    const err = url.searchParams.get('err');
    const errorDoc = document.getElementById('signup-error');
    const loginErrorDoc = document.getElementById('login-error');
    if (err == null) return;
    switch (err) {
        case '1':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Invalid username!';
            errorDoc.style.display = 'block';
            break;
        case '2':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Username is too long!';
            errorDoc.style.display = 'block';
            break;
        case '3':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Username does not match requirements.';
            errorDoc.style.display = 'block';
            break;
        case '4':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Invalid password!';
            errorDoc.style.display = 'block';
            break;
        case '5':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Password is not long enough!';
            errorDoc.style.display = 'block';
            break;
        case '6':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Password does not meet requirements!';
            errorDoc.style.display = 'block';
            break;
        case '7':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Passwords do not match!';
            errorDoc.style.display = 'block';
            break;
        case '9':
            loginErrorDoc.getElementsByTagName('span')[0].textContent = 'Username does not exist.';
            loginErrorDoc.style.display = 'block';
            break;
        case '10':
            loginErrorDoc.getElementsByTagName('span')[0].textContent = 'Your password is incorrect.';
            loginErrorDoc.style.display = 'block';
            break;
        case '11':
                loginErrorDoc.getElementsByTagName('span')[0].textContent = 'Captcha failed. Please try again later.';
                loginErrorDoc.style.display = 'block';
                break;
    }
});

window.addEventListener('load', () => {
    const url = new URL(location.href);
    const err = url.searchParams.get('suc');
    const errorDoc = document.getElementById('login-success');
    if (err == null) return;
    switch (err) {
        case '1':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Successfully logged out!';
            errorDoc.style.display = 'block';
            break;
        case '2':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Account was sucessfully deleted.';
            errorDoc.style.display = 'block';
            break;
    }
});
