# User Profile Test Plan

## Application Overview

Comprehensive Playwright test plan for OWASP Juice Shop user profile features. Tests assume a hybrid approach using the project’s `auth` fixture for pre-authenticated users (API-based user creation and token injection) and UI flows for validation. Each scenario starts from a clean, unique user with no prior orders, addresses, or payment methods. The plan covers happy paths, edge cases, and error handling with independent scenarios runnable in any order.

## Test Scenarios

### 1. User Profile

**Seed:** `tests/seed.spec.ts`

#### 1.1. View Profile Details

**File:** `tests/e2e/profile/view-profile.spec.ts`

**Steps:**

1. Start with pre-authenticated session via `auth` fixture providing `HomePage` and `testData`
2. Open Account menu and navigate to `Your Profile`
3. Verify profile header and sections render: `Personal Data`, `Security`, `Addresses`, `Payment Methods`, `Orders`
4. Validate displayed email matches `testData.email`
5. Confirm addresses and payment methods lists are empty for a new user
6. Confirm orders section shows empty state for a new user

**Expected Results:**

- Profile page loads without errors
- Displayed email equals the fixture-created user email
- Empty-state messages shown for addresses, payment methods, and orders

#### 1.2. Update Personal Data (Name + Phone)

**File:** `tests/e2e/profile/update-personal-data.spec.ts`

**Steps:**

1. Pre-authenticated session via `auth` fixture
2. Navigate to `Your Profile`
3. Click `Edit` in `Personal Data`
4. Enter valid `Name` and optional `Phone`
5. Click `Save`
6. Reload profile page or re-open to confirm persistence

**Expected Results:**

- Form accepts valid inputs
- Success toast/snackbar appears
- Name and phone persist across reloads

#### 1.3. Change Email (Validation + Persistence)

**File:** `tests/e2e/profile/change-email.spec.ts`

**Steps:**

1. Pre-authenticated session via `auth` fixture
2. Navigate to `Your Profile`
3. Open email edit control
4. Enter a valid new email and save
5. Verify success feedback
6. Verify UI shows updated email; optionally re-open session to confirm persistence

**Expected Results:**

- Email change accepted with success feedback
- Updated email displays consistently on the profile page

#### 1.4. Change Password (Happy Path)

**File:** `tests/e2e/profile/change-password-happy.spec.ts`

**Steps:**

1. Pre-authenticated session via `auth` fixture
2. Navigate to `Your Profile` → `Security`
3. Open `Change Password` form
4. Enter correct current password from fixture
5. Enter strong new password and confirm
6. Submit
7. Sign out and sign in with new password via API to validate

**Expected Results:**

- Password change succeeds with success feedback
- Re-authentication works only with new password; old password fails

#### 1.5. Change Password (Wrong Current Password)

**File:** `tests/e2e/profile/change-password-invalid-current.spec.ts`

**Steps:**

1. Pre-authenticated session via `auth` fixture
2. Navigate to `Your Profile` → `Security`
3. Enter incorrect current password
4. Enter valid new password and confirm
5. Submit

**Expected Results:**

- Server rejects request
- Inline error or snackbar explains incorrect current password
- No password change occurs

#### 1.6. Change Password (Weak New Password)

**File:** `tests/e2e/profile/change-password-weak.spec.ts`

**Steps:**

1. Pre-authenticated session via `auth` fixture
2. Navigate to `Your Profile` → `Security`
3. Enter correct current password
4. Enter weak new password (below policy)
5. Submit

**Expected Results:**

- Client or server-side validation blocks weak password
- Clear validation message present
- No change persisted

#### 1.7. Update Security Question

**File:** `tests/e2e/profile/update-security-question.spec.ts`

**Steps:**

1. Pre-authenticated session via `auth` fixture
2. Navigate to `Your Profile` → `Security`
3. Select a security question from dropdown
4. Enter an answer
5. Save

**Expected Results:**

- Selection and answer are accepted
- Success feedback appears
- Question + answer persist on revisit

#### 1.8. Manage Addresses (Add/Edit/Delete)

