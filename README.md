# Payroll Transaction list — workshop demo page

This is the practice website for the **Playwright for beginners** workshop. It looks like a payroll
system, and it is the page you will be testing during the session.

> ### ⚠️ This is not a real system
> Everything here is invented — every name, every amount, every company. It is not a Visma product,
> there is no database behind it, and nothing you do on this page is saved or sent anywhere.
> You cannot break it. Reloading the page puts everything back to the start.

---

## 👉 The quickest way: just open the link

**<https://armands-kiritis.github.io/vl-playwright-course/>**

Nothing to download. Nothing to install. If that link opens a payroll screen, **you are ready** —
skip to [Signing in](#signing-in).

Use this link unless a facilitator tells you otherwise.

---

## If the link does not work

Some office networks block external websites. If the link above gives you an error, you can run the
same page on your own computer instead. It takes about five minutes.

You need to do three things: **download the folder**, **start a small program that serves the
page**, and **open it in your browser**.

> **Short on time or unsure?** If you already have Claude set up with access to your files, you can
> skip most of this. Download and unzip the folder (steps 1 and 2), then ask Claude:
> *"Start a web server in this folder and tell me the address to open."*

### Step 1 — Download the folder

1. Go to <https://github.com/Armands-Kiritis/vl-playwright-course>
2. Click the green **`< > Code`** button near the top right.
3. Choose **Download ZIP**.
4. The file lands in your **Downloads** folder as `vl-playwright-course-main.zip`.

### Step 2 — Unzip it properly

**This step is where most people get stuck, so it is worth doing carefully.**

Right-click the downloaded ZIP file → **Extract All…** → **Extract**.

> **Why this matters:** on Windows, double-clicking a ZIP file shows you what is inside it, and it
> looks exactly like a normal folder. It is not. If you open the page from in there, Windows quietly
> copies it to a hidden temporary place and the page will not work properly. **Always extract
> first.**

You should now have a real folder called `vl-playwright-course-main` containing `index.html`,
`app.js`, `data.js` and `styles.css`.

### Step 3 — Start the page

The page needs to be *served* rather than just opened. That sounds technical, but it is one line
that you type once.

First, check what you already have. Open **PowerShell** (press the Windows key, type `powershell`,
press Enter) and type this, then press Enter:

```
node --version
```

If you see a version number like `v22.14.0`, you have **Node.js** — use option A.
If you see an error, try:

```
python --version
```

If *that* gives a version number, you have **Python** — use option B.
If neither works, see [I have neither](#i-have-neither-nodejs-nor-python).

---

#### Option A — you have Node.js

In PowerShell, navigate to the folder you extracted and start the server. Replace the path below
with your own if you extracted it somewhere else:

```
cd "$env:USERPROFILE\Downloads\vl-playwright-course-main"
npx serve
```

The first time, it will ask `Ok to proceed? (y)` — type **y** and press Enter.

It will print an address such as `http://localhost:3000`. **Use the address it prints**, not the
one in this README.

#### Option B — you have Python

```
cd "$env:USERPROFILE\Downloads\vl-playwright-course-main"
python -m http.server 8000
```

Then open **<http://localhost:8000>** in your browser.

#### I have neither Node.js nor Python

Install **Node.js** — it is the one you will most likely need for the workshop anyway:

1. Go to <https://nodejs.org>
2. Download the version marked **LTS** (the recommended one, on the left).
3. Run the installer and click Next through it. The default options are fine.
4. **Close PowerShell and open it again** — this is necessary, it will not work otherwise.
5. Type `node --version`. You should now see a version number.
6. Follow **Option A** above.

> **If the installer asks for an administrator password** and you do not have one, you will not be
> able to install Node.js yourself. Contact IT, or tell the facilitator before the session — the
> hosted link at the top of this page needs nothing installed.

### Step 4 — Leave it running

The PowerShell window has to **stay open** while you use the page. It looks like it has frozen —
that is normal, it is doing its job. Minimise it; do not close it.

When you are finished, click the window and press **Ctrl + C** to stop it.

---

## Signing in

The username and password are printed on the sign-in page, so there is nothing to remember:

| Username | Password |
|---|---|
| `payroll.admin` | `Workshop2026!` |

They are fake. There is nothing real behind them.

---

## Checking you are on the right version

Look at the **bottom left** of the page:

```
build 2026-09-18a · variant: base
```

If a facilitator asks you to *"read back your build stamp"*, that is the line they mean. If yours
does not match theirs, you are on an old copy — download it again, or press **Ctrl + Shift + R** to
force the browser to refresh the hosted page.

---

## The three versions of the page

During the session you will be asked to switch between versions, which pretend to be later builds
of the same product. You do that by adding a bit to the end of the web address:

| Add this to the address | What it is |
|---|---|
| *(nothing)* | The version you start on |
| `?variant=b` | A later build where something visibly changed |
| `?variant=c` | A later build where something changed that you cannot see |

So if you are on the hosted link, the second one is:

```
https://armands-kiritis.github.io/vl-playwright-course/?variant=b
```

The version you are currently on is always shown in the footer, next to the build stamp.

---

## If something goes wrong

| What you see | What to do |
|---|---|
| The page is blank or unstyled | You probably opened it from inside the ZIP. Go back to [Step 2](#step-2--unzip-it-properly) and extract it first. |
| `The term 'node' is not recognized` | Node.js is not installed, or you did not reopen PowerShell after installing it. |
| `Port 8000 is already in use` | Something else is using that address. Use `python -m http.server 8001` and open `http://localhost:8001` instead. |
| It signs you out every time you reload | You are opening the file directly instead of serving it. The address must start with `http://`, not `file:///`. |
| `cd` says it cannot find the path | The folder is somewhere other than Downloads. Find it in File Explorer, click in the address bar, copy the path, and use that inside the quotes. |
| The address bar says `localhost` but nothing loads | Check the PowerShell window is still open and still running. |

Still stuck? Bring it to the session — getting everyone onto the page is the first thing we do.

---

## What is in this folder

| File | What it is |
|---|---|
| `index.html` | The page itself |
| `styles.css` | How it looks |
| `data.js` | The payroll data — fixed values, identical on every machine |
| `app.js` | How the page behaves |

Plain HTML, CSS and JavaScript. No build step, no dependencies, and no internet needed once you
have the folder.

---

## Good to know

- **Nothing is saved.** Reload and you are back to the starting data. If you approve something and
  want it back, just reload the page.
- You stay signed in if you reload, but not if you open a new tab.
- It works on a narrow window too — the table turns into cards under about 600 pixels wide.
- It works in Chrome, Edge, Firefox and Safari.
