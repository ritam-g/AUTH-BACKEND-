import sendEmail from './src/services/mail.service.js';

const testEmail = async () => {
    try {
        console.log('Attempting to send test email to ritammaty@gmail.com...');
        await sendEmail(
            'ritammaty@gmail.com',
            'Test Email from Node.js',
            'If you see this, nodemailer is working!',
            '<h1>Test Email</h1><p>If you see this, <b>nodemailer</b> is correctly configured and working!</p>'
        );
        console.log('Test email sent successfully!');
    } catch (error) {
        console.error('Failed to send test email:', error.message);
        if (error.code === 'EAUTH') {
            console.log('\n--- Troubleshooting Tip ---');
            console.log('Authentication Error: This usually means the email or password in your .env is incorrect.');
            console.log('If you are using Gmail, you MUST use an "App Password" instead of your regular password.');
            console.log('To get an App Password:');
            console.log('1. Go to your Google Account -> Security.');
            console.log('2. Enable 2-Step Verification if it\'s not already on.');
            console.log('3. Search for "App passwords" in the search bar at the top.');
            console.log('4. Create a new one for "Mail" and "Other (Custom name)".');
            console.log('5. Use that 16-character code as the PASS variable in your .env');
        }
    } finally {
        // Exit the process so the script finishes
        process.exit();
    }
};

testEmail();
