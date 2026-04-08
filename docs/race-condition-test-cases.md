# Race Condition Fix - Test Verification Checklist

**Date Deployed:** April 6, 2026  
**Issue:** Concurrent booking submissions causing duplicate bookings when users submit simultaneously  
**Fix Deployed:** Server-side duplicate validation + UI submission safeguards

---

## Test Cases

### 1. **Concurrent Identical Submissions**
**Scenario:** Two users book the same facility/time slot simultaneously  
**Steps:**
1. Open the app in two browser windows/tabs
2. Navigate to Booking Form in both
3. Select same facility, date, time range, and purpose
4. Both click "Check for Conflicts & Book" simultaneously
5. Observe network requests in DevTools (Network tab)

**Expected Result:**
- [ ] First request succeeds and booking is created
- [ ] Second request fails with error: "This time slot is already booked..."
- [ ] Only ONE booking record created in database
- [ ] User in second window sees clear error message with time range
- [ ] No booking record created for the failed request

---

### 2. **UI Double-Click Prevention**
**Scenario:** Single user clicks submit button twice rapidly  
**Steps:**
1. Open Booking Form
2. Fill in all required fields
3. Click "Check for Conflicts & Book" button twice immediately
4. Monitor DevTools Network tab

**Expected Result:**
- [ ] Only one API create request is sent
- [ ] Second click is ignored (button should be disabled)
- [ ] Button shows loading spinner after first click
- [ ] "Booking already in progress" message appears on DevTools console if second click is attempted

---

### 3. **Recurring Booking with One Week Conflict**
**Scenario:** 4-week recurring booking where week 2 overlaps with existing booking  
**Steps:**
1. Create first booking: April 8-12, 2026, 14:00-15:00, weekly for 4 weeks
2. Wait for confirmation
3. Create second booking: April 15-19, 2026 (week 2), 14:00-15:00, weekly for 4 weeks
4. Observe response

**Expected Result:**
- [ ] First booking succeeds (weeks 1-4 created)
- [ ] Second booking fails during week 2 validation
- [ ] Error message specifies: "already booked on April 15, 2026 from 14:00 to 15:00"
- [ ] No bookings created for the failed series (all or nothing)
- [ ] Database shows only first booking series (4 records with same series ID)

---

### 4. **Auto-Approve Race Condition**
**Scenario:** Two auto-approve facility bookings submitted simultaneously  
**Steps:**
1. Find or create a facility with auto-approve enabled
2. Open app in two browser windows
3. Select same auto-approve facility, date, time
4. Both users click submit simultaneously

**Expected Result:**
- [ ] First booking created with status "Approved" (auto-approved)
- [ ] Second request rejected BEFORE creation with "already booked" error
- [ ] Only ONE approved booking in database (not two duplicates)
- [ ] Second user sees error and must choose different time

---

### 5. **Network Latency Simulation**
**Scenario:** Test with simulated slow network to verify submit button stays locked  
**Steps:**
1. Open Booking Form
2. Open DevTools → Network tab
3. Set throttling to "Slow 3G" or add request delay
4. Fill booking form
5. Click submit
6. Immediately observe button state and try clicking again

**Expected Result:**
- [ ] Button is disabled during request
- [ ] Loading spinner displays
- [ ] Button text changes to indicate progress
- [ ] Second click has no effect (ignored)
- [ ] After response received, button re-enables

---

### 6. **Error Message Clarity**
**Scenario:** Verify error messages are user-friendly  
**Steps:**
1. Create booking: April 10, 14:00-15:00
2. Immediately create conflict booking for same time
3. Observe error message displayed to user

**Expected Result:**
- [ ] Error message format: "This time slot is already booked on [DATE] from [START] to [END]. Please refresh and try another time."
- [ ] Example: "This time slot is already booked on 2026-04-10 from 14:00 to 15:00. Please refresh and try another time."
- [ ] Message is shown in red error box (not console)
- [ ] Message is not a generic "Create failed" message

---

### 7. **Conflicts Array Clearing**
**Scenario:** Verify conflicts are cleared after successful submission  
**Steps:**
1. Open Booking Form
2. Book a facility/time
3. Form shows success message
4. Observe conflicts state

**Expected Result:**
- [ ] After successful submission, conflicts array is empty
- [ ] If you immediately try to book same facility without changing fields, conflicts should show up fresh on next submit attempt
- [ ] Clearing conflicts does not affect other form fields

---

### 8. **Approved Status Not Pre-Blocking**
**Scenario:** Verify that pending bookings also block new bookings (not just approved)  
**Steps:**
1. Create a facility without auto-approve
2. Book facility for April 10, 14:00-15:00 (pending status)
3. In second browser, immediately try to book same time
4. Second request should be rejected even though first is still pending

**Expected Result:**
- [ ] Second booking is rejected with "already booked" error
- [ ] Filter in server-side check includes pending bookings: `cr71a_status ne 406210002` (rejects only rejected status)
- [ ] Pending and approved both block new bookings

---

## Regression Tests

- [ ] Normal booking creation still works (single, non-conflicting bookings)
- [ ] Time conflict detection still shows red dates in calendar picker
- [ ] Recurring bookings work correctly when no conflicts exist
- [ ] Auto-approve feature still works for single bookings in empty slots
- [ ] Manual approval process still works (admins can approve/reject)
- [ ] Blackout date validation still prevents bookings
- [ ] Audit logging still records booking creation

---

## Load/Performance Tests (Optional)

- [ ] Submit 5 rapid concurrent requests → only 1 succeeds, 4 rejected with clear errors
- [ ] Server-side query completes within 500ms (acceptable latency)
- [ ] No database timeouts or connection errors under concurrent load

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| QA Lead | __________ | __________ | ⬜ Pass / ❌ Fail |
| Dev Lead | __________ | __________ | ⬜ Pass / ❌ Fail |
| Product Owner | __________ | __________ | ⬜ Pass / ❌ Fail |

---

## Notes & Issues Found

```
[Document any failures, edge cases, or unexpected behavior here]
```
