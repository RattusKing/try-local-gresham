# Try Local — Gresham, Oregon

A sleek, professional starter for the **Try Local** web app focused on **Gresham, OR**.

## Features
- Hero section with city background
- Search + category filters
- Responsive business cards
- Simple local-favorites demo (localStorage)
- Clean palette: **orange / green / black**
- Accessible and mobile-friendly

## Quick Start
1. Add a background image at `assets/gresham.jpg` (royalty-free photo of Gresham).  
   You can also swap the file name in `styles.css` `.hero` rule.
2. (Optional) Replace placeholder cover images in `/assets` for each business.
3. Open `index.html` in a browser to preview.

## Deploy to GitHub Pages
1. Create a new GitHub repo (e.g., `try-local-gresham`).
2. Upload these files to the repo root (or push via git).
3. In the repo Settings → **Pages** → Build and deployment:  
   - Source: **Deploy from a branch**  
   - Branch: `main` → `/ (root)`
4. The site will be available at: `https://<your-username>.github.io/try-local-gresham/`

## Wire Up Firebase (later)
- Replace the Auth modal with Firebase Auth (Email/Password or OAuth).
- Store real business profiles in Firestore:
  - `businesses/{businessId}` with fields like `name`, `tags[]`, `cover`, `hours`, `location`, `website`, `phone`.
- Restrict writes so each business can edit only their own doc (Firestore rules).
- Add an Admin page for business owners to update their page.

## Color Tokens
- Orange: `#FF7A00`
- Green: `#13A10E`
- Black: `#0B0B0B`
- Off-white background: `#F7F7F5`

## Notes
This is a static starter for design + UX. It’s intentionally simple so you can drop it into GitHub Pages and integrate Firebase/FlutterFlow later.
