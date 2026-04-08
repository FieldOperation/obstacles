# Step-by-Step: Enroll in the Apple Developer Program

Use this guide to join the **Apple Developer Program** so you can publish the Obstacles CMS app (and any future apps) to the **App Store**. Enrollment costs **$99 USD per year**.

---

## Before You Start

| Item | Notes |
|------|--------|
| **Apple ID** | Use a personal or business Apple ID; you’ll sign in with it. |
| **Two-factor authentication** | Must be turned on for your Apple ID. |
| **Payment** | Credit or debit card for the $99/year fee. |
| **Individual vs Organization** | Individual = you as a person. Organization = company (needs D-U-N-S, etc.). |

---

## Individual vs Organization — what’s the difference?

| | **Individual** | **Organization** |
|---|----------------|------------------|
| **Who enrolls** | You, as a person (legal name). | Your company (legal entity name). |
| **App Store seller name** | Your name (e.g. “John Smith”). | Your company name (e.g. “Acme Inc.”). |
| **Setup** | Simple: name, address, payment. | Needs **D-U-N-S number**, company details, sometimes legal docs. |
| **Approval time** | Often **24–48 hours**. | Often **several days to 1–2 weeks** (Apple verifies the company). |
| **Team / roles** | Effectively you; no built-in roles. | You can **invite people** with roles (Admin, App Manager, Developer, etc.). |
| **Cost** | $99 USD/year (same). | $99 USD/year (same). |
| **Apps & features** | Same: publish to App Store, TestFlight, certificates, etc. | Same. No extra store features for Organization. |

### Does it affect the app or store?

- **Functionality:** No. The app works the same; App Store and TestFlight work the same.
- **What changes:** Only **who is shown as the seller** (your name vs company name) and **whether you can add a team** with roles.

### When to choose which?

- **Choose Individual** if you’re publishing as yourself, alone, and don’t need the app under a company name or multiple people managing the account. Easiest and fastest.
- **Choose Organization** if you want the app under a **company name**, need to **add teammates** with different permissions, or want the developer account tied to the company for legal/branding reasons.

You **cannot change** from Individual to Organization later; you’d need to enroll again as an Organization (and possibly transfer apps). So choose based on how you want the app to appear and who will manage it.

**Can I choose Individual and hide my name on the App Store?**  
No. With an Individual account, your **legal name** is always shown as the seller/developer on the App Store. Apple does not allow pseudonyms, “DBA” names, or hiding it. To show a company name (or any name other than your personal name) on the store, you must use an **Organization** account. Inside your app you can display whatever you like (e.g. “Obstacles CMS” or a company name); only the store listing is tied to your account type.

---

## Step 1: Open the enrollment page

1. Go to: **[developer.apple.com/programs](https://developer.apple.com/programs)**
2. Click **“Enroll”** or **“Start your enrollment”**.

---

## Step 2: Sign in with your Apple ID

1. Sign in with the Apple ID you want to use for the developer account.
2. If you don’t have an Apple ID: go to [appleid.apple.com](https://appleid.apple.com) and create one first.
3. Make sure **two-factor authentication** is enabled for this Apple ID (Apple ID → Sign-In and Security).

---

## Step 3: Choose account type

- **Individual / Sole Proprietor**  
  - Use your legal name.  
  - No D-U-N-S number.  
  - Fastest option for most solo developers.

- **Organization (Company)**  
  - Use your company’s legal name.  
  - You’ll need a **D-U-N-S Number** (from [D&B](https://www.dnb.com)).  
  - Company email (e.g. you@yourcompany.com).  
  - Authority to sign legal agreements for the company.

Choose the one that matches how you’ll publish the app (you personally vs your company).

---

## Step 4: Enter your information

- **Individual**
  - Legal first and last name.  
  - Correct mailing address (no P.O. box).  
  - Phone number.  
  - Email (can be the one tied to your Apple ID).

- **Organization**
  - Legal company name (exactly as registered).  
  - D-U-N-S number.  
  - Company website.  
  - Company phone and address.  
  - Your name and role (e.g. owner, director).

Double-check spelling and that the address is valid; Apple may send mail or verify it.

---

## Step 5: Review and accept the agreement

1. Read the **Apple Developer Program License Agreement**.
2. Accept the terms (checkbox/button).
3. Confirm you have the authority to agree (for organizations, this means you can bind the company).

---

## Step 6: Pay the annual fee

1. Enter **payment details** (credit or debit card).
2. The fee is **$99 USD per year** (or equivalent in your country).
3. Complete the purchase. You’ll get a receipt by email.

---

## Step 7: Wait for approval

- **Individual:** Often approved within **24–48 hours** (sometimes same day).
- **Organization:** Can take **a few days to 1–2 weeks** while Apple verifies the company and D-U-N-S.

You’ll get an email when your enrollment is approved. Until then, you can’t create apps in App Store Connect or use full developer features.

---

## Step 8: After approval

1. Go to **[developer.apple.com/account](https://developer.apple.com/account)** and sign in.
2. Confirm **Membership** is active and note your **Team ID** (you’ll use it in EAS and App Store Connect).
3. Go to **[App Store Connect](https://appstoreconnect.apple.com/)** → **My Apps** when you’re ready to create your first app (see **IOS_PRODUCTION_CHECKLIST.md** and **STORE_PUBLISHING_GUIDE.md**).

---

## Optional: Enroll with the Apple Developer app

You can also enroll from an iPhone or iPad:

1. Install the **Apple Developer** app from the App Store.
2. Open it and tap **Enroll** (or **Account** → **Enroll**).
3. Sign in with your Apple ID and follow the same steps (account type, details, agreement, payment). Approval works the same as on the web.

---

## Quick reference

| Step | Action |
|------|--------|
| 1 | Open [developer.apple.com/programs](https://developer.apple.com/programs) and click Enroll |
| 2 | Sign in with Apple ID (2FA must be on) |
| 3 | Choose Individual or Organization |
| 4 | Enter your (or company) details |
| 5 | Accept the license agreement |
| 6 | Pay $99 USD/year |
| 7 | Wait for approval email (often 24–48 hours for Individual) |
| 8 | Use [developer.apple.com/account](https://developer.apple.com/account) and [App Store Connect](https://appstoreconnect.apple.com/) |

---

## Next steps for Obstacles CMS

After enrollment is approved:

1. Follow **IOS_PRODUCTION_CHECKLIST.md** (create app in App Store Connect, set `eas.json`, build with EAS, submit).
2. Or use **STORE_PUBLISHING_GUIDE.md** for both iOS and Android in one place.

Your app’s **Bundle ID** is: `com.obstacles.cms`.
