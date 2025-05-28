<?php
session_start();
header('Content-Type: application/json');
include 'db.php';

// Determine logged-in user type and email
if (isset($_SESSION['customer_email'])) {
    $customer_email = $_SESSION['customer_email'];
    $userType = 'customer';
} elseif (isset($_SESSION['admin_email'])) {
    $userType = 'admin';
} else {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

$status = isset($_GET['status']) ? $_GET['status'] : '';
if (empty($status)) {
    echo json_encode(['status' => 'error', 'message' => 'Order status not specified']);
    exit;
}

if ($userType === 'customer') {
    // Retrieve the customer's name from the customers table
    $sqlName = "SELECT name FROM customers WHERE email = ?";
    $stmtName = $conn->prepare($sqlName);
    if (!$stmtName) {
        error_log("Database error (name lookup): " . $conn->error);
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
        exit;
    }
    $stmtName->bind_param("s", $customer_email);
    $stmtName->execute();
    $resultName = $stmtName->get_result();
    if ($resultName && $resultName->num_rows > 0) {
        $customer = $resultName->fetch_assoc();
        $customerName = $customer['name'];
    } else {
        // If not found, fallback to using the email
        $customerName = $customer_email;
    }
    $stmtName->close();

    // Retrieve orders only for this customer (matching on customer name)
    $sql = "SELECT id, customer, total, contact, payment_method, proof, order_date, delivery_address 
            FROM orders 
            WHERE status = ? AND customer = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $status, $customerName);
} else {
    // Admin: Retrieve orders regardless of customer
    $sql = "SELECT id, customer, total, contact, payment_method, proof, order_date, delivery_address 
            FROM orders 
            WHERE status = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $status);
}

$stmt->execute();
$result = $stmt->get_result();

if (!$result) {
    echo json_encode(['status' => 'error', 'message' => 'Query failed']);
    exit;
}

$orders = [];
while ($row = $result->fetch_assoc()) {
    if ($row['proof'] !== null) {
        $row['proof'] = base64_encode($row['proof']);
    }
    // For each order, fetch associated order items
    $orderId = $row['id'];
    $items = [];
    $itemsQuery = "SELECT item_name AS name, item_price AS price, quantity AS qty FROM order_items WHERE order_id = ?";
    if ($stmtItems = $conn->prepare($itemsQuery)) {
        $stmtItems->bind_param("i", $orderId);
        $stmtItems->execute();
        $resultItems = $stmtItems->get_result();
        if ($resultItems) {
            $items = $resultItems->fetch_all(MYSQLI_ASSOC);
        }
        $stmtItems->close();
    }
    // Attach order items (or an empty array) to the order data
    $row['orderItems'] = $items;
    $orders[] = $row;
}

echo json_encode(['status' => 'success', 'orders' => $orders]);

$stmt->close();
$conn->close();
?>
