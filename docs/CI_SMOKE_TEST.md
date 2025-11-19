#!/bin/bash
set -e

BASE_URL="http://localhost:3000"

echo "1. Visiting dashboard without cookie → expect redirect to /login"
curl -i $BASE_URL/dashboard | grep "Location: /login"

echo "2. Signup with fake email → expect verification required"
# simulate signup (mock Firebase client call)
# expect response: "Verification email sent"

echo "3. Login with unverified email → expect error"
# simulate login
# expect response: "Please verify your email before logging in."

echo "4. Login with verified email → expect session cookie set"
# simulate login with verified account
# expect Set-Cookie: session=...

echo "5. Visit /login with valid cookie → expect redirect to /dashboard/overview"
curl -i --cookie "session=VALID_COOKIE" $BASE_URL/login | grep "Location: /dashboard/overview"

echo "6. Visit /dashboard with valid cookie but unverified → expect redirect to /verify-email"
curl -i --cookie "session=UNVERIFIED_COOKIE" $BASE_URL/dashboard | grep "Location: /verify-email"

echo "7. Logout → expect cookie cleared"
curl -i -X POST $BASE_URL/api/session/logout | grep "logged_out"
