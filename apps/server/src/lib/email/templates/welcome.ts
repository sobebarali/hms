export interface WelcomeEmailData {
	firstName: string;
	hospitalName: string;
	username: string;
	temporaryPassword: string;
	loginUrl: string;
}

export function getWelcomeEmailTemplate(data: WelcomeEmailData): string {
	const { firstName, hospitalName, username, temporaryPassword, loginUrl } =
		data;

	return `
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px;">
					<h1 style="color: #2563eb; margin-top: 0;">Welcome to ${hospitalName}</h1>
					
					<p>Hello ${firstName},</p>
					
					<p>Your account has been created at <strong>${hospitalName}</strong>. You can now access the Hospital Management System using the credentials below.</p>
					
					<div style="background-color: white; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
						<p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
						<table style="width: 100%; border-collapse: collapse;">
							<tr>
								<td style="padding: 5px 0; color: #6b7280;">Username (Email):</td>
								<td style="padding: 5px 0;"><strong>${username}</strong></td>
							</tr>
							<tr>
								<td style="padding: 5px 0; color: #6b7280;">Temporary Password:</td>
								<td style="padding: 5px 0;"><strong style="font-family: monospace; background: #e5e7eb; padding: 2px 8px; border-radius: 3px;">${temporaryPassword}</strong></td>
							</tr>
						</table>
					</div>
					
					<div style="text-align: center; margin: 30px 0;">
						<a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Login to Your Account</a>
					</div>
					
					<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
						<p style="margin: 0; color: #92400e;"><strong>Important:</strong> You will be required to change your password on first login.</p>
					</div>
					
					<p><strong>Security Tips:</strong></p>
					<ul style="color: #6b7280;">
						<li>Never share your password with anyone</li>
						<li>Use a strong password with uppercase, lowercase, numbers, and special characters</li>
						<li>Log out after each session when using shared computers</li>
					</ul>
					
					<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
					
					<p style="color: #6b7280; font-size: 12px;">If you did not expect this email, please contact your hospital administrator immediately.</p>
					<p style="color: #6b7280; font-size: 12px;">This is an automated message from ${hospitalName} Hospital Management System.</p>
				</div>
			</body>
		</html>
	`;
}

export function getWelcomeEmailText(data: WelcomeEmailData): string {
	const { firstName, hospitalName, username, temporaryPassword, loginUrl } =
		data;

	return `
Welcome to ${hospitalName}

Hello ${firstName},

Your account has been created at ${hospitalName}. You can now access the Hospital Management System using the credentials below.

Your Login Credentials:
- Username (Email): ${username}
- Temporary Password: ${temporaryPassword}

Login URL: ${loginUrl}

IMPORTANT: You will be required to change your password on first login.

Security Tips:
- Never share your password with anyone
- Use a strong password with uppercase, lowercase, numbers, and special characters
- Log out after each session when using shared computers

If you did not expect this email, please contact your hospital administrator immediately.

This is an automated message from ${hospitalName} Hospital Management System.
	`.trim();
}
