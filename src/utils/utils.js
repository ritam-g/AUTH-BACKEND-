export function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000);
}

export function genrateHtmlOtp(otp, email) {

    const verifyLink = `http://localhost:3000/api/auth/verify-email?email=${encodeURIComponent(email)}&otp=${otp}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verify Email</title>
</head>

<body style="font-family: Arial; background:#f4f4f9; padding:20px;">
    <div style="max-width:400px;margin:auto;background:#fff;padding:30px;border-radius:10px;text-align:center;">
        
        <h2>🔐 Verify Your Email</h2>
        <p>Click the button below to verify your email</p>

        <!-- ✅ BUTTON LINK -->
        <a href="${verifyLink}" 
           style="display:inline-block;padding:12px 20px;background:#667eea;color:#fff;
           text-decoration:none;border-radius:6px;margin:20px 0;">
           Verify Email
        </a>

        <!-- OR OTP -->
        <p>Or use this OTP:</p>
        <h1 style="letter-spacing:5px;color:#667eea;">${otp}</h1>

        <p>This link will expire in 10 minutes.</p>
    </div>
</body>
</html>
    `;
}