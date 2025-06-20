const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Return a simple HTML form
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Email Sender</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; background: #f4f4f4; }
          form { max-width: 400px; margin: auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          input, textarea { width: 100%; padding: 0.5rem; margin: 0.5rem 0; }
          button { padding: 0.5rem 1rem; background: #0070f3; color: white; border: none; cursor: pointer; }
        </style>
      </head>
      <body>
        <form method="POST" action="/api/send-email">
          <h2>Send Email</h2>
          <input type="email" name="receiver_email" placeholder="Receiver Email" required />
          <input type="text" name="subject" placeholder="Subject" required />
          <textarea name="body_text" placeholder="Message" rows="5" required></textarea>
          <button type="submit">Send</button>
        </form>
      </body>
      </html>
    `);
  }

  if (req.method === 'POST') {
    const body =
      req.headers['content-type'] === 'application/json'
        ? req.body
        : Object.fromEntries(new URLSearchParams(await getRawBody(req)));

    const { receiver_email, subject, body_text } = body;

    if (!receiver_email || !subject || !body_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: receiver_email,
        subject: subject,
        text: body_text,
      });

      if (req.headers['content-type'] === 'application/json') {
        return res.status(200).json({ message: 'Email sent successfully' });
      } else {
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(`<p>Email sent successfully to ${receiver_email}!</p><a href="/api/send-email">Go Back</a>`);
      }

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

// Helper to read raw form data for x-www-form-urlencoded
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => { resolve(data); });
    req.on('error', err => { reject(err); });
  });
}

