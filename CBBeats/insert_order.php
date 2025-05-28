<?php
// insert_order.php

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed']);
    exit;
}

header('Content-Type: application/json');
include 'db.php';

$customer = isset($_POST['customer']) ? $conn->real_escape_string($_POST['customer']) : '';
$total    = isset($_POST['total']) ? $conn->real_escape_string($_POST['total']) : 0;
$contact  = isset($_POST['contact']) ? $conn->real_escape_string($_POST['contact']) : '';
$orderType = isset($_POST['orderType']) ? $conn->real_escape_string($_POST['orderType']) : 'delivery';
$deliveryAddress = isset($_POST['deliveryAddress']) ? $conn->real_escape_string($_POST['deliveryAddress']) : '';
$paymentMethod = isset($_POST['payment_method']) ? $conn->real_escape_string($_POST['payment_method']) : 'cash';
// Validate payment_method to be either 'gcash' or 'cash'
$paymentMethod = (strtolower($paymentMethod) === 'gcash') ? 'gcash' : 'cash';

// Retrieve order items from JSON string
$orderItems = [];
if (isset($_POST['orderItems'])) {
    $orderItems = json_decode($_POST['orderItems'], true);
}

// Handle file upload for proof (if provided)
$proofData = null;
if (isset($_FILES['gcashProof']) && $_FILES['gcashProof']['error'] === UPLOAD_ERR_OK) {
    $proofData = file_get_contents($_FILES['gcashProof']['tmp_name']);
} 

// Insert order into orders table. (Status defaults to 'Request')
$stmt = $conn->prepare("INSERT INTO orders (customer, total, contact, order_type, delivery_address, payment_method, proof, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Request')");
$stmt->bind_param("sdsssss", $customer, $total, $contact, $orderType, $deliveryAddress, $paymentMethod, $proofData);

if ($stmt->execute()) {
    $order_id = $conn->insert_id;
    
    // Insert order items into order_items table, if any
    if (!empty($orderItems) && is_array($orderItems)) {
        foreach ($orderItems as $item) {
            $itemName = $conn->real_escape_string($item['name']);
            $itemPrice = floatval($item['price']);
            $itemQty = intval($item['qty']);
            $sqlItem = "INSERT INTO order_items (order_id, item_name, item_price, quantity) VALUES ('$order_id', '$itemName', '$itemPrice', '$itemQty')";
            $conn->query($sqlItem);
        }
    }
    
    echo json_encode(['status' => 'success', 'message' => 'Order inserted successfully.', 'order_id' => $order_id]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Error: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>
