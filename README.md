# HeCrA 2026 Certificate Generator

This folder contains **only public website files**. Do not upload attendee spreadsheets or email addresses to this repository.

## Set up private attendance verification

1. In Google Drive, upload `checkedin list hecra.xlsx`. Open it with Google Sheets and save as a **Google Sheets** spreadsheet. Keep access set to **Restricted**.
2. Check that its sheet/tab is named `Sheet1`, with first names in column B and last names in column C. Row 1 contains the group heading; row 2 the column headings; attendees begin at row 3.
3. Copy the ID from its Google Sheets URL: `https://docs.google.com/spreadsheets/d/THIS_PART_IS_THE_ID/edit`.
4. Go to https://script.google.com and create a new project. Paste the contents of the **separately provided** `Code.gs` into the script editor.
5. Change `SPREADSHEET_ID` to the ID from step 3. Save.
6. Choose **Deploy → New deployment → Web app**. Set **Execute as: Me**, **Who has access: Anyone**. Authorize requested access to Sheets. Copy the deployed `/exec` URL (not the `/dev` URL).
7. In `config.js`, replace `PASTE_YOUR_GOOGLE_APPS_SCRIPT_EXEC_URL_HERE` with that `/exec` URL.
8. Before announcing the website, verify a valid attendee name and a fake name. If you update the Apps Script afterward, deploy a new version under **Manage deployments** (editing alone does not update the live version).

## Publish at GitHub Pages

1. Open https://github.com/HeCrA-Conference/hecra-certificates
2. Upload **the contents of this folder** to the repository's root (not the folder itself). Commit.
3. Under **Settings → Pages**, choose **Deploy from a branch**, branch **main**, folder **/(root)**, and save.
4. Your webpage should appear at https://hecra-conference.github.io/hecra-certificates/
5. Allow time for GitHub Pages to publish after your commit. Verify that the form and PDF download both work.

## What participants do

Enter the same first and last name printed on the badge. Names are compared case-insensitively and without Greek accents, with extra spaces ignored. Approved names are written on the PDF exactly as stored in the private sheet.

## Security and privacy limitations

- Name matching **does not prove identity**. Anyone who knows a checked-in participant's name can obtain their certificate.
- The backend does **not** return the entire check-in list. However, a person could try names and infer which ones are present; the verification request and result can be seen in developer tools. This is a lightweight check, not strong identity verification.
- The PDF layout itself is public, so a technically knowledgeable person could circumvent the client-side eligibility check or alter a PDF. For tamper-resistant certificates, use server-side issuance and verification codes.
- The site uses third-party PDF-lib code from jsDelivr and Google's Apps Script endpoint. The name is sent to the Apps Script endpoint for checking.
- Do **not** upload the original XLSX, a copy of the attendance list, any email addresses, or private documents to GitHub.
- If a registrant did not check in, their name must not be added to the private sheet.

## Files

- `index.html` — participant webpage
- `app.js` — name verification and personalized PDF download
- `config.js` — URL of your private Apps Script web app
- `certificate-template.pdf` — official blank PDF produced from the PowerPoint certificate
- `certificate-preview.jpg` — visual preview

The default appearance of the inserted attendee name can be adjusted in `app.js`, in `namePicture` and `page.drawImage`.