**File:** `tests/e2e/profile/addresses-crud.spec.ts`

**Steps:**

1. Pre-authenticated session via `auth` fixture
2. Navigate to `Your Profile` → `Addresses`
3. Add a new address with valid fields (name, street, city, state, zip, country)
4. Verify address appears in list
5. Edit the address (change street or city) and save
6. Verify updated values
7. Delete the address and confirm
8. Verify list returns to empty state

**Expected Results:**

- Add: address appears in list
- Edit: updated fields persist
- Delete: address removed; empty-state visible

#### 1.9. Manage Payment Methods (Add/Edit/Delete)

**File:** `tests/e2e/profile/payment-methods-crud.spec.ts`

**Steps:**

1. Pre-authenticated session via `auth` fixture
2. Navigate to `Your Profile` → `Payment Methods`
3. Add a payment method (e.g., card) with valid details
4. Verify it is listed
5. Edit card nickname or expiry and save
6. Verify changes
7. Delete the payment method
8. Verify list returns to empty state

**Expected Results:**

- Add: payment method listed
- Edit: updated data persists
- Delete: payment method removed; empty-state visible

#### 1.10. Upload/Change Avatar

**File:** `tests/e2e/profile/avatar-upload.spec.ts`

**Steps:**

1. Pre-authenticated session via `auth` fixture
2. Navigate to `Your Profile`
3. Open avatar upload control
4. Upload a valid image (supported format, reasonable size)
5. Verify preview updates
6. Reload and verify avatar persists

**Expected Results:**

- Upload succeeds with success feedback
- Avatar displays on profile and persists

#### 1.11. Avatar Upload Invalid Type/Size

**File:** `tests/e2e/profile/avatar-upload-negative.spec.ts`

**Steps:**

1. Pre-authenticated session via `auth` fixture
2. Navigate to `Your Profile`
3. Attempt to upload an unsupported file type or oversized file

**Expected Results:**

- Upload blocked
- Clear validation or error message shown
- Previous avatar unchanged

#### 1.12. Order History Visibility

**File:** `tests/e2e/profile/order-history.spec.ts`

**Steps:**

1. Pre-authenticated session via `auth` fixture
2. Navigate to `Your Profile` → `Orders`
3. Verify empty-state for new user
4. (Setup) Place an order via UI or API for this user
5. Refresh orders section
6. Validate order entry appears with correct metadata (date, items, totals)

**Expected Results:**

- Empty-state initially
- After placing order, order shows with correct details

#### 1.13. Delete Account (Cancel + Confirm)

**File:** `tests/e2e/profile/delete-account.spec.ts`

**Steps:**

1. Use a dedicated pre-authenticated user via `auth` fixture (isolation)
2. Navigate to `Your Profile` → `Security` or `Danger Zone`
3. Click `Delete Account`
4. First, cancel in confirmation dialog; verify account remains accessible
5. Then, delete for real; verify redirect or sign-out
6. Attempt to re-auth via API; expect failure

**Expected Results:**

- Cancel leaves account intact
- Confirm removes account and invalidates credentials

#### 1.14. Form Validation (Required + Format)

**File:** `tests/e2e/profile/validation.spec.ts`

**Steps:**

1. Pre-authenticated session via `auth` fixture
2. Navigate to `Your Profile`
3. Trigger required-field validation by clearing mandatory fields (e.g., email, name)
4. Enter invalid formats (e.g., malformed email)
5. Attempt save

**Expected Results:**

- Inline validation messages appear
- Saves blocked until valid input
- No unintended changes persisted

#### 1.15. Localization and Accessibility Checks

**File:** `tests/e2e/profile/i18n-a11y.spec.ts`

**Steps:**

1. Pre-authenticated session via `auth` fixture
2. Switch language via header control
3. Navigate to `Your Profile` and verify key labels translated
4. Run basic a11y checks on profile sections (roles, focus order, keyboard nav)

**Expected Results:**

- Language switch updates profile labels
- Core a11y roles present; keyboard navigation works
