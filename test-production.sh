#!/bin/bash

echo "=========================================="
echo "Testing Production Deployment"
echo "=========================================="
echo ""

PROD_URL="https://client-intake-form.vercel.app"

echo "1. Testing Health Endpoint..."
HEALTH=$(curl -s "$PROD_URL/api/health")
echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"
echo ""

echo "2. Database Status:"
echo "$HEALTH" | jq -r '.database.records' 2>/dev/null
echo ""

echo "3. Checking for test form token..."
echo "   Note: You need to provide a valid form token to test viewing"
echo ""

echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "To test a specific form, run:"
echo "  curl -s '$PROD_URL/api/forms/{YOUR_TOKEN_HERE}'"
echo ""
echo "Or visit in browser:"
echo "  $PROD_URL/f/{YOUR_TOKEN_HERE}"
echo ""
echo "To check if NEXT_PUBLIC_APP_URL is set correctly:"
echo "  1. Create a new form in the dashboard"
echo "  2. Check the email you receive"
echo "  3. URL should be: $PROD_URL/f/..."
echo "  4. If it's localhost, NEXT_PUBLIC_APP_URL is not set on Vercel"
echo ""