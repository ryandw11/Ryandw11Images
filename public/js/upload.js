window.addEventListener('load', () => {
    const url = new URL(location.href);
    const err = url.searchParams.get('err');
    const errorDoc = document.getElementById('upload-error');
    if (err == null) return;
    switch (err) {
        case '1':
            errorDoc.getElementsByTagName('span')[0].textContent = 'No valid files were found. Please upload valid PNG, JPEG, or GIF files.';
            errorDoc.style.display = 'block';
            break;
        case '2':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Only 12 images can be uploaded at a time!';
            errorDoc.style.display = 'block';
            break;
        case '3':
            errorDoc.getElementsByTagName('span')[0].textContent = 'You must be logged in to upload images!';
            errorDoc.style.display = 'block';
            break;
        case '4':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Invalid submission. Please try again.';
            errorDoc.style.display = 'block';
            break;
        case '5':
            errorDoc.getElementsByTagName('span')[0].textContent = 'Captcha failed. Please try again later.';
            errorDoc.style.display = 'block';
            break;
    }
});

function onUploadSubmit(token) {
    document.getElementById('upload-image').submit();
}
