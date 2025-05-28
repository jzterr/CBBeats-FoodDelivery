<?php
session_start();
require 'db.php';  // Adjust the path if needed

// Check if the admin is logged in
if (!isset($_SESSION['admin_email'])) {
    header("Location: adminlogin.php");
    exit;
}

$admin_email = $_SESSION['admin_email'];

// Fetch admin details as before...
$stmt = $conn->prepare("SELECT username FROM admin_users WHERE email = ?");
$stmt->bind_param("s", $admin_email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $admin = $result->fetch_assoc();
    $admin_name = $admin['username'];
} else {
    $admin_name = "Admin";
}

$stmt->close();

// Query to fetch all dishes from the dishes table
$dishes = [];
$dishQuery = $conn->query("SELECT * FROM dishes ORDER BY created_at DESC");
if ($dishQuery) {
    while ($row = $dishQuery->fetch_assoc()) {
        $dishes[] = $row;
    }
}
$conn->close();
?>



<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin Dashboard</title>
  <link rel="stylesheet" href="adminhomepage.css">
</head>
<body>
  <div class="container">
    <!-- Sidebar -->
    <nav class="sidebar" id="sidebar">
      <div class="profile">
        <img src="../images/pand.png" alt="Logo" class="logo">
        <h2><span>C.B.B</span> <span class="highlight">Eats</span></h2>
                <!-- Dynamic admin name: -->
        <p class="admin-name"><?php echo htmlspecialchars($admin_name); ?></p>
        <span class="admin-role">Admin</span>
      </div>
      <!-- Home Buttons Panel -->
      <div class="menu-panel">
        <div class="button-item ripple" id="homeButton">
          <img src="../images/hom.png" alt="Home">
          <span class="btn-text">Home</span>
        </div>
        <div class="button-item ripple" id="ordersButton">
          <img src="../images/orde.png" alt="Orders">
          <span class="btn-text">Orders</span>
        </div>
        <div class="button-item ripple" id="historyButton">
          <img src="../images/histor.png" alt="History">
          <span class="btn-text">History</span>
        </div>
        <div class="button-item ripple" id="logoutButton">
          <img src="../images/logou.png" alt="Logout">
          <span class="btn-text">Logout</span>
        </div>
      </div>
      <button class="toggle-sidebar" id="toggleSidebar">☰</button>
    </nav>
    
    <!-- Main Content -->
    <main class="main-content">
      <header class="header">
        <div class="search-container">
          <input type="text" placeholder="Search categories or products..." id="searchInput">
          <button class="search-btn ripple">
            <img src="../images/search.png" alt="Search">
          </button>
        </div>
      </header>
      <hr class="line">
      
      <!-- Home Panel: Category Section and Dish Container -->
      <div id="homePanel">
        <div class="top-section">
          <h2 class="category-title">Category</h2>
          <button class="all-items-btn ripple">All Items</button>
        </div>
        <hr class="line">
        <!-- Scrollable Dish Section -->
        <div class="dish-container" id="dishContainer">
          <div class="dish-grid">
            <div class="add-dish ripple">
              <p>Add new <br> ➕ <br> dish</p>
            </div>
                  <?php foreach($dishes as $dish): ?>
        <div class="dish" data-id="<?php echo $dish['id']; ?>">
          <img src="data:image/jpeg;base64,<?php echo base64_encode($dish['image']); ?>" alt="<?php echo htmlspecialchars($dish['name']); ?>">
          <p><?php echo htmlspecialchars($dish['name']); ?></p>
          <span>₱<?php echo htmlspecialchars($dish['price']); ?></span>
          <button class="edit-btn ripple">Edit Dish</button>
        </div>
      <?php endforeach; ?>

            
          </div>
        </div>
      </div>

      <!-- Orders Panel -->
      <div class="orders-container" id="ordersContainer" style="display: none;">

        <!-- Request Section -->
        <div class="order-section" id="requestSection">
          <div class="section-header">
            <h3>Request</h3>
            <div class="section-controls">
              <button class="arrow-btn left">
                <img src="../images/left-arrow.png" alt="Left Arrow">
              </button>
              <button class="arrow-btn right">
                <img src="../images/right.png" alt="Right Arrow">
              </button>
              <span class="see-more">See more...</span>
            </div>
          </div>
          <div class="order-list horizontal-scroll">
            <!-- Example Request Order Item -->
            <div class="order-item ripple"
                 data-customer="John Doe"
                 data-address="123 Main St, Cavite"
                 data-payment="GCash"
                 data-proof="images/gcash-proof.jpg"
                 data-dishes="Burger, Fries, Soda">
              <h3>Example order #1</h3>
              <p>John Doe</p>
              <div class="action-buttons">
                <button class="approve-btn">Approve</button>
                <button class="decline-btn">Decline</button>
              </div>
            </div>
            <!-- You can add additional Request order items here -->
          </div>
        </div>

        <!-- Approved Section -->
        <div class="order-section" id="approvedSection">
          <div class="section-header">
            <h3>Approved</h3>
            <div class="section-controls">
              <button class="arrow-btn left">
                <img src="../images/left-arrow.png" alt="Left Arrow">
              </button>
              <button class="arrow-btn right">
                <img src="../images/right.png" alt="Right Arrow">
              </button>
              <span class="see-more">See more...</span>
            </div>
          </div>
          <div class="order-list horizontal-scroll">
            <!-- Example Approved Order Item -->
            <div class="order-item ripple"
                 data-customer="Alice Brown"
                 data-address="101 First St, Cavite"
                 data-payment="Cash"
                 data-dishes="Sandwich, Coffee">
              <h3>Example order #2</h3>
              <p>Alice Brown</p>
            </div>
            <!-- Additional Approved order items as needed -->
          </div>
        </div>

        <!-- Declined Section -->
        <div class="order-section" id="declinedSection">
          <div class="section-header">
            <h3>Declined</h3>
            <div class="section-controls">
              <button class="arrow-btn left">
                <img src="../images/left-arrow.png" alt="Left Arrow">
              </button>
              <button class="arrow-btn right">
                <img src="../images/right.png" alt="Right Arrow">
              </button>
              <span class="see-more">See more...</span>
            </div>
          </div>
          <div class="order-list horizontal-scroll">
            <!-- Example Declined Order Item -->
            <div class="order-item ripple"
                 data-customer="David Black"
                 data-address="404 Fourth St, Cavite"
                 data-payment="GCash"
                 data-dishes="Burger, Fries, Soda">
              <h3>Example order #3</h3>
              <p>David Black</p>
              <!-- A decline note will be appended here after processing -->
            </div>
            <!-- Additional Declined order items as needed -->
          </div>
        </div>

        <!-- Completed Section -->
        <div class="order-section" id="completedSection">
          <div class="section-header">
            <h3>Completed</h3>
            <div class="section-controls">
              <button class="arrow-btn left">
                <img src="../images/left-arrow.png" alt="Left Arrow">
              </button>
              <button class="arrow-btn right">
                <img src="../images/right.png" alt="Right Arrow">
              </button>
              <span class="see-more">See more...</span>
            </div>
          </div>
          <div class="order-list horizontal-scroll">
            <!-- Example Completed Order Item -->
            <div class="order-item ripple"
                 data-customer="Grace Pink"
                 data-address="707 Seventh St, Cavite"
                 data-payment="Cash"
                 data-dishes="Pizza, Soda">
              <h3>Example order #4</h3>
              <p>Grace Pink</p>
            </div>
            <!-- Additional Completed order items as needed -->
          </div>
        </div>

        <!-- Cancelled Section -->
        <div class="order-section" id="cancelledSection">
          <div class="section-header">
            <h3>Cancelled</h3>
            <div class="section-controls">
              <button class="arrow-btn left">
                <img src="../images/left-arrow.png" alt="Left Arrow">
              </button>
              <button class="arrow-btn right">
                <img src="../images/right.png" alt="Right Arrow">
              </button>
              <span class="see-more">See more...</span>
            </div>
          </div>
          <div class="order-list horizontal-scroll">
            <!-- Example Cancelled Order Item -->
            <div class="order-item ripple"
                 data-customer="Jack Silver"
                 data-address="1010 Tenth St, Cavite"
                 data-payment="Cash"
                 data-dishes="Sandwich, Coffee">
              <h3>Example order #5</h3>
              <p>Jack Silver</p>
              <!-- A cancellation note can be appended here if needed -->
            </div>
            <!-- Additional Cancelled order items as needed -->
          </div>
        </div>

        <!-- New Customer Feedback Section -->
