window.addEventListener('load', () => {
    const url = new URL(location.href);
    const err = url.searchParams.get('err');
    const errorDoc = document.getElementById('change-password-error');
    if (err == null) return;
    $('#changePassword').modal('show');
    switch (err) {
        case '1':
            errorDoc.getElementsByTagName('span')[0].textContent = 'The current password you entered in is invalid.';
            errorDoc.style.display = 'block';
            break;
        case '4':
            errorDoc.getElementsByTagName('span')[0].textContent = 'New password is invalid!';
            errorDoc.style.display = 'block';
            break;
        case '5':
            errorDoc.getElementsByTagName('span')[0].textContent = 'New password is not long enough.';
            errorDoc.style.display = 'block';
            break;
        case '6':
            errorDoc.getElementsByTagName('span')[0].textContent = 'New password does not meet requirements!';
            errorDoc.style.display = 'block';
            break;
        case '7':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Passwords do not match!';
            errorDoc.style.display = 'block';
            break;
        case '10':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Incorrect current password!';
            errorDoc.style.display = 'block';
            break;
    }
});

window.addEventListener('load', () => {
    const url = new URL(location.href);
    const err = url.searchParams.get('suc');
    const errorDoc = document.getElementById('change-password-success');
    if (err == null) return;
    switch (err) {
        case '1':
            errorDoc.getElementsByTagName('span')[0].textContent =
                'Password successfully changed. Consider logging out and back in again to update your session.';
            errorDoc.style.display = 'block';
            break;
    }
});

window.addEventListener('load', () => {
    const url = new URL(location.href);
    const err = url.searchParams.get('derr');
    const errorDoc = document.getElementById('delete-account-error');
    if (err == null) return;
    $('#deleteAccount').modal('show');
    switch (err) {
        case '1':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Invalid Password.';
            errorDoc.style.display = 'block';
            break;
        case '2':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Incorrect Password.';
            errorDoc.style.display = 'block';
            break;
    }
});
