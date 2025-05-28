<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Register Form</title>
  <link rel="stylesheet" href="registerformstyle.css">
</head>
<body>
  <div class="container">
    <div class="register-box">
      <h2>Register Now</h2>
      <form id="registerForm">
        <input type="text" id="name" placeholder="Enter your name" required>
        <input type="email" id="email" placeholder="Enter your email" required>
        <input type="password" id="password" placeholder="Enter your password" required>
        <input type="password" id="confirm_password" placeholder="Confirm your password" required>
        <button type="submit">Register Now</button>
        <button type="button" onclick="window.location.href='adminlogin.php'">Cancel</button>
      </form>
    </div>
  </div>
  <script>
  document.getElementById("registerForm").addEventListener("submit", async function(event) {
      event.preventDefault();

      let name = document.getElementById("name").value;
      let email = document.getElementById("email").value;
      let password = document.getElementById("password").value;
      let confirm_password = document.getElementById("confirm_password").value;

      const response = await fetch("register.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&confirm_password=${encodeURIComponent(confirm_password)}`
      });

      const result = await response.json();
      alert(result.message);
      
      if (result.status === "success") {
          window.location.href = "adminlogin.php";
      }
  });
  </script>
</body>
</html>
