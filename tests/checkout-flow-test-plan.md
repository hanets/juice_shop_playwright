# OWASP Juice Shop - Checkout Flow Test Plan

## Application Overview

A comprehensive test plan for the OWASP Juice Shop e-commerce application covering user authentication, shopping cart functionality, purchase flows, user profile management, inventory management, customer feedback system, and social media integration. The plan includes positive and negative test scenarios for all critical user journeys.

## Test Scenarios

### 1. Authentication Tests

**Seed:** `tests/seed.spec.ts`

#### 1.1. User Registration - Positive Flow

**File:** `tests/auth/user-registration-positive.spec.ts`

**Steps:**
  1. Navigate to the application homepage at http://localhost:3000/
  2. Dismiss cookie consent dialog by clicking 'Me want it!'
  3. Dismiss welcome banner by clicking 'Dismiss'
  4. Click on the Account button in the header
  5. Select 'Login' from the account menu
  6. Click 'Not yet a customer?' link to navigate to registration
  7. Enter a valid unique email address in the Email field
  8. Enter a valid password (5-40 characters) in the Password field
  9. Re-enter the same password in the Repeat Password field
  10. Click on the Security Question dropdown and select a question
  11. Enter a valid answer for the security question
  12. Click the Register button
  13. Verify successful registration message appears

**Expected Results:**
  - Application loads successfully with homepage displayed
  - Cookie dialog is dismissed and no longer visible
  - Welcome banner is closed and main content is visible
  - Account menu opens showing login option
  - Login page loads with email and password fields visible
  - Registration page loads with all required form fields
  - Email field accepts valid email format
  - Password field accepts valid password and shows character count
  - Password confirmation field accepts matching password
  - Security question dropdown shows available questions
  - Answer field accepts text input
  - Registration completes successfully
  - User is redirected to login page or dashboard with success message

#### 1.2. User Registration - Negative Flow (Invalid Email)

**File:** `tests/auth/user-registration-negative-email.spec.ts`

**Steps:**
  1. Navigate to the registration page
  2. Enter an invalid email format (e.g. 'invalidemail')
  3. Enter a valid password in the Password field
  4. Re-enter the same password in the Repeat Password field
  5. Select a security question and provide an answer
  6. Attempt to click the Register button

**Expected Results:**
  - Registration page loads correctly
  - Invalid email shows validation error
  - Password field accepts valid input
  - Password confirmation field accepts matching input
  - Security question and answer are completed
  - Register button remains disabled or shows email validation error

#### 1.3. User Registration - Negative Flow (Password Mismatch)

**File:** `tests/auth/user-registration-negative-password.spec.ts`

**Steps:**
  1. Navigate to the registration page
  2. Enter a valid email address
  3. Enter a valid password in the Password field
  4. Enter a different password in the Repeat Password field
  5. Select a security question and provide an answer
  6. Attempt to click the Register button

**Expected Results:**
  - Registration page loads correctly
  - Email field accepts valid email
  - Password field accepts valid password
  - Password mismatch shows validation error
  - Security question and answer are completed
  - Register button remains disabled or shows password mismatch error

#### 1.4. User Login - Positive Flow

**File:** `tests/auth/user-login-positive.spec.ts`

**Steps:**
  1. Navigate to the application homepage
  2. Complete user registration first (prerequisite)
  3. Click on the Account button in the header
  4. Select 'Login' from the account menu
  5. Enter the registered email address
  6. Enter the correct password
  7. Click the Login button
  8. Verify successful login

**Expected Results:**
  - Homepage loads successfully
  - User registration completes successfully
  - Account menu opens with login option
  - Login page displays email and password fields
  - Email field accepts registered email
  - Password field accepts correct password
  - Login completes successfully
  - User is redirected to homepage with logged-in state, account menu shows user options

#### 1.5. User Login - Negative Flow (Invalid Credentials)

**File:** `tests/auth/user-login-negative.spec.ts`

