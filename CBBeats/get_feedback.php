<?php
session_start();
header('Content-Type: application/json');
require 'db.php';

// Only allow admin access
if (!isset($_SESSION['admin_email'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    exit;
}

// Query the customer_feedback table (assumed table name)
$sql = "SELECT id, customer_name, feedback_text, feedback_image, created_at FROM customer_feedback ORDER BY created_at DESC";
$result = $conn->query($sql);

if (!$result) {
    echo json_encode(['status' => 'error', 'message' => 'Query failed']);
    exit;
}

$feedbacks = [];
while ($row = $result->fetch_assoc()) {
    if ($row['feedback_image'] !== null) {
        $row['feedback_image'] = base64_encode($row['feedback_image']);
    }
    $feedbacks[] = $row;
}

echo json_encode(['status' => 'success', 'feedbacks' => $feedbacks]);
$conn->close();
?>
