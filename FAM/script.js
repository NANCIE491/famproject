let users = JSON.parse(localStorage.getItem("fam_users")) || [
  { username: "admin", password: "d033e22ae348aeb5660fc2140aec35850c4da997", role: "admin" } // "admin" hashed
];
let records = JSON.parse(localStorage.getItem("fam_records")) || [];
let currentUser = null;

// ---------------- Password Hash ----------------
async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ---------------- Registration ----------------
document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const role = document.getElementById("regRole").value;
  const msg = document.getElementById("registerMessage");

  if (users.some(u => u.username === username)) {
    msg.textContent = "❌ Username already exists";
    msg.style.color = "red";
    return;
  }

  const hashedPassword = await hashPassword(password);
  const newUser = { username, password: hashedPassword, role };
  users.push(newUser);
  localStorage.setItem("fam_users", JSON.stringify(users));

  msg.textContent = "✅ Account created successfully! You can now log in.";
  msg.style.color = "green";
  e.target.reset();
});

// ---------------- Login ----------------
document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;
  const msg = document.getElementById("loginMessage");
  const hashedPassword = await hashPassword(password);

  const user = users.find(u => u.username === username && u.password === hashedPassword && u.role === role);
  if (!user) {
    msg.textContent = "❌ Invalid username/password/role";
    msg.style.color = "red";
    return;
  }

  currentUser = user;
  msg.textContent = `✅ Welcome, ${user.username} (${user.role})`;
  msg.style.color = "green";

  document.getElementById("logoutBtn").classList.remove("hidden");
  document.getElementById("login").classList.add("hidden");
  document.getElementById("register").classList.add("hidden");

  if (user.role === "member") {
    document.getElementById("attendance").classList.remove("hidden");
    document.getElementById("records").classList.add("hidden");
    document.getElementById("memberName").value = user.username;
  } else {
    document.getElementById("records").classList.remove("hidden");
    document.getElementById("attendance").classList.add("hidden");
    renderRecords();
  }
});

// ---------------- Logout ----------------
document.getElementById("logoutBtn").addEventListener("click", () => {
  currentUser = null;
  document.getElementById("login").classList.remove("hidden");
  document.getElementById("register").classList.remove("hidden");
  document.getElementById("attendance").classList.add("hidden");
  document.getElementById("records").classList.add("hidden");
  document.getElementById("logoutBtn").classList.add("hidden");
});

// ---------------- Attendance ----------------
// ---------------- Attendance ----------------
document.getElementById("attendanceForm").addEventListener("submit", e => {
  e.preventDefault();
  if (!currentUser) return;

  const today = new Date();
  const day = today.getDay(); // 0=Sunday, 1=Monday, ..., 3=Wednesday

  if (day !== 3) { // Only allow Wednesday
    alert("❌ Attendance can only be signed on Wednesday.");
    return;
  }

  const record = {
    name: currentUser.username,
    date: today.toLocaleDateString(),
    time: today.toLocaleTimeString()
  };

  // Prevent duplicate signing in same day
  const alreadySigned = records.some(r => r.name === record.name && r.date === record.date);
  if (alreadySigned) {
    alert("⚠️ You have already signed attendance today.");
    return;
  }

  records.push(record);
  localStorage.setItem("fam_records", JSON.stringify(records));
  alert("✅ Attendance signed successfully!");
});


// ---------------- Render Records ----------------
function renderRecords() {
  const tbody = document.querySelector("#attendanceTable tbody");
  tbody.innerHTML = "";
  records.forEach((r, i) => {
    const row = `<tr>
      <td>${i + 1}</td>
      <td>${r.name}</td>
      <td>${r.date}</td>
      <td>${r.time}</td>
    </tr>`;
    tbody.innerHTML += row;
  });
}

// ---------------- Export to Excel ----------------
document.getElementById("exportBtn").addEventListener("click", () => {
  if (records.length === 0) return alert("No records to export!");
  const worksheet = XLSX.utils.json_to_sheet(records);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
  XLSX.writeFile(workbook, "FAM_Attendance.xlsx");
});

// ---------------- Clear Records ----------------
document.getElementById("clearBtn").addEventListener("click", () => {
  if (!confirm("Clear all attendance records?")) return;
  records = [];
  localStorage.removeItem("fam_records");
  renderRecords();
});
