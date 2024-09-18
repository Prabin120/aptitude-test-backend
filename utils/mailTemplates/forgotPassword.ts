const forgotPasswordBody = (name: string, resetLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f7f7f7;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      margin: 0 auto;
    }
    h2 {
      color: #333333;
    }
    p {
      color: #666666;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      color: #ffffff;
      background-color: #007bff;
      text-decoration: none;
      border-radius: 5px;
      font-size: 16px;
    }
    .footer {
      margin-top: 20px;
      color: #999999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Hi ${name},</h2>
    <p>You recently requested to reset the password for your AptiTest account. Click the button below to proceed:</p>
    <a href="${resetLink}" class="button">Reset Password</a>
    <p>If you did not request a password reset, please ignore this email or reply to let us know. This password reset link is only valid for the next <strong>30 minutes</strong>.</p>
    <p>Thanks,<br>The AptiTest Team</p>
    <div class="footer">
      <p>If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:</p>
      <p>${resetLink}</p>
    </div>
  </div>
</body>
</html>
`;

const forgotPasswordSubject = `Password Reset for AptiTest`

export {forgotPasswordBody, forgotPasswordSubject};
