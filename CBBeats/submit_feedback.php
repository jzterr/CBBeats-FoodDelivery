<?php
session_start();
header('Content-Type: application/json');
include 'db.php';

// Ensure the user is logged in as a customer
if (!isset($_SESSION['customer_email'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

$feedbackText = isset($_POST['feedbackText']) ? trim($_POST['feedbackText']) : '';
$customerName = isset($_POST['customerName']) ? trim($_POST['customerName']) : 'Unknown';

if (empty($feedbackText)) {
    echo json_encode(['status' => 'error', 'message' => 'Feedback text is required']);
    exit;
}

// Process image upload if available
$feedbackImage = null;
if (isset($_FILES['feedbackImage']) && $_FILES['feedbackImage']['error'] === UPLOAD_ERR_OK) {
    $feedbackImage = file_get_contents($_FILES['feedbackImage']['tmp_name']);
}

// Prepare SQL statement to insert feedback
$stmt = $conn->prepare("INSERT INTO customer_feedback (customer_name, feedback_text, feedback_image) VALUES (?, ?, ?)");
if ($feedbackImage !== null) {
    // Bind feedback_image as a blob using 'b' type
    $stmt->bind_param("ssb", $customerName, $feedbackText, $feedbackImage);
} else {
    // Bind null for image if not provided
    $null = null;
    $stmt->bind_param("sss", $customerName, $feedbackText, $null);
}

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Feedback submitted successfully']);
} else {
    error_log("Feedback submission error: " . $stmt->error);
    echo json_encode(['status' => 'error', 'message' => 'Error saving feedback']);
}

$stmt->close();
$conn->close();
?>
