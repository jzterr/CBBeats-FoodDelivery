<?php
session_start();
require 'db.php'; // Adjust the path if needed

// Check if the customer is logged in (assumes customerlogin.php sets this session variable)
if (!isset($_SESSION['customer_email'])) {
    header("Location: customerlogin.php"); // Update path if necessary
    exit;
}

$customer_email = $_SESSION['customer_email'];

// Use the correct column name from your database (e.g., 'name' instead of 'username')
$stmt = $conn->prepare("SELECT name FROM customers WHERE email = ?");
$stmt->bind_param("s", $customer_email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $customer = $result->fetch_assoc();
    $customer_name = $customer['name'];  // Using 'name' column
} else {
    $customer_name = "Customer";
}
$dishes = [];
$dishQuery = $conn->query("SELECT * FROM dishes ORDER BY created_at DESC");
if ($dishQuery) {
    while ($row = $dishQuery->fetch_assoc()) {
        $dishes[] = $row;
    }
}

$stmt->close();
$conn->close();
?>


<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Customer Homepage</title>
  <link rel="stylesheet" href="customerhomepage.css">
  <!-- Include the new history panel CSS -->
  <link rel="stylesheet" href="customerhistorypage.css">
</head>
<body>
<script>
  // Pass the dynamic customer name from PHP to JavaScript
  const customerName = "<?php echo htmlspecialchars($customer_name); ?>";
