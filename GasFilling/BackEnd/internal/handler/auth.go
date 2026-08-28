package handler

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"net/smtp"
	"os"
	"strings"
	"sync"
	"time"
)

// ────────────────────────────────────────────────
// In-memory OTP store (replaces localStorage)
// ────────────────────────────────────────────────

type otpRecord struct {
	Code      string
	Purpose   string
	ExpiresAt time.Time
}

var (
	otpMu    sync.Mutex
	otpStore = make(map[string]otpRecord) // key: lowercase email
)

// generateOTP returns a secure 6-digit string
func generateOTP() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()+100000), nil
}

// ────────────────────────────────────────────────
// SMTP config — read from environment variables
// Set these before running the backend:
//   SMTP_HOST     e.g. smtp.gmail.com
//   SMTP_PORT     e.g. 587
//   SMTP_USER     your Gmail address
//   SMTP_PASS     your Gmail App Password (not your login password)
//   SMTP_FROM     display from address (defaults to SMTP_USER)
// ────────────────────────────────────────────────

func smtpConfig() (host, port, user, pass, from string) {
	host = os.Getenv("SMTP_HOST")
	port = os.Getenv("SMTP_PORT")
	user = os.Getenv("SMTP_USER")
	pass = os.Getenv("SMTP_PASS")
	from = os.Getenv("SMTP_FROM")

	if host == "" {
		host = "smtp.gmail.com"
	}
	if port == "" {
		port = "587"
	}
	if from == "" {
		from = user
	}
	return
}

// sendOTPEmail tries Resend API first, then falls back to SMTP.
// Priority:
//
//	1. RESEND_API_KEY is set  → use Resend (recommended, free tier)
//	2. SMTP_USER + SMTP_PASS  → use Gmail / any SMTP
//	3. Neither                → log OTP to console only (dev mode)
func sendOTPEmail(toEmail, code, purpose string) error {
	if key := os.Getenv("RESEND_API_KEY"); key != "" {
		return sendViaResend(key, toEmail, code, purpose)
	}

	_, _, user, pass, _ := smtpConfig()
	if user != "" && pass != "" {
		return sendViaSMTP(toEmail, code, purpose)
	}

	log.Printf("[AUTH] No email provider configured — OTP for %s is: %s", toEmail, code)
	return nil
}

// ── Resend (https://resend.com) ──────────────────────────────────────────────
func sendViaResend(apiKey, toEmail, code, purpose string) error {
	subject := "GasFill — Email Verification Code"
	if purpose == "password_reset" {
		subject = "GasFill — Password Reset Code"
	}

	from := os.Getenv("RESEND_FROM")
	if from == "" {
		from = "GasFill <onboarding@resend.dev>" // Resend sandbox sender
	}

	htmlBody := buildEmailHTML(subject, code)

	payload := map[string]interface{}{
		"from":    from,
		"to":      []string{toEmail},
		"subject": subject,
		"html":    htmlBody,
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", "https://api.resend.com/emails", strings.NewReader(string(body)))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		var errBody map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errBody)
		return fmt.Errorf("resend API error %d: %v", resp.StatusCode, errBody)
	}

	log.Printf("[AUTH] OTP email sent via Resend to %s", toEmail)
	return nil
}

// ── Gmail / SMTP ─────────────────────────────────────────────────────────────
func sendViaSMTP(toEmail, code, purpose string) error {
	host, port, user, pass, from := smtpConfig()

	subject := "GasFill — Email Verification Code"
	if purpose == "password_reset" {
		subject = "GasFill — Password Reset Code"
	}

	htmlBody := buildEmailHTML(subject, code)

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s",
		from, toEmail, subject, htmlBody)

	auth := smtp.PlainAuth("", user, pass, host)
	err := smtp.SendMail(host+":"+port, auth, from, []string{toEmail}, []byte(msg))
	if err != nil {
		return err
	}
	log.Printf("[AUTH] OTP email sent via SMTP to %s", toEmail)
	return nil
}

// ── Shared HTML template ─────────────────────────────────────────────────────
func buildEmailHTML(subject, code string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:40px 0;margin:0">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <h2 style="color:#ea580c;margin:0 0 4px;font-size:22px">🔥 GasFill</h2>
    <h3 style="margin:0 0 24px;color:#111;font-size:18px">%s</h3>
    <p style="color:#555;margin:0 0 20px;font-size:15px">Your one-time verification code is:</p>
    <div style="background:#fff7ed;border:2px solid #ea580c;border-radius:10px;padding:28px 24px;text-align:center;margin:0 0 24px">
      <span style="font-size:46px;font-weight:800;letter-spacing:14px;color:#ea580c;font-family:monospace">%s</span>
    </div>
    <p style="color:#888;font-size:13px;margin:0 0 20px">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#bbb;font-size:12px;margin:0">© 2025 GasFill — LPG Marketplace Nigeria</p>
  </div>
</body>
</html>`, subject, code)
}

// ────────────────────────────────────────────────
// POST /api/auth/send-otp
// Body: { "email": "...", "purpose": "registration" | "password_reset" }
// ────────────────────────────────────────────────

func SendOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Email   string `json:"email"`
		Purpose string `json:"purpose"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "error": "invalid request body"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "error": "email is required"})
		return
	}

	purpose := req.Purpose
	if purpose == "" {
		purpose = "verification"
	}

	code, err := generateOTP()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"success": false, "error": "failed to generate OTP"})
		return
	}

	// Store OTP server-side (10 min expiry)
	otpMu.Lock()
	otpStore[email] = otpRecord{
		Code:      code,
		Purpose:   purpose,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}
	otpMu.Unlock()

	// Send email
	if err := sendOTPEmail(email, code, purpose); err != nil {
		log.Printf("[AUTH] Failed to send OTP email to %s: %v", email, err)
		// Still return success — OTP is stored, user can request again
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("OTP sent to %s", email),
	})
}

// ────────────────────────────────────────────────
// POST /api/auth/verify-otp
// Body: { "email": "...", "code": "123456" }
// ────────────────────────────────────────────────

func VerifyOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Email string `json:"email"`
		Code  string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "error": "invalid request body"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	code := strings.TrimSpace(req.Code)

	if email == "" || code == "" {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "error": "email and code are required"})
		return
	}

	otpMu.Lock()
	record, exists := otpStore[email]
	otpMu.Unlock()

	if !exists {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "error": "No OTP request found for this email. Please request a new code."})
		return
	}

	if time.Now().After(record.ExpiresAt) {
		otpMu.Lock()
		delete(otpStore, email)
		otpMu.Unlock()
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "error": "OTP code has expired. Please request a new one."})
		return
	}

	if record.Code != code {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "error": "Invalid OTP code. Please check and try again."})
		return
	}

	// Verified — remove from store
	otpMu.Lock()
	delete(otpStore, email)
	otpMu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Email verified successfully!",
	})
}


