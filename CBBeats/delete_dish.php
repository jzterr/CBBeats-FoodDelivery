<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $dishId = isset($_POST['dishId']) ? intval($_POST['dishId']) : 0;
    
    if ($dishId <= 0) {
        echo json_encode(["status" => "error", "message" => "Invalid dish ID."]);
        exit;
    }
    
    $stmt = $conn->prepare("DELETE FROM dishes WHERE id = ?");
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
        exit;
    }
    $stmt->bind_param("i", $dishId);
    
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Dish deleted successfully."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to delete dish."]);
    }
    
    $stmt->close();
    $conn->close();
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>
