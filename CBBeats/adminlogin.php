<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login Portal</title>
  <link rel="stylesheet" href="adminlogin.css">
</head>
<body>
    <!-- ➤ Back button -->
  <div class="back-btn-wrapper">
    <a href="index.php" class="back-btn">
      &#8592; Home
    </a>
  </div>
  <div class="container" id="container">
    <!-- Red Panel: Login Form -->
    <div class="red-panel">
      <div class="login-content">
        <!-- Admin Login Form (hidden by default) -->
        <div class="admin-form">
          <div class="admin-icon">
            <img src="../images/adminlogo.png" alt="Admin Icon" />
          </div>
          <h2>Admin</h2>
          <div class="login-box">
            <label for="admin-username">Username:</label>
            <input type="text" id="admin-username" placeholder="Enter username" />
            <label for="admin-password">Password:</label>
          <div class="password-wrapper">
            <input type="password" id="admin-password" placeholder="Enter password" />
            <button type="button" class="toggle-password-btn" onclick="togglePassword('admin-password', this)">Show</button>
          </div>

            <div class="button-group">
            <button class="login-btn" onclick="login('admin')">Login as Admin</button>
              <button class="switch-btn" onclick="switchToCustomer()">Customer</button>
            </div>
          </div>
        </div>
        <!-- Customer Login Form (visible by default) -->
        <div class="customer-form">
          <div class="admin-icon">
            <img src="../images/adminlogo.png" alt="Admin Icon" />
          </div>
          <h2>Customer</h2>
          <div class="login-box">
            <label for="customer-username">Username:</label>
            <input type="text" id="customer-username" placeholder="Enter username" />
            <label for="customer-password">Password:</label>
          <div class="password-wrapper">
            <input type="password" id="customer-password" placeholder="Enter password" />
            <button type="button" class="toggle-password-btn" onclick="togglePassword('customer-password', this)">Show</button>
          </div>

            <div class="button-group">
            <button class="login-btn" onclick="login('customer')">Login as Customer</button>
              <button class="switch-btn" onclick="switchToAdmin()">Admin</button>
            </div>
            <div class="create-account">
              <a href="registerform.php">Create an account...</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- White Panel: Logo -->
    <div class="white-panel">
      <img src="../images/pand.png" alt="C.B.B Eats Logo" />
      <h1>
        <span class="cbb">C.B.B</span><span class="eats">Eats</span>
      </h1>
    </div>
  </div>
  <script src="adminlogin.js"></script>
</body>
</html>
