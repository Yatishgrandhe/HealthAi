import os
from flask import Flask, request, jsonify
from flask_mail import Mail, Message
from jinja2 import Template
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Flask-Mail config from .env
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

mail = Mail(app)

# PulsePay logo URL (adjust if needed)
LOGO_URL = 'https://pulsepay.com/image.png'  # or use your deployed logo URL

TEMPLATES = {
    'welcome': {
        'subject': 'Welcome to PulsePay - Your Emergency Payment Platform',
        'html': '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to PulsePay</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8f9ff; color: #232946; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(123,97,255,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #E573B7 0%, #7B61FF 60%, #FFD166 100%); color: white; padding: 32px 0; text-align: center; }
    .logo { width: 80px; margin-bottom: 12px; }
    .content { padding: 32px; }
    .button { display: inline-block; background: linear-gradient(90deg, #7B61FF, #E573B7); color: white; padding: 14px 36px; border-radius: 32px; text-decoration: none; font-weight: bold; margin: 24px 0; }
    .footer { text-align: center; color: #888; font-size: 13px; padding: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{ logo_url }}" alt="PulsePay Logo" class="logo" />
      <h1>Welcome to PulsePay</h1>
      <p>Your AI-powered emergency payment platform</p>
    </div>
    <div class="content">
      <h2>Hello {{ user_name }},</h2>
      <p>Thank you for joining PulsePay! We're excited to have you on board.</p>
      <p>With PulsePay, you can:</p>
      <ul>
        <li>Make instant emergency payments</li>
        <li>Benefit from AI-powered security</li>
        <li>Access our global network of partner hospitals</li>
        <li>Enjoy 24/7 support</li>
      </ul>
      <a href="{{ login_url }}" class="button">Get Started</a>
      <p>If you have any questions, just reply to this email or contact our support team.</p>
    </div>
    <div class="footer">&copy; 2024 PulsePay. All rights reserved.</div>
  </div>
</body>
</html>
''',
        'text': 'Welcome, {{ user_name }}! Thank you for joining PulsePay. Login: {{ login_url }}'
    },
    'payment_confirmation': {
        'subject': 'Payment Confirmation - PulsePay',
        'html': '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8f9ff; color: #232946; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(123,97,255,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #E573B7 0%, #7B61FF 60%, #FFD166 100%); color: white; padding: 32px 0; text-align: center; }
    .logo { width: 80px; margin-bottom: 12px; }
    .content { padding: 32px; }
    .receipt { background: #f8f9ff; border-left: 4px solid #7B61FF; padding: 20px; border-radius: 10px; margin: 20px 0; }
    .footer { text-align: center; color: #888; font-size: 13px; padding: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{ logo_url }}" alt="PulsePay Logo" class="logo" />
      <h1>Payment Confirmed</h1>
      <p>Your emergency payment has been processed successfully</p>
    </div>
    <div class="content">
      <h2>Hello {{ user_name }},</h2>
      <p>Your payment has been successfully processed and confirmed.</p>
      <div class="receipt">
        <h3>Payment Details</h3>
        <p><strong>Amount:</strong> {{ amount }} {{ currency }}</p>
        <p><strong>Transaction ID:</strong> {{ tx_hash }}</p>
        <p><strong>Date:</strong> {{ payment_date }}</p>
        <p><strong>Hospital:</strong> {{ hospital_name }}</p>
        <p><strong>Status:</strong> <span style="color: #4CAF50;">Completed</span></p>
      </div>
      <p>Your payment has been sent to the hospital and they have been notified.</p>
      <p>If you have any questions, please contact our support team.</p>
    </div>
    <div class="footer">&copy; 2024 PulsePay. All rights reserved.</div>
  </div>
</body>
</html>
''',
        'text': 'Payment Confirmed for {{ user_name }}: {{ amount }} {{ currency }}, Tx: {{ tx_hash }}, Date: {{ payment_date }}, Hospital: {{ hospital_name }}'
    },
    'alert': {
        'subject': 'Security Alert - PulsePay',
        'html': '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8f9ff; color: #232946; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(123,97,255,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%); color: white; padding: 32px 0; text-align: center; }
    .logo { width: 80px; margin-bottom: 12px; }
    .content { padding: 32px; }
    .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 10px; margin: 20px 0; }
    .footer { text-align: center; color: #888; font-size: 13px; padding: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{ logo_url }}" alt="PulsePay Logo" class="logo" />
      <h1>Security Alert</h1>
      <p>Important account security notification</p>
    </div>
    <div class="content">
      <h2>Hello {{ user_name }},</h2>
      <div class="alert">
        <h3>⚠️ Security Notice</h3>
        <p>{{ alert_message }}</p>
        <p><strong>Action Required:</strong> {{ action_required }}</p>
      </div>
      <p>If you believe this is an error or need assistance, please contact our support team immediately.</p>
      <p>For your security, we recommend:</p>
      <ul>
        <li>Changing your password</li>
        <li>Enabling two-factor authentication</li>
        <li>Reviewing your recent account activity</li>
      </ul>
    </div>
    <div class="footer">&copy; 2024 PulsePay. All rights reserved.</div>
  </div>
</body>
</html>
''',
        'text': 'Security Alert for {{ user_name }}: {{ alert_message }} Action Required: {{ action_required }}'
    }
}

@app.route('/send_email', methods=['POST'])
def send_email():
    data = request.json
    email_type = data.get('type')
    to = data.get('to')
    context = data.get('context', {})
    context['logo_url'] = LOGO_URL
    if email_type not in TEMPLATES:
        return jsonify({'error': 'Invalid email type'}), 400
    tpl = TEMPLATES[email_type]
    subject = tpl['subject']
    html = Template(tpl['html']).render(**context)
    text = Template(tpl['text']).render(**context)
    try:
        msg = Message(subject, recipients=[to], html=html, body=text)
        mail.send(msg)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/test_email/<email_type>', methods=['POST'])
def test_email(email_type):
    # Example test payloads
    test_contexts = {
        'welcome': {
            'user_name': 'Test User',
            'login_url': 'https://pulsepay.com/login'
        },
        'payment_confirmation': {
            'user_name': 'Test User',
            'amount': '100.00',
            'currency': 'USD',
            'tx_hash': '0x123...abc',
            'payment_date': '2024-07-15',
            'hospital_name': 'Metropolitan General Hospital'
        },
        'alert': {
            'user_name': 'Test User',
            'alert_message': 'Suspicious login detected.',
            'action_required': 'Please reset your password.'
        }
    }
    to = request.json.get('to')
    context = test_contexts.get(email_type)
    if not context:
        return jsonify({'error': 'Invalid email type'}), 400
    context['logo_url'] = LOGO_URL
    tpl = TEMPLATES[email_type]
    subject = tpl['subject']
    html = Template(tpl['html']).render(**context)
    text = Template(tpl['text']).render(**context)
    try:
        msg = Message(subject, recipients=[to], html=html, body=text)
        mail.send(msg)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001) 