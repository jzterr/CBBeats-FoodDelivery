<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

// Ensure the request method is POST.
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    $customer_email = $_SESSION['customer_email'] ?? '';
    if (empty($customer_email) || empty($data)) {
        echo json_encode(["status" => "error", "message" => "Missing customer email or cart data."]);
        exit;
    }

    $dish_id = (int)($data['dish_id'] ?? 0);
    $dish_name = $data['dish_name'] ?? '';
    $dish_price = (float)($data['dish_price'] ?? 0);
    $quantity = (int)($data['quantity'] ?? 1);

    if ($dish_id <= 0 || empty($dish_name)) {
        echo json_encode(["status" => "error", "message" => "Invalid dish data."]);
        exit;
    }

    // Use INSERT ... ON DUPLICATE KEY UPDATE. 
    // Ensure that your cart_items table has a UNIQUE KEY on (customer_email, dish_id)
    $sql = "INSERT INTO cart_items (customer_email, dish_id, dish_name, dish_price, quantity)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
        exit;
    }
    $stmt->bind_param("sisiii", $customer_email, $dish_id, $dish_name, $dish_price, $quantity, $quantity);
    $stmt->execute();
    $stmt->close();
    echo json_encode(["status" => "success", "message" => "Cart item added/updated successfully."]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>
