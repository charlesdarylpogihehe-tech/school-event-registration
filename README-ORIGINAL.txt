SCHOOL EVENT REGISTRATION AND MANAGEMENT SYSTEM
================================================

TECHNOLOGY
- HTML/CSS
- PHP
- MySQL
- XAMPP
- Apache

FEATURES
1. Student account registration and login
2. Student can view upcoming school events
3. Student can register for an event
4. Student can cancel participation
5. Admin can create, edit, and delete events
6. Admin can view registered participants
7. Event capacity is checked
8. Duplicate registration is prevented

INSTALLATION IN XAMPP
---------------------
1. Install XAMPP.
2. Open XAMPP Control Panel.
3. Start Apache and MySQL.
4. Copy the folder "school_event_registration_management_system" into:
   C:\xampp\htdocs\
5. Open:
   http://localhost/phpmyadmin
6. Create/import the database:
   - Click Import
   - Select database.sql from this project
   - Click Go
7. Open the website:
   http://localhost/school_event_registration_management_system/

ADMIN LOGIN
-----------
Email: admin@school.local
Password: admin123

IF ADMIN LOGIN DOES NOT WORK
----------------------------
If you imported an older copy of database.sql before the password hash was corrected:
1. Open http://localhost/phpmyadmin
2. Select the database "school_event_db"
3. Click the SQL tab.
4. Paste the contents of admin_login_fix.sql.
5. Click Go.
6. Log in again using:
   Email: admin@school.local
   Password: admin123


STUDENT LOGIN
-------------
Create a student account using the Student Registration page.

IMPORTANT
---------
If your MySQL root account has a password, edit:
config/db.php
and set:
$pass = "YOUR_MYSQL_PASSWORD";

If the website says database connection failed:
- Make sure MySQL is running in XAMPP.
- Make sure database.sql was imported.
- Check config/db.php.

PROJECT STRUCTURE
-----------------
index.php                  Main public page
login.php                  Login
register.php               Student registration
logout.php                 Logout
database.sql               MySQL database
config/db.php              Database connection
config/auth.php            Login/authentication helpers
student/                   Student pages
admin/                     Administrator pages
assets/style.css           Website styling

DESIGN UPDATE
-------------
The homepage uses an original university-inspired blue/navy and gold theme, campus-style hero banner, event cards, and responsive navigation. This is a student project, not an official University of Eastern Pangasinan website or endorsement.

BACKGROUND FIX: The main page background is assets/uep-campus.jpg with a maroon gradient overlay. The UEP emblem is assets/uep-seal.jpg. If replacing files manually, replace assets/style.css and retain both images in assets/.


DESIGN UPDATE
This package includes the UEP campus photo background, UEP emblem image, and a unified maroon/gold button design for navigation, forms, event actions, and admin pages.

Images are stored in assets/uep-campus.jpg and assets/uep-seal.jpg. Keep those files in the assets folder.
