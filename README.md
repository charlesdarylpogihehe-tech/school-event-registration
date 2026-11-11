# School Event Registration System (GitHub Pages + Supabase)

This is the static HTML/CSS/JavaScript migration of the original PHP/MySQL project.
PHP and MySQL are not used. GitHub Pages hosts the frontend; Supabase provides
authentication and the PostgreSQL database.

## 1. Create Supabase project
1. Visit https://supabase.com/ and create a project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Open `supabase-setup.sql` from this repository, copy all of it, paste it into a
   new SQL query, and click **Run**.
4. Open **Project Settings → API** (or **Data API**) and copy the Project URL and
   the `anon` / publishable public key. Do not use the `service_role` or secret key.

## 2. Connect this website to Supabase
1. Open `assets/js/config.js`.
2. Replace `https://YOUR-PROJECT-REF.supabase.co` with your Project URL.
3. Replace `YOUR_SUPABASE_ANON_PUBLIC_KEY` with your anon/publishable public key.
4. Save the file. The anon key is intended for browser use; database security is
   enforced by the Row Level Security policies in the SQL setup.

## 3. Configure email confirmation
For easiest classroom testing, in Supabase go to **Authentication → Providers → Email**.
You can turn off email confirmation for a demo. For a real deployment, keep email
confirmation enabled and configure your email provider / redirect URLs.

## 4. Create an administrator
1. Use the website's Student Sign Up page to create the account you want to use
   as administrator.
2. In Supabase open **SQL Editor** and run this command, replacing the email:
   `update public.profiles set role='admin' where email='your-admin-email@example.com';`
3. Sign out and sign in again. The Admin Dashboard link will appear.

Do not put an admin password or service-role key in HTML/JavaScript. Do not use
the old demo password from the PHP/MySQL version.

## 5. Test locally
Because the app uses JavaScript modules, open the project with a local web server
rather than double-clicking `index.html`.
- In VS Code, install/open **Live Server**, right-click `index.html`, choose
  **Open with Live Server**; or
- With Python installed, run `python -m http.server 5500` in the project folder
  and visit `http://localhost:5500`.

Test: student sign-up, login, event list, event registration, student dashboard,
cancellation, admin event creation/edit/delete, and participant list.

## 6. Publish on GitHub Pages
1. Create a new GitHub repository (for example `school-event-registration`).
2. Upload the contents of this folder to the repository root. `index.html` must
   be at the root, not inside another nested project folder.
3. On GitHub open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then Save.
6. Wait for deployment. GitHub will show your website URL in the Pages section.

If your repository is named `username.github.io`, the site URL is the root domain.
Otherwise it is usually `https://username.github.io/repository-name/`.

## 7. Set Supabase Auth URLs
After GitHub Pages is live, go to Supabase **Authentication → URL Configuration**.
Set **Site URL** to your published GitHub Pages URL and add that URL under
**Redirect URLs**. If testing locally, also add `http://localhost:5500/**`.
Use the exact URL GitHub Pages provides, including the repository path when applicable.

## Important security notes
- The `anon` / publishable key is okay to include in frontend code when Row Level
  Security is enabled. Never expose `service_role` or secret keys.
- RLS is enabled for all application tables. Students can see their own registrations;
  admins can manage events and view participant lists.
- The registration operation checks event capacity inside a database function.
- This is an academic project starter. Before production use, add stronger admin
  provisioning, audit logging, backups, and additional validation/rate limiting.

## File map
- `index.html`, `login.html`, `register.html`: public pages
- `student/`: student event details and dashboard
- `admin/`: admin dashboard and event management
- `assets/style.css`: original project styling
- `assets/js/`: Supabase connection and application logic
- `supabase-setup.sql`: schema, trigger, security policies, and database functions
- `database-original-mysql.sql`: preserved reference only; do not import this into Supabase
