<?php
session_start();
header('Content-Type: application/json');
include 'db.php';

$isAdmin = false;
if (isset($_SESSION['admin_email'])) {
    $isAdmin = true;
} elseif (!isset($_SESSION['customer_email'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

// Allow status to be passed as a GET parameter (default to 'Request')
$status = isset($_GET['status']) ? $_GET['status'] : "Request";

if ($isAdmin) {
    $sql = "SELECT id, customer, total, contact, payment_method, proof, order_date, delivery_address, status, 
                   declineReason, declineDescription, deliveredProof, deliveredDescription
            FROM orders 
            WHERE status = ? 
            ORDER BY order_date DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $status);
} else {
    $customerEmail = $_SESSION['customer_email'];
    $sqlName = "SELECT name FROM customers WHERE email = ?";
    $stmtName = $conn->prepare($sqlName);
    $stmtName->bind_param("s", $customerEmail);
    $stmtName->execute();
    $resultName = $stmtName->get_result();
    $customerName = ($resultName && $resultName->num_rows > 0) ? $resultName->fetch_assoc()['name'] : $customerEmail;
    $stmtName->close();
    
    $sql = "SELECT id, customer, total, contact, payment_method, proof, order_date, delivery_address, status, 
                   declineReason, declineDescription, deliveredProof, deliveredDescription
            FROM orders 
            WHERE status = ? AND customer = ? 
            ORDER BY order_date DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $status, $customerName);
}

$stmt->execute();
$result = $stmt->get_result();

if (!$result) {
    echo json_encode(['status' => 'error', 'message' => 'Query failed']);
    exit();
}

$orders = [];
while ($row = $result->fetch_assoc()) {
    if ($row['proof'] !== null) {
        $row['proof'] = base64_encode($row['proof']);
    }
    if ($row['deliveredProof'] !== null) {
        $row['deliveredProof'] = base64_encode($row['deliveredProof']);
    }
    // Retrieve associated order items.
    $orderId = $row['id'];
    $items = [];
    $itemsQuery = "SELECT item_name AS name, item_price AS price, quantity AS qty FROM order_items WHERE order_id = ?";
    if ($stmtItems = $conn->prepare($itemsQuery)) {
        $stmtItems->bind_param("i", $orderId);
        $stmtItems->execute();
        $resultItems = $stmtItems->get_result();
        $items = $resultItems->fetch_all(MYSQLI_ASSOC);
        $stmtItems->close();
    }
    $row['orderItems'] = $items;
    $orders[] = $row;
}

echo json_encode(['status' => 'success', 'orders' => $orders]);

$stmt->close();
$conn->close();
?>