<div class="order-section" id="feedbackSection">
  <div class="section-header">
    <h3>Customer Feedback</h3>
    <div class="section-controls">
      <button class="arrow-btn left">
        <img src="../images/left-arrow.png" alt="Left Arrow">
      </button>
      <button class="arrow-btn right">
        <img src="../images/right.png" alt="Right Arrow">
      </button>
      <span class="see-more">See more...</span>
    </div>
  </div>
  <div class="order-list horizontal-scroll" id="feedbackList">
    <!-- Dynamic Customer Feedback items will appear here -->
  </div>
</div>
      </div>

      <!-- Decline Reason Modal -->
      <div id="declineModal" class="modal" style="display: none;">
        <div class="modal-content">
          <h2>Select Decline Reason</h2>
          <form id="declineForm">
            <label for="declineReason">Reason:</label>
            <select id="declineReason" required>
              <option value="">Select a reason</option>
              <option value="Not within the area">Not within the area</option>
              <option value="GCash proof not legitimate">GCash proof not legitimate</option>
              <option value="GCash payment not received">GCash payment not received</option>
              <option value="Image is blurry">Image is blurry</option>
              <option value="Other">Other</option>
            </select>
            <label for="declineDescription">Description:</label>
            <textarea id="declineDescription" rows="3" placeholder="Provide additional details..." required></textarea>
            <div class="modal-buttons">
              <button type="button" id="cancelDecline" class="cancel-btn">Cancel</button>
              <button type="submit" id="confirmDecline" class="save-btn">Confirm</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Order Info Panel (New Panel) -->
      <div class="order-info-panel" id="orderInfoPanel" style="display: none;">
        <header class="order-info-header">
          <button class="back-btn ripple" id="backToOrders">← Back</button>
          <h2>Order Details</h2>
        </header>
        <div class="order-info-content">
          <!-- Order details will be populated here -->
          <p id="orderDetailsText">Order details will appear here.</p>
          
        </div>
      </div>

     <!-- History Container -->
     <div class="history-container" id="historyContainer" style="display: none;">
  <div class="dashboard">
    <div class="stats">
      <div class="stat-card">
        <h3>Weekly Revenue</h3>
        <p id="weeklyRevenue">$0.00</p>
      </div>
      <div class="stat-card">
        <h3>Monthly Revenue</h3>
        <p id="monthlyRevenue">$0.00</p>
      </div>
      <div class="stat-card">
        <h3>Annual Revenue</h3>
        <p id="annualRevenue">$0.00</p>
      </div>
      <div class="stat-card">
        <h3>Orders per Day</h3>
        <p id="ordersPerDay">0</p>
      </div>
      <div class="stat-card">
        <h3>Orders per Week</h3>
        <p id="ordersPerWeek">0</p>
      </div>
      <div class="stat-card">
        <h3>Orders per Month</h3>
        <p id="ordersPerMonth">0</p>
      </div>
      <div class="stat-card">
        <h3>Most Likely Foods</h3>
        <ul id="mostLikelyFoods">
          <li>Food 1</li>
          <li>Food 2</li>
          <li>Food 3</li>
        </ul>
      </div>
    </div>
    <button class="download-btn" id="downloadExcel">Download Excel</button>
  </div>
