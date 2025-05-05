require('dotenv').config(); // Load biến môi trường từ .env

const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Phục vụ file tĩnh từ thư mục "public"
app.use(express.static(path.join(__dirname, 'public')));

// Đọc mã từ file json
let codes = require('./codes.json');

// Route hiển thị form HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// Route xác nhận sau khi đăng ký
app.get('/confirm', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'confirm.html')); // Đảm bảo đúng đường dẫn tới file confirm.html
});

// Gửi mail
const sendMail = (email, code) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: '2FA CODE',
    text: `UR CODE: ${code}. APPLY TO BE GAY`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Lỗi gửi mail:', error);
    } else {
      console.log('Email đã gửi:', info.response);
    }
  });
};

// Xử lý POST /register
app.post('/register', (req, res) => {
  const { fullName, age, discordId, email, playTime, purpose, rules, gay } = req.body;

  if (!rules) {
    return res.send(`<h2>Bạn phải đồng ý với luật lệ của server!</h2>`);
  }

  const code = crypto.randomBytes(3).toString('hex').toUpperCase();

  codes[discordId] = {
    code,
    fullName,
    age,
    email,
    playTime,
    purpose,
    gay,
    used: false
  };

  fs.writeFileSync('./codes.json', JSON.stringify(codes, null, 2));

  sendMail(email, code);

  // Chuyển hướng tới trang confirm
  res.redirect('/confirm');
});

// API xác minh mã
app.post('/api/verify-code', (req, res) => {
  const { discordId, code } = req.body;

  if (codes[discordId] && codes[discordId].code === code && !codes[discordId].used) {
    codes[discordId].used = true;
    fs.writeFileSync('./codes.json', JSON.stringify(codes, null, 2));
    return res.json({ valid: true });
  }

  return res.json({ valid: false });
});

// Chạy server
app.listen(port, () => {
  console.log(`✅ Server chạy tại http://localhost:${port}`);
});