**Steps:**
  1. Navigate to the login page
  2. Enter an invalid email address (user@example.com)
  3. Enter an incorrect password (Test@1234)
  4. Click the Login button
  5. Verify login failure message appears

**Expected Results:**
  - Login page loads with email and password fields
  - Email field accepts invalid email input
  - Password field accepts incorrect password
  - Login attempt is processed
  - Error message appears indicating invalid credentials, user remains on login page

#### 1.6. Google OAuth Login Flow

**File:** `tests/auth/google-login.spec.ts`

**Steps:**
  1. Navigate to the login page
  2. Click 'Login with Google' button
  3. Verify Google OAuth redirect occurs
  4. Handle Google authentication flow
  5. Verify successful authentication redirect back to application

**Expected Results:**
  - Login page displays with Google login option
  - Google OAuth flow initiates correctly
  - User is redirected to Google authentication
  - Google authentication completes successfully
  - User is redirected back to application in logged-in state

### 2. Shopping Cart and Checkout Tests

**Seed:** `tests/seed.spec.ts`

#### 2.1. Add Items to Basket - Single Product

**File:** `tests/checkout/add-single-item.spec.ts`

**Steps:**
  1. Navigate to the main products page
  2. Login as a registered user
  3. Click on a product (e.g., Apple Juice) to view details
  4. Look for Add to Cart/Basket button in product details
  5. Click Add to Basket button
  6. Verify item is added to basket
  7. Check basket icon shows item count
  8. Navigate to basket/cart page to verify item details

**Expected Results:**
  - Products page loads with all available items displayed
  - User login completes successfully
  - Product details modal opens showing product information
  - Add to Basket button is visible and clickable
  - Item is successfully added to basket
  - Success message appears confirming item addition
  - Basket icon shows count of 1 item
  - Basket page shows added item with correct price and quantity

#### 2.2. Add Multiple Items to Basket

**File:** `tests/checkout/add-multiple-items.spec.ts`

**Steps:**
  1. Navigate to the main products page
  2. Login as a registered user
  3. Add Apple Juice (1.99¤) to basket
  4. Add Banana Juice (1.99¤) to basket
  5. Add Carrot Juice (2.99¤) to basket
  6. Navigate to basket page
  7. Verify all three items are present
  8. Verify correct total price calculation (6.97¤)

**Expected Results:**
  - Products page displays available items
  - User login is successful
  - First item (Apple Juice) adds to basket successfully
  - Second item (Banana Juice) adds to basket successfully
  - Third item (Carrot Juice) adds to basket successfully
  - Basket page loads with all items
  - All three products are visible in basket with correct details
  - Total price is calculated correctly as 6.97¤

#### 2.3. Remove Items from Basket

**File:** `tests/checkout/remove-items.spec.ts`

**Steps:**
  1. Login and add 3 different items to basket
  2. Navigate to basket/cart page
  3. Click remove button for the first item
  4. Verify item is removed and total price updated
  5. Click remove button for another item
  6. Verify basket updates correctly
  7. Remove the final item
  8. Verify basket is empty

**Expected Results:**
  - Basket contains 3 items initially
  - Basket page displays all items with remove options
  - First item is removed successfully
  - Total price recalculates to exclude removed item
  - Second item is removed successfully
  - Basket shows only remaining item with correct total
  - Final item is removed successfully
  - Basket shows as empty with total of 0

#### 2.4. Complete Purchase Flow - Successful Checkout

**File:** `tests/checkout/complete-purchase.spec.ts`

**Steps:**
  1. Login as registered user
  2. Add multiple items to basket (total under 100¤)
  3. Navigate to basket/checkout page
  4. Click Proceed to Checkout button
  5. Fill in delivery address information
  6. Select payment method
  7. Review order details
  8. Click Place Order button
  9. Verify successful order confirmation
  10. Check order history/profile for completed order

