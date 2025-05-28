<?php
// update_order_status.php
session_start();
header('Content-Type: application/json');
include 'db.php';

// Only allow admin access (adjust as needed if customers can also update orders)
if (!isset($_SESSION['admin_email'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$orderId = isset($_POST['orderId']) ? intval($_POST['orderId']) : 0;
$newStatus = isset($_POST['newStatus']) ? $_POST['newStatus'] : '';

error_log("update_order_status.php: Received orderId = $orderId, newStatus = $newStatus");

if (!$orderId || !$newStatus) {
    echo json_encode(['status' => 'error', 'message' => 'Missing parameters']);
    exit;
}

// Validate allowed statuses (optional)
$allowedStatuses = ['Request', 'Approved', 'Declined', 'Completed', 'Cancelled'];
if (!in_array($newStatus, $allowedStatuses)) {
    error_log("update_order_status.php: Invalid status value received: $newStatus");
    echo json_encode(['status' => 'error', 'message' => 'Invalid status value']);
    exit;
}

if ($newStatus === 'Declined') {
    // Expect extra decline parameters.
    $declineReason = isset($_POST['declineReason']) ? $conn->real_escape_string($_POST['declineReason']) : '';
    $declineDescription = isset($_POST['declineDescription']) ? $conn->real_escape_string($_POST['declineDescription']) : '';
    error_log("Decline Data Received: Reason: '" . $declineReason . "' Description: '" . $declineDescription . "'");
    $stmt = $conn->prepare("UPDATE orders SET status = ?, declineReason = ?, declineDescription = ? WHERE id = ?");
    $stmt->bind_param("sssi", $newStatus, $declineReason, $declineDescription, $orderId);
} elseif ($newStatus === 'Completed') {
    // Expect delivered proof (file) and delivered description.
    $deliveredDescription = isset($_POST['deliveredDescription']) ? $conn->real_escape_string($_POST['deliveredDescription']) : '';
    $deliveredProof = null;
    if (isset($_FILES['deliveredProof']) && $_FILES['deliveredProof']['error'] === UPLOAD_ERR_OK) {
        $deliveredProof = file_get_contents($_FILES['deliveredProof']['tmp_name']);
        error_log("Delivered Proof received, size: " . strlen($deliveredProof));
    } else {
        error_log("No deliveredProof file uploaded or error occurred. Error code: " . ($_FILES['deliveredProof']['error'] ?? 'none'));
    }
    error_log("Delivered Description Received: '" . $deliveredDescription . "'");
    $stmt = $conn->prepare("UPDATE orders SET status = ?, deliveredProof = ?, deliveredDescription = ? WHERE id = ?");
    $stmt->bind_param("sssi", $newStatus, $deliveredProof, $deliveredDescription, $orderId);
} else {
    // For other statuses, update only the status.
    $stmt = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->bind_param("si", $newStatus, $orderId);
}

if ($stmt->execute()) {
    error_log("update_order_status.php: Order updated successfully.");
    echo json_encode(['status' => 'success', 'message' => 'Status updated successfully']);
} else {
    $error = $stmt->error;
    error_log("update_order_status.php: Error updating status: " . $error);
    echo json_encode(['status' => 'error', 'message' => 'Error updating status: ' . $error]);
}

$stmt->close();
$conn->close();
?>
