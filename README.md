# Ryandw11 Images
Ryandw11 Images is an image hosting website designed for myself. Ryandw11Images features a fully functioning user signup and login system.
Users can create an account and upload images. Once images are uploaded users can edit/delete their own images. Images are stored on the
server and can be accessed directly through the `img.ryandw11.com/raw/...` link. Users can also manage their account allowing them to
change their password and delete their account entirely. The website also contains an admin system to allow admins the ability to manage
images and users.  
  
For security reasons the signup feature of the website actually hosted on ryandw11.com is disabled.  
  
## Images
The main website:
![The main screen.](https://img.ryandw11.com/raw/o5ax4y7it.png)
![The image upload screen.](https://img.ryandw11.com/raw/o5azrtrfa.png)

## Details
Images are handled by mutler and the MIME type is checked before completely being uploaded.  
Image and user data are stored in a database using SQLite3. Passwords are hashed using bcrypt
before being stored in the database. Images are renamed when they are stored.

## Demonstration
Ryandw11 Images is hosted at https://img.ryandw11.com/. Unlike PortfolioCMS, there is no demo account to view
features when logged in. As stated above the signup feature is disabled on the website hosted on ryandw11.com.