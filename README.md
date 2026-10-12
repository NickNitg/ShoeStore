# Stride shoe store

Static site (HTML/CSS/JS) with SharePoint as the data store. Works out of the box in demo mode.

## Run locally
Open `index.html`, or run `python -m http.server` in this folder and visit http://localhost:8000.
With the empty `config.js`, you get sample shoes and browser-only accounts.

## Host on GitHub
Push the folder to a repo, then Settings → Pages → deploy from `main` / root.

## SharePoint backend
A static site can't talk to SharePoint directly without exposing credentials, so use **Power Automate** flows as a small API.
Each flow starts with **"When an HTTP request is received"** (POST, anyone can call). Paste its URL into `config.js`.

### 1. Create SharePoint lists
**Products**: Title (name), Category (Choice: Running/Casual/Hiking, blank allowed), Sport (Choice: Football/Basketball/Tennis/Training/Cycling), Color (Choice: Black/White/Red/Blue/Green/Grey), Price (Number), Sizes (Text, e.g. `7,8,9,10`), ProductId (Number)
**Customers**: Title (name), Email (Text, indexed, unique), PasswordHash (Text)
**Orders**: Title (customer name), Email, Address, City, ItemsJson (Multiple lines), Total (Number), AccountEmail, Guest (Yes/No), Placed (Date and time)

### 2. Create four flows
| Flow | Steps | Response body |
|---|---|---|
| products | Get items (Products) → Select to map `{id:ProductId, name:Title, category, sport, color, price, sizes}` | the mapped array |
| register | Get items (Customers) filter `Email eq '<email>'` → if empty, Create item | `{name,email}` or `{error:"That email already has an account."}` |
| login | Get items filter `Email eq '<email>' and PasswordHash eq '<hash>'` | `{name,email}` or `{error:"Email or password is incorrect."}` |
| order | Create item in Orders from the request body | `{ok:true}` |

Add a **Response** action to every flow, with header `Access-Control-Allow-Origin: *` (or your GitHub Pages origin).

## Know before going live
- **Payments are not included.** Orders are recorded as "placed"; add Stripe Checkout or PayPal before charging customers.
- **Password security is basic.** The browser sends a SHA-256 hash, which is better than plain text but not production-grade. For real accounts, use Microsoft Entra External ID or Auth0 instead of a Customers list.
- **Flow URLs contain a secret key** and are visible in the site's source. Anyone can call them, so validate input in the flow and add rate limits or a CAPTCHA.
- Prices are read from the Products list in the browser; recalculate the total in the `order` flow so it can't be tampered with.
# StoreShoe