**Expected Results:**
  - User login completes successfully
  - Multiple items are added to basket
  - Basket page shows all items with checkout option
  - Checkout process initiates successfully
  - Address form accepts valid delivery information
  - Payment method selection is available and functional
  - Order review page shows correct items and total
  - Order placement completes successfully
  - Confirmation page displays order number and details
  - Order appears in user's order history

#### 2.5. Checkout Flow - Payment Failure Simulation

**File:** `tests/checkout/payment-failure.spec.ts`

**Steps:**
  1. Login and add items to basket
  2. Proceed through checkout to payment step
  3. Enter invalid payment details (expired card)
  4. Attempt to complete purchase
  5. Verify payment failure handling
  6. Verify user can retry with different payment method

**Expected Results:**
  - Checkout process reaches payment step successfully
  - Payment form accepts invalid card details input
  - Payment processing fails with appropriate error message
  - User remains on payment page with error displayed
  - Basket items are preserved after payment failure
  - User can modify payment details and retry successfully

### 3. User Profile Management Tests

**Seed:** `tests/seed.spec.ts`

#### 3.1. Update User Profile Information

**File:** `tests/profile/update-profile-info.spec.ts`

**Steps:**
  1. Login as registered user
  2. Navigate to user profile/account settings page
  3. Update display name/username field
  4. Update address information
  5. Update phone number
  6. Click Save Changes button
  7. Verify profile updates are saved successfully
  8. Logout and login again to verify persistence

**Expected Results:**
  - User login successful and profile page accessible
  - Profile page loads with current user information
  - Display name field accepts new input
  - Address fields accept updated information
  - Phone number field accepts valid phone format
  - Changes are saved successfully with confirmation message
  - Updated information displays correctly on profile page
  - Profile changes persist after logout and re-login

#### 3.2. Profile Photo Upload

**File:** `tests/profile/photo-upload.spec.ts`

**Steps:**
  1. Login as registered user
  2. Navigate to user profile page
  3. Locate profile photo/avatar upload section
  4. Click on upload photo/change avatar button
  5. Select a valid image file (JPG/PNG, under size limit)
  6. Confirm photo upload
  7. Verify new profile photo is displayed
  8. Check that photo appears in other areas of the app

**Expected Results:**
  - Profile page loads with photo upload functionality
  - Upload section is visible and interactive
  - File picker opens when upload button is clicked
  - Valid image file is accepted for upload
  - Upload process completes without errors
  - New profile photo displays correctly on profile page
  - Photo appears consistently across app (header, reviews, etc.)

#### 3.3. Profile Photo Upload - Invalid File Type

**File:** `tests/profile/photo-upload-invalid.spec.ts`

**Steps:**
  1. Login as registered user
  2. Navigate to user profile page
  3. Attempt to upload invalid file type (e.g., .txt, .pdf)
  4. Verify appropriate error message is shown
  5. Attempt to upload oversized image file
  6. Verify file size validation error

**Expected Results:**
  - Profile page loads successfully
  - Upload attempt triggers file type validation
  - Clear error message indicates invalid file type
  - Upload is rejected and current photo remains unchanged
  - File size validation triggers for large files
  - Appropriate error message shows size limit information

### 4. Inventory Management Tests

**Seed:** `tests/seed.spec.ts`

#### 4.1. Purchase Last Available Item - Stock Depletion

**File:** `tests/inventory/last-item-purchase.spec.ts`

**Steps:**
  1. Navigate to products page and identify item with 'Only 1 left' status
  2. Login as first user and add the last item to basket
  3. Complete checkout process for this item
  4. Verify successful purchase completion
  5. Logout from first user account
  6. Login as second user or browse as guest
  7. Navigate back to products page
  8. Verify the item now shows 'Sold Out' status
  9. Attempt to add sold out item to basket
  10. Verify appropriate sold out message/disabled state

