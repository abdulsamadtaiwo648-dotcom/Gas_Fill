#!/bin/bash
# ============================================================
# GasFill Backend — SMTP Environment Setup
# ============================================================
# Run this script to set your email credentials before starting
# the backend server:
#
#   source ./set-smtp-env.sh
#   ./gasfill
#
# OR set them inline:
#   SMTP_USER=youremail@gmail.com SMTP_PASS=yourapppassword ./gasfill
# ============================================================

export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="taiwoabdulsamad1@gmail.com"
export SMTP_PASS="otyz gwbn hrkq ptha"
export SMTP_FROM="GasFill <taiwoabdulsamad1@gmail.com>"

echo "✅ SMTP environment set:"
echo "   Host: $SMTP_HOST:$SMTP_PORT"
echo "   From: $SMTP_FROM"
echo ""
echo "📝 How to create a Gmail App Password:"
echo "   1. Go to https://myaccount.google.com/security"
echo "   2. Enable 2-Step Verification"
echo "   3. Go to App Passwords → Select 'Mail' → Generate"
echo "   4. Paste the 16-character password into SMTP_PASS above"
