Continue building the Quicksplit mobile MVP using the exact same visual style, component language, spacing, typography, colors, rounded cards, and button style shown in the existing screens.

IMPORTANT:
- Do not redesign the app from scratch.
- Preserve the current Quicksplit look and feel.
- Keep the same clean mobile-first aesthetic.
- Keep the same dark navy headers/buttons, soft gray backgrounds, rounded white cards, green/orange/red status colors, and large bold monetary values.
- Match the current UI system so all new screens feel like part of the same prototype.

The current existing screens already include:
- Home
- New Split
- Select People
- Review Split
- Split Details
- Household Expenses
- Toast success feedback

Your job is to COMPLETE the remaining MVP flow and improve usability using HCI/UX best practices and heuristic evaluation principles.

Add the following new screens and interactions:

1. SPLIT METHOD SCREEN
After “Select People”, create a new screen called “Split Method”.
Purpose: let the user decide how to divide the expense.
Include 3 options:
- Split equally
- Split fixed amounts
- Split by percentages
Show each option as a tappable card or list item.
Include a clear Continue button.
Keep navigation consistent with the rest of the app.

2. ASSIGN AMOUNTS SCREEN
If the user chooses fixed amounts:
- Show each selected participant in a list
- Each participant should have an editable amount field
- Show a running total and remaining amount
- Prevent the user from continuing if the assigned total does not equal the bill total
- Show a clear inline validation/error message if totals do not match

If the user chooses percentages:
- Show each participant with an editable percentage field
- Show total percentage progress
- Prevent continuing unless total equals 100%
- Show validation feedback inline

If the user chooses equal split:
- Show a confirmation view that automatically displays the calculated amount per participant

3. WHO PAID SCREEN
Create a screen called “Who Paid?” before the final review.
Allow the user to choose:
- I paid upfront
- Someone else in the group paid
- Split was paid together
For MVP simplicity, default to “I paid upfront” but still show the options.
This should improve clarity in the review step and support better mental models.

4. ENHANCED REVIEW SPLIT SCREEN
Keep the current Review Split layout and style, but improve it by showing:
- Expense title
- Total amount
- Who paid upfront
- Split method used
- Participant-by-participant breakdown
- Clear back/edit affordance for changes
- Final “Create Split” button
Make sure the information hierarchy is very clear and easy to scan.

5. EMPTY STATE FOR HOME
Create a home screen empty state for first-time users with:
- zero balances
- no recent splits
- a friendly message encouraging the user to create their first split
- CTA button: “Create your first split”
This is for usability testing and edge-case completeness.

6. FREQUENT CONTACTS / RECENT CONTACTS
Improve “Select People” by adding a section at the top:
- Frequent Contacts
Use small contact chips or cards for quick selection.
Below that, keep the full contact list.
Also show selected count clearly and keep the Continue button disabled until at least one person is selected.

7. HOUSEHOLD EXPENSE DETAIL SCREEN
Create a detail screen for a recurring household bill, such as WiFi or Rent.
Show:
- bill name
- amount
- frequency (monthly)
- who paid
- who still owes
- due date
- payment status
- option to mark as paid
- option to send reminder
This should match the existing Split Details screen style.

8. ADD RECURRING EXPENSE FLOW
Create a simple 1–2 screen flow to add a recurring household expense.
Fields:
- expense name
- amount
- frequency (monthly)
- participants
- who usually pays first
- start date
CTA: “Create recurring expense”
Keep it simple and consistent with the existing New Split flow.

9. RECEIPT SCAN RESULT / CONFIRMATION SCREEN
Since “Scan Receipt” exists, create a follow-up screen that simulates OCR results.
Show:
- extracted expense name
- extracted total amount
- editable fields in case the scan is wrong
- CTA to continue
This should make the receipt scan feature feel complete for MVP/usability testing, even if it is simulated.

10. MORE FEEDBACK / SYSTEM STATUS STATES
Add lightweight toast or banner states for:
- Split created successfully
- Reminder sent
- Split marked as settled
- Invalid total amount
- Percentages do not add to 100%
- Recurring expense created
These should remain visually consistent with current toast styling.

11. USER CONTROL AND ERROR PREVENTION
Across the new and existing screens:
- add clear back navigation
- add cancel/discard confirmation for incomplete split creation
- ensure primary actions are always obvious
- keep disabled states visually clear
- avoid making users remember information from previous screens by keeping totals and selected participants visible where helpful

12. CONSISTENCY AND MOBILE USABILITY
Apply these improvements consistently:
- clear status labels: Paid, Pending, Settled
- large touch targets
- strong visual hierarchy
- minimal clutter
- keep one main CTA per screen
- keep labels familiar and plain-language
- preserve the current design system

At the end, produce a complete connected mobile prototype flow for the Quicksplit MVP that feels ready for class presentation and usability testing.