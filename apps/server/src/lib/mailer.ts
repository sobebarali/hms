import { MailtrapTransport } from "mailtrap";
import nodemailer from "nodemailer";

// Looking to send emails in production? Check out our Email API/SMTP product!
export const devTransporter = nodemailer.createTransport({
	host: process.env.MAILTRAP_HOST ?? "sandbox.smtp.mailtrap.io",
	port: Number(process.env.MAILTRAP_PORT) ?? 2525,
	auth: {
		user: process.env.MAILTRAP_USER ?? "",
		pass: process.env.MAILTRAP_PASS ?? "",
	},
});

export const prodTransporter = nodemailer.createTransport(
	MailtrapTransport({
		token: process.env.MAILTRAP_API_TOKEN || "",
		testInboxId: Number.parseInt(process.env.MAILTRAP_TEST_INBOX_ID || "0", 10),
	}),
);

// Email sender configuration
export const emailConfig = {
	from: process.env.EMAIL_FROM || "hello@example.com",
	fromName: process.env.EMAIL_FROM_NAME || "useHely",
};

// Helper function to send emails
export async function sendEmail({
	to,
	subject,
	text,
	html,
	category,
}: {
	to: string | string[];
	subject: string;
	text?: string;
	html?: string;
	category?: string;
}) {
	// Skip sending emails in test environment
	if (process.env.NODE_ENV === "test") {
		console.log("[TEST MODE] Email not sent:", { to, subject, category });
		return { messageId: "test-message-id" };
	}

	const mailOptions = {
		from: {
			address: emailConfig.from,
			name: emailConfig.fromName,
		},
		to,
		subject,
		text,
		html,
		category: category || "General",
		sandbox: process.env.NODE_ENV !== "production",
	};

	if (process.env.NODE_ENV === "production") {
		return await prodTransporter.sendMail(mailOptions);
	}

	const transporter = devTransporter;

	return await transporter.sendMail(mailOptions);
}
