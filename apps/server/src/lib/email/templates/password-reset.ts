export interface PasswordResetEmailData {
	firstName: string;
	hospitalName: string;
	resetUrl: string;
}

export function getPasswordResetEmailTemplate(
	data: PasswordResetEmailData,
): string {
	const { firstName, hospitalName, resetUrl } = data;

	return `
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px;">
					<h1 style="color: #2563eb; margin-top: 0;">Password Reset Request</h1>
					
					<p>Hello ${firstName},</p>
					
					<p>We received a request to reset your password for your account at <strong>${hospitalName}</strong>.</p>
					
					<p>Click the button below to reset your password:</p>
					
					<div style="text-align: center; margin: 30px 0;">
						<a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
					</div>
					
					<p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
					<p style="background-color: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">${resetUrl}</p>
					
					<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
						<p style="margin: 0; color: #92400e;"><strong>This link will expire in 1 hour.</strong></p>
					</div>
					
					<p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
					
					<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
					
					<p style="color: #6b7280; font-size: 12px;">This is an automated message from ${hospitalName} Hospital Management System.</p>
				</div>
			</body>
		</html>
	`;
}
