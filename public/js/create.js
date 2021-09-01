// The container for the upload box.
const container = document.getElementsByClassName('upload-box')[0];

// Stop the default events when the container is dragged over.
container.ondragover = container.ondropenter = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
};
// Get the parent node.
var parentNode = container.parentNode;

// Set the ondrop event for the container
container.ondrop = (evt) => {
    evt.preventDefault();

    var fileUploader = document.getElementById('files');
    let list = new DataTransfer();

    for (let file of fileUploader.files) {
        if (/\.(jpe?g|png|gif)$/i.test(file.name.trim())) list.items.add(file);
    }

    for (let file of evt.dataTransfer.files) {
        if (/\.(jpe?g|png|gif)$/i.test(file.name.trim())) list.items.add(file);
    }

    fileUploader.files = list.files;
    updateFileChange(fileUploader, document.getElementsByClassName('file-display')[0]);
};

// Get the uploader and set the onclik event.
parentNode.querySelector('.uploader').onclick = (evt) => {
    var fileUploader = document.getElementById('files');
    let tempUpload = document.createElement('input');
    tempUpload.type = 'file';
    tempUpload.setAttribute('multiple', 'multiple');
    tempUpload.click();
    tempUpload.onchange = () => {
        let list = new DataTransfer();
        for (let file of fileUploader.files) {
            list.items.add(file);
        }

        for (let file of tempUpload.files) {
            list.items.add(file);
        }
        fileUploader.files = list.files;
        updateFileChange(fileUploader, document.getElementsByClassName('file-display')[0]);
    };
};

/**
 * Update the list of files.
 *
 * @param {Element} fileUploader The file uploader
 * @param {Element} div The div.
 */
function updateFileChange(fileUploader, div) {
    div.innerHTML = '';
    let i = 0;
    for (let file of fileUploader.files) {
        let innerDiv = document.createElement('div');
        innerDiv.innerHTML = getFileCard(file.name, file, i);
        div.appendChild(innerDiv);
        i++;
    }

    if(i < 1) {
        div.innerHTML = "<p>No files selected!</p>";
    }
}

/**
 * Delete an image from the list of images in the file box.
 * @param {String} name The name of the image to remove.
 */
function deleteImage(name) {
    let fileUploader = document.getElementById('files');
    let list = new DataTransfer();
    let findFile = name;
    for (let file of fileUploader.files) {
        if (file.name == findFile) continue;
        list.items.add(file);
    }

    fileUploader.files = list.files;
    updateFileChange(fileUploader, document.getElementsByClassName('file-display')[0]);
}

/**
 * Create a file card for a selected image.
 * @param {String} name The name of the selected image.
 * @param {File} file The file.
 * @param {Number} i The index.
 * @returns A String with the html content.
 */
function getFileCard(name, file, i) {
    let url = URL.createObjectURL(file);
    return `
    <div class="card m-3" style="width: 20rem;">
            <img class="card-img-top" style="max-height: 15rem" src="${url}" alt="Card image cap">
            <div class="card-body">
                <h5 class="card-title">${name}</h5>
                <label for="name[${i}]">Name:</label>
                <input type="text" class="form-control login-input" name="name[${i}]" id="name${i}"
                    value="Untitled (${i})" />
                <label for="caption[${i}]">Caption:</label>
                <input type="text" class="form-control login-input" name="caption[${i}]" id="cap${i}"
                    placeholder="Caption..." />
                <div class="form-check">
                    <input class="form-check-input" name="unlistedImage[${i}]" type="checkbox" value="unlistedImg${i}" id="unlistedImg[${i}]">
                    <label class="form-check-label" for="unlistedImg[${i}]">
                        Unlisted Image
                    </label>
                </div>
                <a onclick="deleteImage('${name}')" id="" class="card-link text-danger">Delete</a>
            </div>
        </div>
    `;
}

/**
 *
 * Validator.
 * Check the validation of the form.
 *
 */
window.addEventListener('load', () => {
    var form = document.getElementById('upload-image');
    form.addEventListener(
        'submit',
        (evt) => {
            checkValidity();
            console.log(form.checkValidity());
            if (form.checkValidity() === false) {
                evt.preventDefault();
                evt.stopPropagation();
            }
            form.classList.add('was-validated');
        },
        false
    );
});

function checkValidity() {
    for (let txt of document.getElementsByClassName('invalid-feedback')) {
        txt.innerHTML = '';
        document.querySelector('#upload-image>.invalid-feedback').style.display = 'none';
    }
    checkImageValidity();
}

function checkImageValidity() {
    let file = document.querySelector('#upload-image>#files');
    if (file.files.length < 1) {
        document.querySelector('#upload-image>.invalid-feedback').innerHTML = 'Please upload at least one file!';
        document.querySelector('#upload-image>.invalid-feedback').style.display = 'block';
        file.setCustomValidity('Please upload at least one file!');
        return;
    }

    if (file.files.length > 12) {
        document.querySelector('#upload-image>.invalid-feedback').innerHTML = 'Image limit reached! Please only upload 12 images at a time!';
        document.querySelector('#upload-image>.invalid-feedback').style.display = 'block';
        file.setCustomValidity('Image limit reached! Please only upload 12 images at a time!');
        return;
    }

    for (let f of file.files) {
        if (!/\.(jpe?g|png|gif)$/i.test(f.name.trim())) {
            document.querySelector('#upload-image>.invalid-feedback').innerHTML = 'A file you uploaded is not an image!';
            document.querySelector('#upload-image>.invalid-feedback').style.display = 'block';
            file.setCustomValidity('A file you uploaded is not an image!');
            return;
        }
    }
    file.setCustomValidity();
    file.classList.replace('is-invalid', '');
    file.classList += 'is-valid';
    document.querySelector('#upload-image>.invalid-feedback').innerHTML = '';
    document.querySelector('#upload-image>.invalid-feedback').style.display = 'none';
}
