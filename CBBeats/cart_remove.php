<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    $customer_email = $_SESSION['customer_email'] ?? '';
    $dish_id = (int)($data['dish_id'] ?? 0);

    if (empty($customer_email) || $dish_id <= 0) {
        echo json_encode(["status" => "error", "message" => "Missing customer email or dish id."]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM cart_items WHERE customer_email = ? AND dish_id = ?");
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => $conn->error]);
        exit;
    }
    $stmt->bind_param("si", $customer_email, $dish_id);
    $stmt->execute();
    $stmt->close();
    echo json_encode(["status" => "success", "message" => "Cart item removed successfully."]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>
