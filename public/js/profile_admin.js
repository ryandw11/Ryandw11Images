// This is meant to be used for admins on another person's profile.

window.addEventListener('load', () => {
    const url = new URL(location.href);
    const err = url.searchParams.get('err');
    const errorDoc = document.getElementById('delete-account-error');
    if (err == null) return;
    $('#deleteAccount').modal('show');
    switch (err) {
        case '1':
            errorDoc.getElementsByTagName('span')[0].textContent = 'The confirmation code is incorrect.';
            errorDoc.style.display = 'block';
            break;
    }
});