**Expected Results:**
  - Products page shows item with 'Only 1 left' indicator
  - First user can successfully add last item to basket
  - Checkout process completes successfully for last item
  - Order confirmation received for purchased item
  - User logout completes successfully
  - Second user login or guest browsing works
  - Products page refreshes with updated inventory
  - Previously available item now shows 'Sold Out'
  - Add to basket functionality is disabled for sold out item
  - Clear messaging indicates item is no longer available

#### 4.2. Limited Stock Item Purchase - Quantity Validation

**File:** `tests/inventory/limited-stock-validation.spec.ts`

**Steps:**
  1. Identify item with limited stock (e.g., 'Only 3 left')
  2. Login as user and view product details
  3. Attempt to add more items than available stock
  4. Verify quantity limitation is enforced
  5. Add maximum available quantity to basket
  6. Proceed through checkout with available quantity
  7. Verify stock count updates correctly after purchase

**Expected Results:**
  - Limited stock item identified (e.g., Melon Bike with 'Only 3 left')
  - Product details show available quantity information
  - Quantity selector prevents exceeding available stock
  - Error message appears when attempting to exceed stock limit
  - Maximum available quantity can be added successfully
  - Checkout completes with correct quantity
  - Remaining stock count updates after successful purchase

#### 4.3. Sold Out Item Interaction

**File:** `tests/inventory/sold-out-interaction.spec.ts`

**Steps:**
  1. Navigate to products page
  2. Identify item marked as 'Sold Out'
  3. Click on sold out product to view details
  4. Verify Add to Basket button is disabled/hidden
  5. Verify appropriate sold out messaging
  6. Check if item can be added to wishlist (if feature exists)
  7. Verify sold out status in search results

**Expected Results:**
  - Products page displays with sold out items clearly marked
  - Sold out product (e.g., OWASP Juice Shop Facemask) is identified
  - Product details modal opens for sold out item
  - Add to Basket functionality is properly disabled
  - Clear sold out status message is visible
  - Wishlist functionality works appropriately for out of stock items
  - Search and filtering respect sold out status correctly

### 5. Customer Feedback System Tests

**Seed:** `tests/seed.spec.ts`

#### 5.1. Submit Customer Feedback with 3-Star Rating

**File:** `tests/feedback/submit-rating-3-star.spec.ts`

**Steps:**
  1. Navigate to Customer Feedback page (/contact)
  2. Login as registered user (Author field should auto-populate)
  3. Enter feedback comment in the Comment field (within 160 char limit)
  4. Adjust rating slider to 3 stars (from default 1 star)
  5. Solve the CAPTCHA challenge
  6. Click Submit button
  7. Verify feedback submission success message
  8. Navigate to About Us page to check if feedback appears in carousel

**Expected Results:**
  - Customer Feedback page loads with all form fields visible
  - Author field is populated with logged-in user information
  - Comment field accepts feedback text up to 160 characters
  - Rating slider successfully adjusts to show 3 stars
  - CAPTCHA displays mathematical challenge
  - CAPTCHA solution is accepted when entered correctly
  - Feedback submission completes successfully
  - Success message confirms feedback has been recorded
  - New feedback may appear in the About Us page feedback carousel

#### 5.2. Customer Feedback - Validation Tests

**File:** `tests/feedback/feedback-validation.spec.ts`

**Steps:**
  1. Navigate to Customer Feedback page
  2. Attempt to submit feedback with empty comment field
  3. Verify validation prevents submission
  4. Enter comment exceeding 160 character limit
  5. Verify character limit enforcement
  6. Enter valid comment but provide incorrect CAPTCHA answer
  7. Attempt to submit and verify CAPTCHA validation
  8. Provide correct CAPTCHA and verify successful submission

**Expected Results:**
  - Feedback form displays with validation requirements
  - Submit button remains disabled with empty required fields
  - Validation message appears for missing comment
  - Character counter updates as text is typed
  - Comment field prevents input beyond 160 characters
  - CAPTCHA validation error appears with incorrect answer
  - Form submission is blocked until CAPTCHA is correct
  - Successful submission occurs with all valid inputs