</script>

  <div class="container">
    <!-- Sidebar -->
    <nav class="sidebar" id="sidebar">
      <div class="profile">
        <img src="../images/pand.png" alt="Logo" class="logo">
        <h2><span>C.B.B</span> <span class="highlight">Eats</span></h2>
        <!-- Dynamic customer name: -->
        <p class="user-name"><?php echo htmlspecialchars($customer_name); ?></p>
      </div>
      <div class="menu-panel">
        <div class="button-item ripple" id="homeButton">
          <img src="../images/hom.png" alt="Home">
          <span class="btn-text">Home</span>
        </div>
        <div class="button-item ripple" id="cartButton">
          <img src="../images/orde.png" alt="Cart">
          <span class="btn-text">Cart</span>
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
      
      <!-- Home Panel: Contains Dish Panel and Order Summary Panel -->
      <div id="homePanel" class="home-panel" style="display: flex;">
        <!-- Dish Panel -->
        <div class="dish-panel" id="dishPanel">
          <div class="top-section">
            <h2 class="category-title">Menu</h2>
            <button class="all-items-btn ripple">All Items</button>
          </div>
          <hr class="line">
          <div class="dish-container">
            <div class="dish-grid">
              <!-- Each dish card has data attributes for its name, image, and price -->         
              <!-- Add more dishes as needed -->
              <!-- Dynamic Dish Elements (from database) -->
              <?php foreach ($dishes as $dish): ?>
                <div class="dish ripple" 
                     data-dish-id="<?php echo htmlspecialchars($dish['id']); ?>"
                     data-name="<?php echo htmlspecialchars($dish['name']); ?>"
                     data-price="<?php echo htmlspecialchars($dish['price']); ?>">
                  <img src="data:image/jpeg;base64,<?php echo base64_encode($dish['image']); ?>" 
                       alt="<?php echo htmlspecialchars($dish['name']); ?>">
                  <p><?php echo htmlspecialchars($dish['name']); ?></p>
                  <span>₱<?php echo htmlspecialchars($dish['price']); ?></span>
                  <button class="add-to-cart-button ripple" title="Add to Cart" onclick="event.stopPropagation();">
                    <img src="../images/add-to-cart.png" alt="Add to Cart">
                  </button>
                </div>
              <?php endforeach; ?>
            </div>
          </div>
        </div>
        <!-- Order Summary Panel -->
        <div class="order-summary-panel" id="orderSummaryPanel">
          <div id="orderView">
            <div id="deliveryInfo" style="display: block; margin-top: 10px;">
              <label for="deliveryAddress" style="font-size: 16px; color: #333;">Delivery Address:</label>
              <input type="text" id="deliveryAddress" placeholder="Enter your delivery address" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-top: 5px;">
              <p id="addressErrorMsg" class="error-message" style="display: none;">Address is required.</p>
            </div>
            <!-- New Contact Number Field -->
            <div id="contactInfo" style="margin-top: 10px;">
              <label for="contactNumber">Contact Number:</label>
              <input type="text" id="contactNumber" placeholder="Enter your contact number">
              <p id="contactErrorMsg" class="error-message" style="display: none;">Contact number is required.</p>
            </div>
            <h2 class="order-title">Your Order</h2>
            <div class="order-items" id="orderItems">
              <!-- Selected order items will be added here dynamically -->
            </div>
            <div class="order-total">
              <p>Total: ₱<span id="orderTotal">0</span></p>
            </div>
            <button class="proceed-btn ripple" id="proceedToPayment">Proceed to Payment</button>
          </div>
          <div id="paymentPanel" style="display: none;">
            <div class="payment-type">
              <button class="payment-type-btn" data-payment="cash">Cash</button>
              <button class="payment-type-btn" data-payment="gcash">GCash</button>
            </div>
            <div class="payment-content">
              <div class="cash-info" id="cashInfo">
                <p>You have selected Cash Payment.</p>
              </div>
              <div class="gcash-info" id="gcashInfo" style="display: none;">
                <p>Please scan the QR code below to pay via GCash:</p>
                <img src="../images/qr.jpg" alt="GCash QR Code">
                <p>Please upload proof of payment:</p>
                <input type="file" id="gcashProof" accept="image/*">
                <p id="gcashProofError" class="error-message" style="display: none;">Proof image is required for GCash payment.</p>
                <!-- New GCash Reference Number Textbox -->
                <p>Please enter your GCash reference number:</p>
                <input type="text" id="gcashRef" placeholder="Enter GCash Reference Number">
                <p id="gcashRefError" class="error-message" style="display: none;">Reference number is required for GCash payment.</p>
              </div>
            </div>
            <button class="confirm-btn ripple" id="confirmPayment">Confirm Payment</button>
            <button class="cancel-btn ripple" id="cancelPayment">Cancel</button>
          </div>
        </div>
      </div>
              
            <!-- In the Cart Panel section -->
        <div id="cartPanel" class="cart-panel" style="display: none;">
          <div class="cart-header">
            <h2>Your Cart</h2>
          </div>
          <div class="cart-items">
            <!-- ... existing cart items ... -->
          </div>
          <div class="cart-summary">
            <!-- ... existing summary ... -->
          </div>
          <div class="cart-summary">
              <div class="summary-details">
                <p>Total: <span class="total-amount">₱0</span></p>
              </div>
              <button class="checkout-btn">Checkout</button>
            </div>

          <!-- MOVE THE TRANSACTION POPOVER INSIDE CART PANEL -->
          <div id="transactionPopover" class="transaction-popover">
         <div class="popover-content">
          <h2>Review Your Order</h2>
          <div class="popover-info">
            <p><strong>Customer Name:</strong> <span id="popoverCustomerName"><?php echo htmlspecialchars($customer_name); ?></span></p>
            <p><strong>Order Type:</strong> <span id="popoverOrderType"></span></p>
            <p><strong>Payment Method:</strong> <span id="popoverPaymentMethod"></span></p>
            <p id="deliveryAddressInfo" style="display: none;">
              <strong>Delivery Address:</strong> <span id="popoverDeliveryAddress"></span>
            </p>
            <p><strong>Contact Number:</strong> <span id="popoverContactNumber"></span></p>
            <p><strong>Date & Time:</strong> <span id="popoverDateTime"></span></p>
          </div>
          <div id="proofSection" style="display: none;">
            <p><strong>Proof of Payment:</strong></p>
            <img id="proofPreview" src="" alt="Proof Image" style="max-width: 100%;">
          </div>
          <div id="popoverOrderDetails">
            <!-- Order details will be injected here -->
          </div>
          <p class="popover-total">Total Amount: ₱<span id="popoverTotal">0</span></p>
          <div class="popover-buttons">
            <button id="popoverCancel" class="cancel-btn ripple">Cancel</button>
            <button id="popoverConfirm" class="confirm-btn ripple">Confirm</button>
          </div>
        </div>
      </div>
          </div> 
      
      <!-- History Panel (hidden by default) -->
      <div id="historyContainer" class="history-panel" style="display: none;">
        <!-- Order List Panel -->
        <div id="historyOrderList">
          <!-- Waiting Section -->
          <section class="order-section waiting-section">
            <div class="section-header">
              <h3>Waiting</h3>
              <button class="arrow-btn left"><img src="../images/left-arrow.png" alt="Left"></button>
              <button class="arrow-btn right"><img src="../images/right.png" alt="Right"></button>
              <button class="see-more">See more...</button>
            </div>
            <div class="order-list horizontal-scroll" id="waitingList">
              <!-- Dynamic Request orders will appear here -->
            </div>
          </section>
          <!-- Ongoing Section -->
          <section class="order-section ongoing-section">
            <div class="section-header">
              <h3>Ongoing</h3>
              <button class="arrow-btn left"><img src="../images/left-arrow.png" alt="Left"></button>
              <button class="arrow-btn right"><img src="../images/right.png" alt="Right"></button>
              <button class="see-more">See more...</button>
            </div>
            <div class="order-list horizontal-scroll" id="ongoingList">
              <!-- Dynamic Approved orders will appear here -->
            </div>
          </section>
          <!-- Declined Section -->
          <section class="order-section declined-section">
            <div class="section-header">
              <h3>Declined</h3>
              <button class="arrow-btn left"><img src="../images/left-arrow.png" alt="Left"></button>
              <button class="arrow-btn right"><img src="../images/right.png" alt="Right"></button>
              <button class="see-more">See more...</button>
            </div>
            <div class="order-list horizontal-scroll" id="declinedList">
              <!-- Dynamic Declined orders will appear here -->
            </div>
          </section>
          <!-- Completed Section -->
          <section class="order-section completed-section">
            <div class="section-header">
              <h3>Completed</h3>
              <button class="arrow-btn left"><img src="../images/left-arrow.png" alt="Left"></button>
              <button class="arrow-btn right"><img src="../images/right.png" alt="Right"></button>
              <button class="see-more">See more...</button>
            </div>
            <div class="order-list horizontal-scroll" id="completedList">
              <!-- Dynamic Completed orders will appear here -->
            </div>
          </section>
          <!-- Cancelled Section -->
          <section class="order-section cancelled-section">
            <div class="section-header">
              <h3>Cancelled</h3>
              <button class="arrow-btn left"><img src="../images/left-arrow.png" alt="Left"></button>
              <button class="arrow-btn right"><img src="../images/right.png" alt="Right"></button>
              <button class="see-more">See more...</button>
            </div>
            <div class="order-list horizontal-scroll" id="cancelledList">
              <!-- Dynamic Cancelled orders will appear here -->
            </div>
          </section>
          <!-- Customer Feedback Section: Only visible in History Panel -->
        <div class="customer-feedback">
          <h3>Customer Feedback</h3>
          <textarea id="feedbackText" placeholder="Share your feedback..." rows="5"></textarea>
          <div class="feedback-upload">
            <button id="sendFeedback" title="Send Feedback">
              <img src="../images/paper-plane.png" alt="Send">
            </button>
          </div>
        </div>
      </div>
        
      
        <!-- Order Info Panel for History Orders -->
        <div class="order-info-panel" id="historyInfoPanel" style="display: none;">
          <header class="history-info-header">
            <button class="back-btn ripple" id="backToHistoryOrders">← Back</button>
            <h2>Order Details</h2>
          </header>
          <div class="history-info-content">
            <p id="historyDetailsText">History order details will appear here.</p>
          </div>
        </div>
      
        
      
      <!-- Expanded History Modal (if used elsewhere) -->
      <div id="expandedHistoryModal" class="expanded-history-modal">
        <div class="expanded-history-content">
          <button class="close-modal">Close</button>
          <h2 id="expandedSectionTitle">Section Title</h2>
          <div id="expandedOrderList" class="expanded-order-list">
            <!-- Vertical order list will be inserted here -->
          </div>
        </div>
      </div>
      
      <!-- Transaction Popover (moved outside Order Summary Panel) -->
      <div id="transactionPopover" class="transaction-popover">
        <div class="popover-content">
          <h2>Review Your Order</h2>
          <div class="popover-info">
            <p><strong>Customer Name:</strong> <span id="popoverCustomerName"><?php echo htmlspecialchars($customer_name); ?></span></p>
            <p><strong>Order Type:</strong> <span id="popoverOrderType"></span></p>
            <p><strong>Payment Method:</strong> <span id="popoverPaymentMethod"></span></p>
            <p id="deliveryAddressInfo" style="display: none;">
              <strong>Delivery Address:</strong> <span id="popoverDeliveryAddress"></span>
            </p>
            <p><strong>Contact Number:</strong> <span id="popoverContactNumber"></span></p>
            <p><strong>Date & Time:</strong> <span id="popoverDateTime"></span></p>
          </div>
          <div id="proofSection" style="display: none;">
            <p><strong>Proof of Payment:</strong></p>
            <img id="proofPreview" src="" alt="Proof Image" style="max-width: 100%;">
          </div>
          <div id="popoverOrderDetails">
            <!-- Order details will be injected here -->
          </div>
          <p class="popover-total">Total Amount: ₱<span id="popoverTotal">0</span></p>
          <div class="popover-buttons">
            <button id="popoverCancel" class="cancel-btn ripple">Cancel</button>
            <button id="popoverConfirm" class="confirm-btn ripple">Confirm</button>
          </div>
        </div>
      </div>
      
    </main>
  </div>
  
  <!-- Reference External JavaScript Files -->
  <script src="customerhomepage.js"></script>
  <script src="customercarts.js"></script>
  <script src="customerhistorypage.js"></script>
</body>
</html>
