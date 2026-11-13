# KEYFLOW — Clerk Branded Email Verification Templates

This directory contains the production-ready email templates for KEYFLOW email verification.

## Template Files

1. **`clerk_verification_link.html`** *(Primary — Matches Reference Image 2)*
   - Used when Clerk's email verification strategy is set to **"Email verification link"**.
   - Contains the centered brand header, bold heading, description, prominent red verification button (`{{{action_url}}}`), fallback copy-paste URL, 10-minute expiry notice, security disclaimer, and clean footer.
2. **`clerk_verification_code.html`** *(OTP Variant)*
   - Used when Clerk's verification strategy is set to **"Email verification code"**.
   - Contains the high-contrast 6-digit passcode block (`{{code}}`) with identical KEYFLOW branding and styling.

---

## Step-by-Step Clerk Dashboard Configuration Guide

To apply this custom design to your Clerk application:

### Step 1: Open Clerk Dashboard
1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com) and sign in.
2. Select your KEYFLOW application.

### Step 2: Verify Your Email Verification Strategy
1. In the left navigation, click **Configure** &rarr; **User & Authentication** &rarr; **Email, Phone, Username**.
2. Locate the **Email address** setting and click the gear/settings icon.
3. Check the **Verification strategy**:
   - If set to **"Email verification link"**, use `clerk_verification_link.html`.
   - If set to **"Email verification code"**, use `clerk_verification_code.html`.
   *(We recommend "Email verification link" to match Reference Image 2).*

### Step 3: Open Email Templates in Clerk
1. In the left navigation, go to **Configure** &rarr; **Customization** &rarr; **Email & SMS Templates** (or **Configure** &rarr; **Email & SMS Templates**).
2. Locate the **Verification link** template (or **Verification code** template).
3. Click on the template to edit it.

### Step 4: Paste the KEYFLOW Template
1. In the template editor, switch to the **HTML** mode / tab.
2. Replace the default template content with the exact contents of `clerk_verification_link.html`.
3. Set the email subject to:
   ```text
   Verify your email address - KEYFLOW
   ```
4. Click **Save** in the top right.

### Step 5: Test Verification
1. Open an incognito browser window.
2. Navigate to your KEYFLOW signup page (`https://keyflow-typing.vercel.app/register` or `http://localhost:5173/register`).
3. Create a test account with a valid email.
4. Verify that the received email displays the pristine, centered white card with the KEYFLOW brand badge, bold heading, red verification button, fallback link, and footer.
5. Click **Verify my email** and confirm successful redirection and session creation.