</div>


      <!-- History Order Details Panel -->
      <div class="history-info-panel" id="historyInfoPanel" style="display: none;">
        <header class="history-info-header">
          <button class="back-btn ripple" id="backToHistoryOrders">← Back</button>
          <h2>History Order Details</h2>
        </header>
        <div class="history-info-content">
          <p id="historyDetailsText">History order details will appear here.</p>
        </div>
      </div>
    </main>
  </div>

  <!-- Dish Modal Popover -->
  <div id="dishModal" class="modal" style="display: none;">
    <div class="modal-content">
      <h2 id="modalTitle">Add New Dish</h2>
      <form id="dishForm">
        <label for="dishName">Dish Name:</label>
        <input type="text" id="dishName" name="dishName" required>
        
        <label for="dishPrice">Price:</label>
        <input type="number" id="dishPrice" name="dishPrice" required>
        
        <label for="dishImage">Select Image:</label>
        <input type="file" id="dishImage" name="dishImage" accept="image/*" required>
        
        <div class="modal-buttons">
          <!-- Delete button; shown only in edit mode -->
          <button type="button" id="deleteDish" class="delete-btn" style="display: none;">Delete</button>
          <button type="button" id="cancelDish" class="cancel-btn">Cancel</button>
          <button type="submit" id="saveDish" class="save-btn">Save</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Delivered Modal -->
  <div id="deliveredModal" class="modal" style="display: none;">
    <div class="modal-content">
      <h2>Delivered Confirmation</h2>
      <form id="deliveredForm">
        <label for="deliveredProof">Upload Proof Image:</label>
        <input type="file" id="deliveredProof" accept="image/*" required>
        
        <label for="deliveredDescription">Description:</label>
        <textarea id="deliveredDescription" rows="3" placeholder="Enter delivery details..." required></textarea>
        
        <div class="modal-buttons">
          <button type="button" id="cancelDelivered" class="cancel-btn">Cancel</button>
          <button type="submit" id="confirmDelivered" class="save-btn">Confirm</button>
        </div>
      </form>
    </div>
  </div>
  
  <!-- Reference External JavaScript File -->
  <script src="adminhomepage.js"></script>
  <script src="adminorderspage.js"></script>
</body>
</html>
