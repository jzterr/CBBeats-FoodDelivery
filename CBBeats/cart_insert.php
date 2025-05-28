<?php
session_start();
require 'db.php';

header('Content-Type: application/json');

// Turn off HTML error display in production:
ini_set('display_errors', 0);
ini_set('log_errors', 1); // Log to PHP error log

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);

        if (!$data) {
            $data = $_POST;
        }

        $customer_email = $_SESSION['customer_email'] ?? '';
        $cartItems = $data['cartItems'] ?? [];

        if (empty($customer_email) || empty($cartItems)) {
            echo json_encode(["status" => "error", "message" => "Missing customer email or cart items."]);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO cart_items (customer_email, dish_id, dish_name, dish_price, quantity) 
                                VALUES (?, ?, ?, ?, ?)");
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
            exit;
        }

        foreach ($cartItems as $item) {
            $dish_id = (int)($item['dish_id'] ?? 0);
            $dish_name = $item['dish_name'] ?? '';
            $dish_price = (float)($item['dish_price'] ?? 0);
            $quantity = (int)($item['quantity'] ?? 1);

            // If dish_id is 0, likely invalid or missing
            if ($dish_id <= 0) {
                continue; 
            }

            $stmt->bind_param("sisdi", $customer_email, $dish_id, $dish_name, $dish_price, $quantity);
            $stmt->execute();
        }

        echo json_encode(["status" => "success", "message" => "Cart items inserted successfully."]);
    } catch (mysqli_sql_exception $e) {
        // Catch the MySQL error, e.g., foreign key constraint
        echo json_encode([
            "status" => "error",
            "message" => "Database error: " . $e->getMessage()
        ]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>