#### 5.3. Customer Feedback - Rating Variations

**File:** `tests/feedback/feedback-rating-variations.spec.ts`

**Steps:**
  1. Submit feedback with 1-star rating (minimum)
  2. Submit feedback with 5-star rating (maximum)
  3. Submit feedback with 2-star rating
  4. Submit feedback with 4-star rating
  5. Verify all ratings are accepted and stored correctly

**Expected Results:**
  - 1-star rating feedback submits successfully
  - 5-star rating feedback submits successfully
  - 2-star rating feedback submits successfully
  - 4-star rating feedback submits successfully
  - All rating variations are properly recorded and may display on About Us page

### 6. Social Media Integration Tests

**Seed:** `tests/seed.spec.ts`

#### 6.1. Social Media Links from About Us Page - BlueSky

**File:** `tests/social/bluesky-link.spec.ts`

**Steps:**
  1. Navigate to About Us page (/about)
  2. Scroll to 'Follow us on Social Media' section
  3. Click on BlueSky social media button
  4. Verify link opens correctly (new tab/window)
  5. Verify correct BlueSky URL (https://bsky.app/profile/owasp-juice.shop)
  6. Verify page loads without errors

**Expected Results:**
  - About Us page loads with social media section visible
  - BlueSky button is clearly displayed and clickable
  - Clicking BlueSky button opens link appropriately
  - New tab/window opens with BlueSky URL
  - Correct OWASP Juice Shop BlueSky profile URL is accessed
  - BlueSky page loads successfully without errors

#### 6.2. Social Media Links - Twitter Integration

**File:** `tests/social/twitter-link.spec.ts`

**Steps:**
  1. Navigate to About Us page
  2. Locate Twitter social media button
  3. Click on Twitter button
  4. Verify correct Twitter URL opens (https://twitter.com/owasp_juiceshop)
  5. Verify Twitter page loads correctly

**Expected Results:**
  - Twitter button is visible in social media section
  - Twitter link opens when clicked
  - Correct OWASP Juice Shop Twitter profile URL is accessed
  - Twitter page loads successfully

#### 6.3. Social Media Links - Facebook Integration

**File:** `tests/social/facebook-link.spec.ts`

**Steps:**
  1. Navigate to About Us page
  2. Click on Facebook social media button
  3. Verify Facebook URL opens correctly (https://www.facebook.com/owasp.juiceshop)
  4. Verify Facebook page accessibility

**Expected Results:**
  - Facebook button opens correct OWASP Juice Shop Facebook page
  - Facebook page loads without errors
  - URL matches expected Facebook profile link

#### 6.4. Social Media Links - All Platforms Validation

**File:** `tests/social/all-social-links.spec.ts`

**Steps:**
  1. Navigate to About Us page
  2. Verify all social media buttons are present: BlueSky, Mastodon, Twitter, Facebook, Slack, Reddit, Press Kit, NFT
  3. Click each social media link systematically
  4. Verify each link opens to correct destination URL
  5. Verify all links function without JavaScript errors
  6. Check that links open in new tabs (don't navigate away from app)

**Expected Results:**
  - All 8 social media/external links are visible
  - BlueSky links to https://bsky.app/profile/owasp-juice.shop
  - Mastodon links to https://fosstodon.org/@owasp_juiceshop
  - Twitter links to https://twitter.com/owasp_juiceshop
  - Facebook links to https://www.facebook.com/owasp.juiceshop
  - Slack links to https://owasp.org/slack/invite
  - Reddit links to https://www.reddit.com/r/owasp_juiceshop
  - Press Kit links to https://github.com/OWASP/owasp-swag/tree/master/projects/juice-shop
  - NFT links to https://opensea.io/collection/juice-shop
  - All links function properly and open in new tabs
